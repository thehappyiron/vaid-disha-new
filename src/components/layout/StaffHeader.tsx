import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope,
  Accessibility,
  Bell,
  LogOut,
  Menu,
  X,
  Clock,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AccessibilityPanel } from './AccessibilityPanel';
import { useNotifications, useLiveStore } from '../../services/liveStore';
import { useAuth } from '../../context/AuthContext';

interface StaffHeaderProps {
  showHome?: boolean;
  title?: string;
}

/**
 * Dedicated Staff Application Header (Desktop & Tablet First).
 * - Header row: Brand, Language, Alerts, Accessibility, Sign Out (lg+), Menu Drawer (< lg).
 * - Inline nav links removed completely from header row to prevent mobile text squeezing.
 * - Below lg: Uses portaled slide-out Menu drawer with large touch-friendly links.
 */
export function StaffHeader({ title }: StaffHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [panelOpen, setPanelOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { notifications } = useNotifications();
  const { state } = useLiveStore();

  // Active emergency count
  const activeEmergenciesCount = (state.emergencyRequests || []).filter(
    (e) => e.status === 'alerted' || e.status === 'responding'
  ).length;

  const alertCount = notifications.filter((n) => !n.read && n.type === 'emergency').length || activeEmergenciesCount;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.hash]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setDrawerOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [drawerOpen]);

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-30 bg-[var(--color-surface)] border-b-2 border-[var(--color-border)] w-full"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-2.5 flex items-center justify-between gap-2">
          {/* Brand link */}
          <Link
            to="/staff/dashboard"
            className="flex items-center gap-2 flex-1 min-w-0 mr-1 text-decoration-none group"
            aria-label="Staff Dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-500)] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope size={18} />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-black text-[var(--color-primary-500)] text-sm sm:text-base truncate block leading-tight">
                {title ?? 'Staff Portal'}
              </span>
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider block">
                Hospital Duty
              </span>
            </div>
          </Link>

          {/* Action icons row */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language dropdown */}
            <LanguageSwitcher />

            {/* Emergency Alert Bell */}
            <Link
              to="/patient/notifications"
              className="btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px] shrink-0 relative"
              aria-label={`Emergency alerts${alertCount > 0 ? `, ${alertCount} active` : ''}`}
              title="Hospital Alerts"
            >
              <Bell size={20} aria-hidden="true" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D55E00] text-white text-[10px] font-black flex items-center justify-center border-2 border-[var(--color-surface)] shadow-xs animate-pulse">
                  {alertCount}
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

            {/* Sign Out button (lg and above only in header) */}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden lg:flex btn btn-ghost btn-sm min-h-[44px] px-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs sm:text-sm shrink-0 items-center gap-1.5 border border-red-200 dark:border-red-900 rounded-xl"
              aria-label="Sign out of staff portal"
              title="Sign out"
            >
              <LogOut size={16} aria-hidden="true" className="shrink-0" />
              <span>Sign out</span>
            </button>

            {/* Menu Drawer Toggle (Below lg only) */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px] shrink-0 border border-[var(--color-border)] rounded-xl"
              aria-label="Open staff navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Accessibility bottom sheet */}
      {panelOpen && <AccessibilityPanel onClose={() => setPanelOpen(false)} />}

      {/* Staff Menu Drawer (Below lg) portaled to document.body */}
      {drawerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-drawer-title"
          >
            {/* Dimmed backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out drawer */}
            <div className="relative w-full max-w-xs sm:max-w-sm bg-[var(--color-surface)] border-l-2 border-[var(--color-border)] shadow-2xl h-full flex flex-col z-[100] animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-4 border-b-2 border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-2)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-500)] text-white flex items-center justify-center shrink-0">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <h2 id="staff-drawer-title" className="font-bold text-sm text-[var(--color-text-main)]">
                      Staff Duty Desk
                    </h2>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                      Navigation Menu
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px] rounded-xl text-[var(--color-text-muted)]"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="p-4 flex-1 space-y-2.5 overflow-y-auto" aria-label="Staff Mobile Navigation">
                <Link
                  to="/staff/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-950)] min-h-12"
                >
                  <Clock size={20} className="text-[var(--color-primary-500)] shrink-0" />
                  <span>Queue & Duty Desk</span>
                </Link>

                <a
                  href="/staff/dashboard#emergencies"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--color-emergency-bg)] border-2 border-[var(--color-emergency-border)] text-sm font-bold text-[var(--color-emergency-text)] min-h-12"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle size={20} className="text-[var(--color-emergency-icon)] shrink-0" />
                    <span className="truncate">Active Emergencies</span>
                  </div>
                  {activeEmergenciesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-[#D55E00] text-white">
                      {activeEmergenciesCount}
                    </span>
                  )}
                </a>

                <Link
                  to="/staff/patients"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-main)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-950)] min-h-12"
                >
                  <Users size={20} className="text-[var(--color-primary-500)] shrink-0" />
                  <span>Patient Records</span>
                </Link>
              </nav>

              {/* Drawer Footer with Sign Out */}
              <div className="p-4 border-t-2 border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full btn btn-ghost text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl p-3 font-bold text-sm flex items-center justify-center gap-2 min-h-12"
                >
                  <LogOut size={18} />
                  <span>Sign out of staff portal</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
