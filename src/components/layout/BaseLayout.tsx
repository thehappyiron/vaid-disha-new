import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from './AppHeader';
import { NotificationToastContainer } from '../notifications/NotificationToastContainer';

interface BaseLayoutProps {
  children: ReactNode;
  showHome?: boolean;
  headerTitle?: string;
  isStaff?: boolean;
}

/**
 * Root layout for every page.
 *
 * Provides:
 * - Skip-to-content link (accessible at top, visible on focus)
 * - <header> landmark via AppHeader
 * - <main> landmark with id="main-content"
 * - In-page floating real-time notification toasts
 * - Correct role structure for screen readers
 */
export function BaseLayout({ children, showHome = true, headerTitle, isStaff = false }: BaseLayoutProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Skip link — first focusable element on every page */}
      <a href="#main-content" className="skip-link">
        {t('a11y.skip_to_content')}
      </a>

      <AppHeader showHome={showHome} title={headerTitle} isStaff={isStaff} />

      {/* Real-time floating in-page notification toasts */}
      <NotificationToastContainer />

      <main
        id="main-content"
        tabIndex={-1}  /* receives programmatic focus from skip link */
        className="flex-1 outline-none"
      >
        {children}
      </main>
    </>
  );
}
