/**
 * Sarvam AI Indian Speech API Provider Stub
 * 
 * SECURITY NOTE:
 * Do NOT place Sarvam AI or any third-party API keys in frontend client code.
 * When real Sarvam AI models are activated, frontend requests must be forwarded
 * through a secure backend proxy (e.g. /api/voice/tts and /api/voice/stt)
 * where authentication tokens and quotas are managed safely.
 */

import type { TextToSpeech, SpeechToText, VoiceOptions } from './types';

export class SarvamTTS implements TextToSpeech {
  private audio: HTMLAudioElement | null = null;
  private speaking = false;
  private readonly cache = new Map<string, string>();

  public isSupported(): boolean {
    return typeof window !== 'undefined';
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }

  public stop(): void {
    if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; }
    this.speaking = false;
  }

  public async speak(text: string, lang?: string, options?: VoiceOptions): Promise<void> {
    if (!this.isSupported()) { options?.onError?.(new Error('Sarvam voice service is not configured.')); return; }
    this.stop();
    // Preserve Sarvam's detected BCP-47 code so the audio answer matches the
    // language in which the user spoke, not merely the UI language.
    const language = /^[a-z]{2,3}-IN$/i.test(lang || '')
      ? String(lang)
      : lang?.startsWith('hi')
        ? 'hi-IN'
        : lang?.startsWith('mr')
          ? 'mr-IN'
          : 'en-IN';
    const cacheKey = `${language}:${text}`;
    try {
      let audioUrl = this.cache.get(cacheKey);
      if (!audioUrl) {
        const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/voice/synthesize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language }) });
        if (!response.ok) throw new Error(`Sarvam voice request failed (${response.status}).`);
        const blob = await response.blob();
        if (!blob.size) throw new Error('Sarvam voice service returned no audio.');
        audioUrl = URL.createObjectURL(blob); this.cache.set(cacheKey, audioUrl);
      }
      const audio = new Audio(audioUrl); this.audio = audio;
      audio.onplay = () => { this.speaking = true; options?.onStart?.(); };
      audio.onended = () => { this.speaking = false; options?.onEnd?.(); };
      audio.onerror = () => { this.speaking = false; options?.onError?.(new Error('Sarvam audio playback failed.')); };
      await audio.play();
    } catch (error) { this.speaking = false; options?.onError?.(error); }
  }
}

export class SarvamSTT implements SpeechToText {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private recordingTimeout: ReturnType<typeof window.setTimeout> | null = null;
  private listening = false;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';
  }

  public isListening(): boolean {
    return this.listening;
  }

  public start(
    lang: string,
    onResult: (transcript: string, isFinal: boolean, detectedLanguage?: string) => void,
    onError?: (error: unknown) => void
  ): void {
    if (this.listening) this.stop();
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      this.stream = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      this.recorder = recorder;
      this.listening = true;
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { this.listening = false; onError?.(new Error('Unable to record audio.')); };
      recorder.onstop = async () => {
        if (this.recordingTimeout) {
          window.clearTimeout(this.recordingTimeout);
          this.recordingTimeout = null;
        }
        this.listening = false;
        stream.getTracks().forEach((track) => track.stop());
        if (!chunks.length) {
          onError?.(new Error('No microphone audio was captured.'));
          return;
        }
        try {
          const formData = new FormData();
          // Chromium records WebM/Opus, but Sarvam validates the multipart
          // part as `audio/webm` (the `;codecs=opus` MIME suffix is rejected).
          formData.append('file', new Blob(chunks, { type: 'audio/webm' }), 'voice-message.webm');
          formData.append('model', 'saaras:v4');
          // Saaras v4 auto-detects only when the documented BCP-47 value
          // `unknown` is used. `mode` is a v3-only option.
          formData.append('language_code', lang?.startsWith('hi') ? 'hi-IN' : lang?.startsWith('mr') ? 'mr-IN' : 'unknown');
          formData.append('keyterms', JSON.stringify(['Vaid Disha', 'OPD', 'Pharmacy', 'Reception', 'Emergency']));
          const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
          const response = await fetch(`${baseUrl}/voice/transcribe`, { method: 'POST', body: formData });
          if (!response.ok) throw new Error(`Sarvam transcription failed (${response.status}).`);
          const data = await response.json() as { transcript?: string; language?: string };
          const transcript = data.transcript?.trim();
          if (!transcript) throw new Error('No speech was detected.');
          onResult(transcript, true, data.language || 'unknown');
        } catch (error) { onError?.(error); }
      };
      recorder.start();
      // Saaras REST recordings are short. End the turn automatically so an
      // elderly user only needs to tap once, speak, and wait for the answer.
      this.recordingTimeout = window.setTimeout(() => this.stop(), 25_000);
    }).catch(onError);
  }

  public stop(): void {
    if (this.recordingTimeout) {
      window.clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    else this.stream?.getTracks().forEach((track) => track.stop());
    this.listening = false;
  }
}
