/**
 * Fast Voice Provider for Vaid Disha
 * 
 * Provides ultra-low latency Speech-to-Text (STT) and Text-to-Speech (TTS).
 * Prioritizes native browser Web Speech API for 0-latency streaming and playback,
 * with automatic fallback to Groq Whisper and server synthesis.
 */

import type { TextToSpeech, SpeechToText, VoiceOptions } from './types';
import { WebSpeechTTS, WebSpeechSTT } from './webSpeech';

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY || '').trim();

/**
 * Fast Hybrid Speech-to-Text
 */
export class FastSTT implements SpeechToText {
  private webSpeechSTT: WebSpeechSTT;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private listening = false;
  private silenceTimer: ReturnType<typeof window.setTimeout> | null = null;

  constructor() {
    this.webSpeechSTT = new WebSpeechSTT();
  }

  public isSupported(): boolean {
    if (this.webSpeechSTT.isSupported()) return true;
    return (
      typeof window !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  public isListening(): boolean {
    return this.listening || this.webSpeechSTT.isListening();
  }

  public start(
    lang: string,
    onResult: (transcript: string, isFinal: boolean, detectedLanguage?: string) => void,
    onError?: (error: unknown) => void
  ): void {
    if (this.isListening()) {
      this.stop();
    }

    // 1. If native WebSpeech is supported, use it for zero-latency streaming
    if (this.webSpeechSTT.isSupported()) {
      try {
        this.webSpeechSTT.start(
          lang,
          (transcript, isFinal) => {
            onResult(transcript, isFinal, lang);
          },
          (err) => {
            // If WebSpeech permission was blocked or errored, try MediaRecorder fallback
            console.warn('WebSpeech STT error, trying Groq Whisper fallback:', err);
            this.startMediaRecorderSTT(lang, onResult, onError);
          }
        );
        return;
      } catch {
        // Fall back to MediaRecorder
      }
    }

    // 2. Fallback to MediaRecorder + Groq Whisper
    this.startMediaRecorderSTT(lang, onResult, onError);
  }

  private startMediaRecorderSTT(
    lang: string,
    onResult: (transcript: string, isFinal: boolean, detectedLanguage?: string) => void,
    onError?: (error: unknown) => void
  ): void {
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        this.stream = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];
        this.recorder = recorder;
        this.listening = true;

        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };

        recorder.onerror = () => {
          this.listening = false;
          onError?.(new Error('Audio recording error.'));
        };

        recorder.onstop = async () => {
          this.listening = false;
          stream.getTracks().forEach((t) => t.stop());
          if (!chunks.length) {
            onError?.(new Error('No microphone audio was captured.'));
            return;
          }

          try {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice.webm');
            formData.append('model', 'whisper-large-v3-turbo');
            if (lang) {
              const code = lang.slice(0, 2);
              if (code === 'en' || code === 'hi' || code === 'mr') {
                formData.append('language', code);
              }
            }

            // Try backend /api/voice/transcribe first
            let transcript = '';
            const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
            try {
              const res = await fetch(`${baseUrl}/voice/transcribe`, {
                method: 'POST',
                body: formData,
              });
              if (res.ok) {
                const data = await res.json();
                transcript = data.transcript?.trim() || '';
              }
            } catch {
              // try direct Groq API
            }

            // Fall back to direct Groq Whisper API
            if (!transcript && GROQ_API_KEY) {
              const groqRes = await fetch(GROQ_WHISPER_URL, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${GROQ_API_KEY}`,
                },
                body: formData,
              });
              if (groqRes.ok) {
                const groqData = await groqRes.json();
                transcript = groqData.text?.trim() || '';
              }
            }

            if (!transcript) {
              throw new Error('No speech could be recognized. Please try again.');
            }

            onResult(transcript, true, lang);
          } catch (err) {
            onError?.(err);
          }
        };

        recorder.start();
        // Auto-stop after 15 seconds max if user doesn't stop
        this.silenceTimer = window.setTimeout(() => this.stop(), 15_000);
      })
      .catch((err) => {
        this.listening = false;
        onError?.(err);
      });
  }

  public stop(): void {
    if (this.silenceTimer) {
      window.clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.webSpeechSTT.isListening()) {
      this.webSpeechSTT.stop();
    }
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    } else {
      this.stream?.getTracks().forEach((track) => track.stop());
    }
    this.listening = false;
  }
}

/**
 * Fast Text-to-Speech
 * Uses WebSpeech for instant device speech playback with zero delay.
 */
export class FastTTS implements TextToSpeech {
  private webTTS: WebSpeechTTS;

  constructor() {
    this.webTTS = new WebSpeechTTS();
  }

  public isSupported(): boolean {
    return this.webTTS.isSupported();
  }

  public isSpeaking(): boolean {
    return this.webTTS.isSpeaking();
  }

  public stop(): void {
    this.webTTS.stop();
  }

  public async speak(text: string, lang?: string, options?: VoiceOptions): Promise<void> {
    // WebSpeechTTS provides instant device speech output without waiting for audio downloads
    return this.webTTS.speak(text, lang, options);
  }
}
