import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Accessibility } from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AccessibilityPanel } from './AccessibilityPanel';

interface AppHeaderProps {
  showHome?: boolean;
  title?: string;
}

/**
 * Persistent application header.
 * - App name / optional title
 * - Language switcher
 * - Accessibility settings button (opens bottom sheet panel)
 * - Optional home link
 */
export function AppHeader({ showHome = false, title }: AppHeaderProps) {
  const { t } = useTranslation();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-30 bg-[var(--color-surface)] border-b-2 border-[var(--color-border)]"
      >
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-2">
          {/* Home link */}
          {showHome && (
            <Link
              to="/"
              className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
              aria-label={t('common.home')}
            >
              <Home size={20} aria-hidden="true" />
            </Link>
          )}

          {/* App name / title */}
          <span className="font-bold text-[var(--color-primary-500)] text-lg flex-shrink-0 mr-auto">
            {title ?? t('app.name')}
          </span>

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Accessibility button */}
          <button
            onClick={() => setPanelOpen(true)}
            className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
            aria-label={t('a11y.open_settings')}
            aria-expanded={panelOpen}
            aria-haspopup="dialog"
          >
            <Accessibility size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Accessibility panel (bottom sheet) */}
      {panelOpen && (
        <AccessibilityPanel onClose={() => setPanelOpen(false)} />
      )}
    </>
  );
}
