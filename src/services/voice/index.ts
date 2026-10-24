/**
 * Voice Service Entry Point
 * 
 * Exports default singleton instances for Text-to-Speech and Speech-to-Text.
 * Preserves full backward-compatibility with existing `voiceService` calls.
 */

import { WebSpeechTTS, WebSpeechSTT } from './webSpeech';
import type { TextToSpeech, SpeechToText, VoiceOptions, VoiceAdapter } from './types';

export * from './types';
export * from './webSpeech';
export * from './sarvamVoice';

export const textToSpeech: TextToSpeech = new WebSpeechTTS();
export const speechToText: SpeechToText = new WebSpeechSTT();

/**
 * Legacy voiceService adapter
 * Maintained so guidance and read-aloud buttons work seamlessly.
 */
export const voiceService: VoiceAdapter = {
  speak: (text: string, options?: VoiceOptions) => textToSpeech.speak(text, options?.lang, options),
  stop: () => textToSpeech.stop(),
  isSpeaking: () => textToSpeech.isSpeaking(),
  isSupported: () => textToSpeech.isSupported(),
};
