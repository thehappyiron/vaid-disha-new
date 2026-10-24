import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Accessibility, Bell, LogOut } from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AccessibilityPanel } from './AccessibilityPanel';
import { useNotifications } from '../../services/liveStore';
import { useAuth } from '../../context/AuthContext';

interface StaffHeaderProps {
  showHome?: boolean;
  title?: string;
}

/**
 * Dedicated Staff Application Header.
 * Contains only staff-relevant controls:
 * - Brand with Staff tag
 * - Language dropdown
 * - Hospital alerts / notifications
 * - Accessibility panel trigger
 * - Sign out button
 * Strictly NO patient-only links (slip, guidance, reports).
 */
export function StaffHeader({ title }: StaffHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [panelOpen, setPanelOpen] = useState(false);
  const { notifications } = useNotifications();

  // For staff: count active emergency and delay alerts
  const alertCount = notifications.filter((n) => !n.read && n.type === 'emergency').length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-30 bg-[var(--color-surface)] border-b-2 border-[var(--color-border)] w-full"
      >
        <div className="max-w-md md:max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-2.5 flex items-center gap-1.5 sm:gap-2">
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

          {/* Navigation Links: Queue Dashboard & Patient Records */}
          <nav className="flex items-center gap-1 mr-1" aria-label="Staff Navigation">
            <Link
              to="/staff/dashboard"
              className="btn btn-ghost btn-sm px-2 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]"
            >
              Queue
            </Link>
            <Link
              to="/staff/patients"
              className="btn btn-ghost btn-sm px-2 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]"
            >
              Patients
            </Link>
          </nav>

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
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-[var(--color-surface)] shadow-xs animate-pulse">
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

          {/* Sign Out button */}
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-ghost btn-sm min-h-[44px] px-2.5 sm:px-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs sm:text-sm shrink-0 flex items-center gap-1.5 border border-red-200 dark:border-red-900 rounded-xl"
            aria-label="Sign out of staff portal"
            title="Sign out"
          >
            <LogOut size={16} aria-hidden="true" className="shrink-0" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Accessibility bottom sheet */}
      {panelOpen && <AccessibilityPanel onClose={() => setPanelOpen(false)} />}
    </>
  );
}
