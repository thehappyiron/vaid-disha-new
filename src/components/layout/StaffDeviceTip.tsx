import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, X } from 'lucide-react';

const STORAGE_KEY = 'vd_staff_desktop_tip_dismissed';

/**
 * Dismissible one-line tip shown on mobile screens (< md) only for staff pages.
 * Recommends tablet or desktop for optimal duty management.
 */
export function StaffDeviceTip() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<boolean>(true); // default true to avoid flash

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== 'true') {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="md:hidden w-full bg-[var(--color-surface-2)] border-b border-[var(--color-border)] px-3 py-2 text-xs flex items-center justify-between gap-2 text-[var(--color-text-main)] animate-in fade-in"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Monitor size={15} className="text-[var(--color-primary-500)] shrink-0" aria-hidden="true" />
        <span className="truncate">
          {t('staff.desktop_tip', 'For the best experience, use a tablet or computer.')}
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] p-1 rounded-md shrink-0"
        aria-label={t('common.dismiss', 'Dismiss tip')}
      >
        <X size={14} />
      </button>
    </div>
  );
}
