import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

/*
 * To add a new language (e.g. Tamil):
 * 1. Copy locales/en.json → locales/ta.json and translate
 * 2. import ta from './locales/ta.json'
 * 3. Add   ta: { translation: ta }  to `resources`
 * 4. Add   { code: 'ta', nativeLabel: 'தமிழ்', dir: 'ltr' }  to LANGUAGES below
 */

export const LANGUAGES = [
  { code: 'en', nativeLabel: 'English',  dir: 'ltr' as const },
  { code: 'hi', nativeLabel: 'हिन्दी',   dir: 'ltr' as const },
  { code: 'mr', nativeLabel: 'मराठी',    dir: 'ltr' as const },
  // { code: 'ta', nativeLabel: 'தமிழ்',   dir: 'ltr' },
  // { code: 'bn', nativeLabel: 'বাংলা',   dir: 'ltr' },
  // { code: 'te', nativeLabel: 'తెలుగు',  dir: 'ltr' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
    },
    lng: (localStorage.getItem('vd-lang') as LanguageCode) ?? 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
