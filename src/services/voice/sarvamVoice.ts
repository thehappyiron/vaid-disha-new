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
  public isSupported(): boolean {
    // Return false until backend proxy endpoint is configured
    return false;
  }

  public isSpeaking(): boolean {
    return false;
  }

  public stop(): void {
    // TODO: Cancel ongoing audio stream playback when backend audio is playing
  }

  public async speak(_text: string, _lang?: string, options?: VoiceOptions): Promise<void> {
    // TODO: Call backend POST /api/voice/sarvam-tts with { text, language: 'hi-IN' | 'mr-IN' | 'en-IN' }
    // Fetch streaming audio or base64 WAV, and play via HTML5 Audio API.
    options?.onError?.(new Error('Sarvam TTS stub: backend endpoint not configured yet.'));
  }
}

export class SarvamSTT implements SpeechToText {
  public isSupported(): boolean {
    // Return false until backend proxy WebSocket or audio upload endpoint is configured
    return false;
  }

  public isListening(): boolean {
    return false;
  }

  public start(
    _lang: string,
    _onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: unknown) => void
  ): void {
    // TODO: Record microphone audio chunk using MediaRecorder and stream/post to /api/voice/sarvam-stt
    onError?.(new Error('Sarvam STT stub: backend endpoint not configured yet.'));
  }

  public stop(): void {
    // TODO: Stop MediaRecorder stream
  }
}
