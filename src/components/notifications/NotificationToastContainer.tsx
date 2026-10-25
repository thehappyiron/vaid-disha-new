import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  CheckCircle2,
  FileText,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import type { PatientNotification } from '../../services/liveStore';

interface ToastItem extends PatientNotification {
  toastId: string;
}

function shouldShowToastToUser(toast: PatientNotification): boolean {
  if (typeof window === 'undefined') return false;

  // Strict check: never show on staff or admin pages
  const path = window.location.pathname;
  if (path.startsWith('/staff') || path.startsWith('/admin')) {
    return false;
  }

  // Emergencies are broadcast to everyone on user side
  if (toast.type === 'emergency') return true;

  // If notification has no specific token, it's a general announcement
  if (!toast.token) return true;

  const targetToken = toast.token.toUpperCase().trim();

  // 1. Check URL query param ?token=
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token')?.toUpperCase().trim();
  if (urlToken && urlToken === targetToken) return true;

  // 2. Check vd-latest-slip
  try {
    const latestRaw = localStorage.getItem('vd-latest-slip');
    if (latestRaw) {
      const latest = JSON.parse(latestRaw);
      if (latest?.token?.toUpperCase().trim() === targetToken) return true;
    }
  } catch {}

  // 3. Check vd-patient-slips
  try {
    const slipsRaw = localStorage.getItem('vd-patient-slips');
    if (slipsRaw) {
      const slips = JSON.parse(slipsRaw);
      if (Array.isArray(slips) && slips.some((s: any) => s.token?.toUpperCase().trim() === targetToken)) {
        return true;
      }
    }
  } catch {}

  // 4. If user is currently browsing patient routes
  if (path.startsWith('/patient/')) {
    return true;
  }

  // 5. If user has no conflicting slips stored (e.g. demo testing on home page)
  const hasOtherSlips = Boolean(localStorage.getItem('vd-latest-slip') || localStorage.getItem('vd-patient-slips'));
  return !hasOtherSlips;
}

export function NotificationToastContainer() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Strict safeguard: never render on staff or admin pages
  const isStaffRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/staff') || window.location.pathname.startsWith('/admin'));

  useEffect(() => {
    if (isStaffRoute) return;

    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<PatientNotification>;
      if (!customEvent.detail || !shouldShowToastToUser(customEvent.detail)) return;

      const item: ToastItem = {
        ...customEvent.detail,
        toastId: `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };

      setToasts((prev) => [item, ...prev].slice(0, 3)); // Keep max 3 toasts at a time

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.toastId !== item.toastId));
      }, 6000);
    };

    window.addEventListener('vd_toast_notification', handleToastEvent);
    return () => {
      window.removeEventListener('vd_toast_notification', handleToastEvent);
    };
  }, [isStaffRoute]);

  if (isStaffRoute || toasts.length === 0) return null;

  return (
    <aside
      aria-label="Real-time notifications"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const isEmergency = toast.type === 'emergency';
        const isTurnSoon = toast.type === 'turn_soon';
        const isCompleted = toast.type === 'completed';
        const isReport = toast.type === 'report_ready';

        const borderClass = isEmergency
          ? 'border-[3px] border-[#D55E00] bg-[#FDECE4] text-[#3D1500]'
          : isTurnSoon
            ? 'border-2 border-blue-400 bg-blue-50 text-blue-950 dark:bg-blue-950 dark:text-blue-100'
            : isCompleted
              ? 'border-2 border-emerald-400 bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100'
              : isReport
                ? 'border-2 border-indigo-400 bg-indigo-50 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-100'
                : 'border-2 border-[var(--color-primary-400)] bg-[var(--color-surface)] text-[var(--color-text)]';

        return (
          <div
            key={toast.toastId}
            role="alert"
            aria-live="polite"
            className={[
              'p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-start gap-3 pointer-events-auto transition-all animate-slideDown',
              borderClass,
            ].join(' ')}
          >
            {/* Icon */}
            <div className="p-2 rounded-xl bg-white/80 shrink-0 shadow-2xs mt-0.5">
              {isEmergency ? (
                <AlertTriangle size={18} className="text-red-600 animate-pulse" />
              ) : isTurnSoon ? (
                <BellRing size={18} className="text-blue-600 animate-bounce" />
              ) : isCompleted ? (
                <CheckCircle2 size={18} className="text-emerald-600" />
              ) : isReport ? (
                <FileText size={18} className="text-indigo-600" />
              ) : (
                <Sparkles size={18} className="text-[var(--color-primary-600)]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className="font-black text-sm sm:text-base leading-snug block">
                {toast.title}
              </span>
              <p className="text-xs sm:text-sm font-semibold opacity-90 mt-0.5 leading-snug">
                {toast.message}
              </p>

              {/* Action Button */}
              {toast.actionUrl && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(toast.actionUrl!);
                    setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId));
                  }}
                  className="mt-2 text-xs font-black underline hover:opacity-80 transition-opacity"
                >
                  {toast.actionLabel || 'View Details'} →
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId))}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </aside>
  );
}
