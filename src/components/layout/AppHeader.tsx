import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Accessibility, Ticket } from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AccessibilityPanel } from './AccessibilityPanel';

interface AppHeaderProps {
  showHome?: boolean;
  title?: string;
  isStaff?: boolean;
}

/**
 * Persistent application header.
 * - App name / optional title
 * - Language switcher
 * - Accessibility settings button (opens bottom sheet panel)
 * - Optional home link
 */
export function AppHeader({ showHome = false, title, isStaff = false }: AppHeaderProps) {
  const { t } = useTranslation();
  const [panelOpen, setPanelOpen] = useState(false);

  const containerClasses = isStaff
    ? 'max-w-md md:max-w-7xl mx-auto px-4 md:px-8 py-2 flex items-center gap-1.5 sm:gap-2'
    : 'max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-2 flex items-center gap-1.5 sm:gap-2';

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-30 bg-[var(--color-surface)] border-b-2 border-[var(--color-border)] w-full"
      >
        <div className={containerClasses}>
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
          <span className="font-bold text-[var(--color-primary-500)] text-base sm:text-lg flex-1 truncate mr-1">
            {title ?? t('app.name')}
          </span>

          {/* My Visits / History link */}
          <Link
            to="/patient/history"
            className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
            aria-label={t('history.page_title')}
            title={t('history.page_title')}
          >
            <Ticket size={19} aria-hidden="true" />
          </Link>

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
