/**
 * Voice Service Types for Vaid Disha
 * 
 * Provides unified interfaces for Text-to-Speech (TTS) and Speech-to-Text (STT)
 * with multi-language support (English, Hindi, Marathi).
 */

export interface VoiceOptions {
  lang?: string; // 'en' | 'hi' | 'mr' or 'en-IN' | 'hi-IN' | 'mr-IN'
  rate?: number; // 0.85 - 0.95 for clear comprehension
  pitch?: number; // 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export interface TextToSpeech {
  speak(text: string, lang?: string, options?: VoiceOptions): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
  isSupported(): boolean;
}

export interface SpeechToText {
  start(
    lang: string,
    onResult: (transcript: string, isFinal: boolean, detectedLanguage?: string) => void,
    onError?: (error: unknown) => void
  ): void;
  stop(): void;
  isListening(): boolean;
  isSupported(): boolean;
}

/** Legacy-compatible adapter interface */
export interface VoiceAdapter {
  speak(text: string, options?: VoiceOptions): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
  isSupported(): boolean;
}
