import { useTranslation } from 'react-i18next';
import { LANGUAGES, type LanguageCode } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('vd-lang', code);
    // Update <html lang> for screen readers
    document.documentElement.lang = code;
  };

  const currentCode = i18n.language as LanguageCode;

  return (
    <nav
      aria-label={t('a11y.language_switcher')}
      className={`flex gap-1 ${className}`}
    >
      {LANGUAGES.map((lang) => {
        const isActive = currentCode === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            aria-pressed={isActive}
            aria-label={t('a11y.current_language', { lang: lang.nativeLabel })}
            lang={lang.code}
            className={[
              'btn btn-sm',
              isActive ? 'btn-primary' : 'btn-ghost',
              'min-h-[2.25rem] px-2 sm:px-3 text-xs sm:text-sm font-semibold shrink-0',
            ].join(' ')}
          >
            {lang.nativeLabel}
          </button>
        );
      })}
    </nav>
  );
}
