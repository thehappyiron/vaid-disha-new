/**
 * Web Speech API Implementations for Text-to-Speech (TTS) and Speech-to-Text (STT)
 */

import type { TextToSpeech, SpeechToText, VoiceOptions } from './types';

function mapToBcp47(langCode?: string): string {
  if (!langCode) return 'en-IN';
  const lower = langCode.toLowerCase();
  if (lower.startsWith('hi')) return 'hi-IN';
  if (lower.startsWith('mr')) return 'mr-IN';
  return 'en-IN';
}

/**
 * Web Speech API Text-to-Speech Implementation
 */
export class WebSpeechTTS implements TextToSpeech {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isSpeaking(): boolean {
    if (!this.isSupported()) return false;
    return window.speechSynthesis.speaking || this.currentUtterance !== null;
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public async speak(text: string, lang?: string, options?: VoiceOptions): Promise<void> {
    if (!this.isSupported()) {
      options?.onError?.(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    this.stop();

    if (!text || text.trim() === '') return;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.rate = options?.rate ?? 0.9;
      utterance.pitch = options?.pitch ?? 1.0;

      const effectiveLang = options?.lang || lang || 'en';
      const bcp47 = mapToBcp47(effectiveLang);
      utterance.lang = bcp47;

      if (this.cachedVoices.length > 0) {
        const matchingVoice = this.cachedVoices.find(
          (v) => v.lang === bcp47 || v.lang.replace('_', '-').startsWith(effectiveLang)
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        } else if (effectiveLang.startsWith('mr')) {
          // Fallback to Hindi voice for phonetic accuracy if Marathi voice is not pre-installed
          const hiFallback = this.cachedVoices.find((v) => v.lang.startsWith('hi'));
          if (hiFallback) utterance.voice = hiFallback;
        }
      }

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        options?.onError?.(e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

/**
 * Web Speech API Speech-to-Text Implementation
 */
export class WebSpeechSTT implements SpeechToText {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private listening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public isListening(): boolean {
    return this.listening;
  }

  public start(
    lang: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: unknown) => void
  ): void {
    if (!this.recognition) {
      onError?.(new Error('Speech recognition is not supported in this browser'));
      return;
    }

    if (this.listening) {
      this.stop();
    }

    const bcp47 = mapToBcp47(lang);
    this.recognition.lang = bcp47;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      const isFinal = Boolean(finalTranscript);
      if (text) {
        onResult(text, isFinal);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      this.listening = false;
      onError?.(event.error || event);
    };

    this.recognition.onend = () => {
      this.listening = false;
    };

    try {
      this.listening = true;
      this.recognition.start();
    } catch (err) {
      this.listening = false;
      onError?.(err);
    }
  }

  public stop(): void {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.listening = false;
  }
}
