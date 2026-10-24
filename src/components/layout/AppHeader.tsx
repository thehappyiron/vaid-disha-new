import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Accessibility,
  Bell,
  Menu,
  X,
  Ticket,
  Compass,
  FileText,
  MapPin,
  ChevronRight,
  Home,
} from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AccessibilityPanel } from './AccessibilityPanel';
import { useNotifications } from '../../services/liveStore';

interface AppHeaderProps {
  showHome?: boolean;
  title?: string;
}

export function AppHeader({ showHome = false, title }: AppHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [panelOpen, setPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (menuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = original;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [menuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-30 bg-[var(--color-surface)] border-b-2 border-[var(--color-border)] w-full max-w-full"
      >
        {/* Exact row layout: [brand/home, flex-1 min-w-0 truncate] [Language dropdown] [Notifications bell] [A11y button] [Menu button] */}
        <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 flex items-center gap-1.5 sm:gap-2">
          {/* Brand/home link */}
          <Link
            to={showHome ? '/' : '/patient/start'}
            className="flex items-center gap-1.5 flex-1 min-w-0 mr-1 text-decoration-none group overflow-hidden"
            aria-label={t('common.home', 'Home')}
          >
            {showHome && (
              <span className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-primary-500)] flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                <Home size={18} aria-hidden="true" />
              </span>
            )}
            <span className="font-black text-[var(--color-primary-500)] text-base sm:text-lg truncate block leading-tight">
              {title ?? t('app.name', 'Vaid Disha')}
            </span>
          </Link>

          {/* Language dropdown button */}
          <LanguageSwitcher />

          {/* Notifications bell with badge */}
          <Link
            to="/patient/notifications"
            className="btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px] shrink-0 relative"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-[var(--color-surface)] shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Accessibility button */}
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px] shrink-0"
            aria-label={t('a11y.open_settings', 'Open accessibility settings')}
            aria-expanded={panelOpen}
          >
            <Accessibility size={20} aria-hidden="true" />
          </button>

          {/* Menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px] shrink-0 border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── MENU DRAWER / SHEET PORTAL ─────────────────────────────────── */}
      {menuOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="fixed inset-0 z-[100] flex justify-end transition-opacity duration-200"
          >
            {/* Backdrop dismiss */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90]"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />

            <div className="relative z-[100] w-full max-w-sm h-full bg-[var(--color-surface)] border-l-2 border-[var(--color-border)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-lg font-black text-[var(--color-text)]">
                  {t('app.name', 'Vaid Disha')}
                </h2>
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Patient Services & Navigation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px]"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Big Links List (each at least 56px tall) */}
            <nav className="p-4 flex flex-col gap-2.5 flex-1" aria-label="Main navigation menu">
              {/* My Slip */}
              <Link
                to="/patient/slip"
                onClick={() => setMenuOpen(false)}
                className="min-h-[56px] px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-surface-2)] transition-all flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Ticket size={22} />
                  </div>
                  <div>
                    <span className="font-black text-base text-[var(--color-text)] block">
                      My Visit Slip
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      Queue token, QR code & room details
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-500)]" />
              </Link>

              {/* Find My Way */}
              <Link
                to="/patient/guidance"
                onClick={() => setMenuOpen(false)}
                className="min-h-[56px] px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-surface-2)] transition-all flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Compass size={22} />
                  </div>
                  <div>
                    <span className="font-black text-base text-[var(--color-text)] block">
                      Find My Way
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      Turn-by-turn hospital indoor guidance
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-500)]" />
              </Link>

              {/* Lab Reports */}
              <Link
                to="/patient/reports"
                onClick={() => setMenuOpen(false)}
                className="min-h-[56px] px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-surface-2)] transition-all flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <span className="font-black text-base text-[var(--color-text)] block">
                      Lab Reports
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      View, read aloud & download tests
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-500)]" />
              </Link>

              {/* Facilities */}
              <Link
                to="/patient/facilities"
                onClick={() => setMenuOpen(false)}
                className="min-h-[56px] px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-surface-2)] transition-all flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <span className="font-black text-base text-[var(--color-text)] block">
                      Facilities
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      Washrooms, wheelchair stands, lifts, water
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-500)]" />
              </Link>

              {/* Notifications */}
              <Link
                to="/patient/notifications"
                onClick={() => setMenuOpen(false)}
                className="min-h-[56px] px-4 py-3 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-surface-2)] transition-all flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center justify-center shrink-0 relative">
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 border border-white" />
                    )}
                  </div>
                  <div>
                    <span className="font-black text-base text-[var(--color-text)] block">
                      Notifications
                    </span>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      Queue updates & emergency alerts ({unreadCount} unread)
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-500)]" />
              </Link>
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <Link
                to="/patient/emergency"
                onClick={() => setMenuOpen(false)}
                className="btn btn-danger w-full min-h-[56px] flex items-center justify-center font-black text-sm uppercase tracking-wider rounded-xl shadow-md"
              >
                Emergency Assistance
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Accessibility settings bottom sheet */}
      {panelOpen && <AccessibilityPanel onClose={() => setPanelOpen(false)} />}
    </>
  );
}
