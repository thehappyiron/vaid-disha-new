/**
 * Voice Service Adapter for Vaid Disha
 * 
 * Provides an accessible Text-to-Speech interface for turn-by-turn guidance.
 * Currently backed by browser Web Speech API (speechSynthesis).
 * Designed with an adapter pattern so the Sarvam AI Indian TTS API (or other provider)
 * can be plugged in without modifying UI components.
 */

export interface VoiceOptions {
  lang?: string; // 'en' | 'hi' | 'mr' or 'en-IN' | 'hi-IN' | 'mr-IN'
  rate?: number; // 0.85 default for clear elderly comprehension
  pitch?: number; // 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export interface VoiceAdapter {
  speak(text: string, options?: VoiceOptions): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
  isSupported(): boolean;
}

/**
 * Web Speech API implementation
 */
class WebSpeechVoiceAdapter implements VoiceAdapter {
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

  public async speak(text: string, options?: VoiceOptions): Promise<void> {
    if (!this.isSupported()) {
      options?.onError?.(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    // Always stop existing speech before speaking new step
    this.stop();

    if (!text || text.trim() === '') return;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Rate slightly slower (0.88 - 0.92) for high elderly comprehension
      utterance.rate = options?.rate ?? 0.9;
      utterance.pitch = options?.pitch ?? 1.0;

      // Map language codes to BCP 47
      const langCode = options?.lang || 'en';
      let bcp47 = 'en-IN';
      if (langCode.startsWith('hi')) {
        bcp47 = 'hi-IN';
      } else if (langCode.startsWith('mr')) {
        bcp47 = 'mr-IN';
      } else if (langCode.startsWith('en')) {
        bcp47 = 'en-IN';
      }
      utterance.lang = bcp47;

      // Attempt to pick a matching voice if loaded
      if (this.cachedVoices.length > 0) {
        const matchingVoice = this.cachedVoices.find(
          (v) => v.lang === bcp47 || v.lang.replace('_', '-').startsWith(langCode)
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        } else if (langCode === 'mr') {
          // If Marathi voice not installed on OS, fallback to Hindi voice for phonetic accuracy
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

// ─── Sarvam Voice Adapter Placeholder ──────────────────────────────────────────
// When Sarvam API credentials and endpoints are enabled, activate this provider:
// class SarvamVoiceAdapter implements VoiceAdapter { ... }

// Default singleton instance
const activeAdapter: VoiceAdapter = new WebSpeechVoiceAdapter();

export const voiceService = {
  speak: (text: string, options?: VoiceOptions) => activeAdapter.speak(text, options),
  stop: () => activeAdapter.stop(),
  isSpeaking: () => activeAdapter.isSpeaking(),
  isSupported: () => activeAdapter.isSupported(),
};
