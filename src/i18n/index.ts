import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';
import asLang from './locales/as.json';
import bn from './locales/bn.json';
import pa from './locales/pa.json';
import orLang from './locales/or.json';
import ml from './locales/ml.json';
import gu from './locales/gu.json';

export interface LanguageItem {
  code: string;
  nativeLabel: string;
  englishLabel: string;
  dir: 'ltr' | 'rtl';
  bcp47: string;
}

/**
 * 3 Primary languages displayed on Screen A & Header
 */
export const PRIMARY_LANGUAGES: LanguageItem[] = [
  { code: 'en', nativeLabel: 'English', englishLabel: 'English', dir: 'ltr', bcp47: 'en-IN' },
  { code: 'hi', nativeLabel: 'हिन्दी', englishLabel: 'Hindi', dir: 'ltr', bcp47: 'hi-IN' },
  { code: 'mr', nativeLabel: 'मराठी', englishLabel: 'Marathi', dir: 'ltr', bcp47: 'mr-IN' },
];

/**
 * Only the specific Indian languages requested by the user:
 * Telugu, Tamil, Kannada, Assamese, Bengali, Punjabi, Odia, Malayalam, Gujarati.
 * (All other languages have been removed).
 */
export const OTHER_INDIAN_LANGUAGES: LanguageItem[] = [
  { code: 'te', nativeLabel: 'తెలుగు', englishLabel: 'Telugu', dir: 'ltr', bcp47: 'te-IN' },
  { code: 'ta', nativeLabel: 'தமிழ்', englishLabel: 'Tamil', dir: 'ltr', bcp47: 'ta-IN' },
  { code: 'kn', nativeLabel: 'ಕನ್ನಡ', englishLabel: 'Kannada', dir: 'ltr', bcp47: 'kn-IN' },
  { code: 'as', nativeLabel: 'অসমীয়া', englishLabel: 'Assamese', dir: 'ltr', bcp47: 'as-IN' },
  { code: 'bn', nativeLabel: 'বাংলা', englishLabel: 'Bengali', dir: 'ltr', bcp47: 'bn-IN' },
  { code: 'pa', nativeLabel: 'ਪੰਜਾਬੀ', englishLabel: 'Punjabi', dir: 'ltr', bcp47: 'pa-IN' },
  { code: 'or', nativeLabel: 'ଓଡ଼ିଆ', englishLabel: 'Odia', dir: 'ltr', bcp47: 'or-IN' },
  { code: 'ml', nativeLabel: 'മലയാളം', englishLabel: 'Malayalam', dir: 'ltr', bcp47: 'ml-IN' },
  { code: 'gu', nativeLabel: 'ગુજરાતી', englishLabel: 'Gujarati', dir: 'ltr', bcp47: 'gu-IN' },
];

/**
 * All supported languages: Primary (3) + Other Indian Languages (9) = 12 fully translated languages
 */
export const ALL_INDIAN_LANGUAGES: LanguageItem[] = [
  ...PRIMARY_LANGUAGES,
  ...OTHER_INDIAN_LANGUAGES,
];

// For backwards compatibility with existing imports
export const LANGUAGES = PRIMARY_LANGUAGES;

export type LanguageCode = string;

export function getLanguageItem(code: string): LanguageItem {
  const norm = (code || 'en').toLowerCase().trim();
  const match = ALL_INDIAN_LANGUAGES.find(
    (l) => l.code === norm || norm.startsWith(l.code)
  );
  return match || PRIMARY_LANGUAGES[0];
}

export function getBcp47Language(code: string): string {
  return getLanguageItem(code).bcp47;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      te: { translation: te },
      ta: { translation: ta },
      kn: { translation: kn },
      as: { translation: asLang },
      bn: { translation: bn },
      pa: { translation: pa },
      or: { translation: orLang },
      ml: { translation: ml },
      gu: { translation: gu },
    },
    lng: (localStorage.getItem('vd-lang') as string) ?? 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
