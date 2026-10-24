import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from './AppHeader';
import { StaffHeader } from './StaffHeader';
import { NotificationToastContainer } from '../notifications/NotificationToastContainer';
import { FloatingChatButton } from '../chat/FloatingChatButton';

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
 * - <header> landmark via AppHeader (patient) or StaffHeader (staff)
 * - <main> landmark with id="main-content" and pb-24 padding for floating help clearance
 * - In-page floating real-time notification toasts
 * - Floating AI Help chatbot for all patient pages (not staff pages)
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

      {isStaff ? (
        <StaffHeader showHome={showHome} title={headerTitle} />
      ) : (
        <AppHeader showHome={showHome} title={headerTitle} />
      )}

      {/* Real-time floating in-page notification toasts */}
      <NotificationToastContainer />

      <main
        id="main-content"
        tabIndex={-1}  /* receives programmatic focus from skip link */
        className={`flex-1 outline-none ${!isStaff ? 'pb-24' : ''}`}
      >
        {children}
      </main>

      {/* Floating AI Help chatbot for all patient pages (not staff pages) */}
      {!isStaff && <FloatingChatButton />}
    </>
  );
}

