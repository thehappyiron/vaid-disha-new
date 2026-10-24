/**
 * Voice Service Entry Point
 * 
 * Exports default singleton instances for Text-to-Speech and Speech-to-Text.
 * Preserves full backward-compatibility with existing `voiceService` calls.
 */

import { SarvamSTT, SarvamTTS } from './sarvamVoice';
import type { TextToSpeech, SpeechToText, VoiceOptions, VoiceAdapter } from './types';

export * from './types';
export * from './webSpeech';
export * from './sarvamVoice';

export const textToSpeech: TextToSpeech = new SarvamTTS();
export const speechToText: SpeechToText = new SarvamSTT();

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
