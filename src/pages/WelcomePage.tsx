import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Hospital } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAccessibility } from '../context/AccessibilityContext';

export function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { largeFontMode, toggleLargeFontMode } = useAccessibility();

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface)]">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        {t('a11y.skip_to_content')}
      </a>

      {/* Language switcher at top */}
      <div className="flex justify-end px-4 pt-4">
        <LanguageSwitcher />
      </div>

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center px-5 py-10 gap-8 max-w-lg mx-auto w-full"
        tabIndex={-1}
      >
        {/* Logo / Icon */}
        <div
          className="w-24 h-24 rounded-full bg-[var(--color-primary)] flex items-center justify-center"
          aria-hidden="true"
        >
          <Hospital size={48} className="text-white" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">
            {t('app.name')}
          </h1>
          <p className="text-xl text-[var(--color-text-primary)] font-medium">
            {t('welcome.title')}
          </p>
          <p className="text-[var(--color-text-secondary)]">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/purpose')}
          className="btn btn-primary btn-full btn-lg text-xl"
          aria-label={t('welcome.cta')}
        >
          {t('welcome.cta')}
          <ArrowRight size={22} aria-hidden="true" />
        </button>

        {/* Accessibility toggle */}
        <button
          onClick={toggleLargeFontMode}
          className="btn btn-ghost text-sm min-h-[2.75rem]"
          aria-pressed={largeFontMode}
          aria-label={t('welcome.accessibility_cta')}
        >
          <span
            className={`text-lg font-bold mr-1 ${largeFontMode ? 'text-[var(--color-primary)]' : ''}`}
            aria-hidden="true"
          >
            A
          </span>
          {t('welcome.accessibility_cta')}
        </button>
      </main>

      {/* Footer branding */}
      <footer className="text-center py-4 text-sm text-[var(--color-text-muted)]">
        {t('app.tagline')}
      </footer>
    </div>
  );
}
