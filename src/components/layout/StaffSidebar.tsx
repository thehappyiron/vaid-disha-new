import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle, Users, Stethoscope } from 'lucide-react';
import { useLiveStore } from '../../services/liveStore';

interface StaffSidebarProps {
  className?: string;
}

/**
 * Desktop & Tablet Left Sidebar for Staff (/staff/*)
 * Displayed at lg (1024px) and above.
 * Features:
 * - Queue & Duty Desk (/staff/dashboard)
 * - Emergencies (/staff/dashboard#emergencies)
 * - Patient Records (/staff/patients)
 * Each with icon + text and minimum height of 48px (min-h-12).
 */
export function StaffSidebar({ className = '' }: StaffSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { state } = useLiveStore();

  const isQueueActive = location.pathname === '/staff/dashboard' && location.hash !== '#emergencies';
  const isEmergencyActive = location.pathname === '/staff/dashboard' && location.hash === '#emergencies';
  const isPatientsActive = location.pathname === '/staff/patients';

  const activeEmergenciesCount = (state.emergencyRequests || []).filter(
    (e) => e.status === 'alerted' || e.status === 'responding'
  ).length;

  const totalWaiting = state.queue.filter((q) => q.status === 'waiting' || q.status === 'turn_soon').length;

  return (
    <aside
      aria-label="Staff Navigation Sidebar"
      className={`hidden lg:flex flex-col w-64 shrink-0 bg-[var(--color-surface)] border-r-2 border-[var(--color-border)] min-h-[calc(100vh-65px)] sticky top-[65px] self-start p-4 space-y-6 ${className}`}
    >
      {/* Duty Station Header */}
      <div className="p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-500)] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Stethoscope size={20} />
        </div>
        <div className="min-w-0">
          <span className="font-black text-xs text-[var(--color-text-main)] block truncate">
            Clinical Duty Desk
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
            ● Live Synchronized
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex flex-col space-y-2 flex-1" aria-label="Staff Menu">
        {/* 1. Queue & Duty Desk */}
        <Link
          to="/staff/dashboard"
          aria-current={isQueueActive ? 'page' : undefined}
          className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold min-h-12 transition-all border ${
            isQueueActive
              ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-600)] shadow-xs'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-main)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock size={18} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{t('staff.nav_queue', 'Queue & Duty Desk')}</span>
          </div>
          {totalWaiting > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                isQueueActive
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-primary-500)] border border-[var(--color-border)]'
              }`}
            >
              {totalWaiting}
            </span>
          )}
        </Link>

        {/* 2. Emergencies */}
        <a
          href="/staff/dashboard#emergencies"
          aria-current={isEmergencyActive ? 'page' : undefined}
          className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold min-h-12 transition-all border ${
            isEmergencyActive
              ? 'bg-[var(--color-emergency-border)] text-white border-[var(--color-emergency-border)] shadow-xs'
              : activeEmergenciesCount > 0
              ? 'bg-[var(--color-emergency-bg)] text-[var(--color-emergency-text)] border-[var(--color-emergency-border)] animate-pulse'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-main)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{t('staff.nav_emergencies', 'Emergencies')}</span>
          </div>
          {activeEmergenciesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-[#D55E00] text-white">
              {activeEmergenciesCount}
            </span>
          )}
        </a>

        {/* 3. Patient Records */}
        <Link
          to="/staff/patients"
          aria-current={isPatientsActive ? 'page' : undefined}
          className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold min-h-12 transition-all border ${
            isPatientsActive
              ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-600)] shadow-xs'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-main)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Users size={18} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{t('staff.nav_patients', 'Patient Records')}</span>
          </div>
        </Link>
      </nav>

      {/* Quick summary footer in sidebar */}
      <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-1">
        <div className="font-bold text-[var(--color-text-main)]">Cross-tab Live Sync</div>
        <p className="leading-relaxed text-[11px]">
          Updates broadcast instantly across open patient and hospital screens.
        </p>
      </div>
    </aside>
  );
}
