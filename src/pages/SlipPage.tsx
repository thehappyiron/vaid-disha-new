import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Ticket,
  Building2,
  MapPin,
  Clock,
  Printer,
  Navigation,
  CheckCircle,
  TriangleAlert,
  Stethoscope,
  User,
  Compass,
  Accessibility,
} from 'lucide-react';
import { BaseLayout } from '../components/layout';
import { NavStepCard } from '../components/NavStepCard';
import type { Slip } from '../types';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function floorLabel(floor: number, t: (key: string, opts?: any) => string): string {
  if (floor === 0) return t('common.ground_floor');
  if (floor < 0) return `${t('common.floor')} B${Math.abs(floor)}`;
  return `${t('common.floor')} ${floor}`;
}

export function SlipPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const slip = (location.state as { slip?: Slip })?.slip;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Redirect if no slip data
  useEffect(() => {
    if (!slip) {
      navigate('/', { replace: true });
    }
  }, [slip, navigate]);

  // Auto-focus heading on mount for screen readers
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!slip) return null;

  const isEmergency = slip.department.category === 'emergency';
  const hasAccessibility =
    slip.accessibilityNeeds &&
    slip.accessibilityNeeds.length > 0 &&
    !slip.accessibilityNeeds.includes('none');

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container gap-5 min-w-0">
        {/* Emergency banner */}
        {isEmergency && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 bg-[var(--color-danger-50)] border-2 border-[var(--color-danger)] rounded-xl p-4 min-w-0"
          >
            <TriangleAlert
              size={24}
              className="text-[var(--color-danger)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="font-semibold text-[var(--color-danger)] text-sm sm:text-base break-words min-w-[12ch] flex-1">
              {t('slip.note_emergency')}
            </p>
          </div>
        )}

        {/* ── SLIP CARD ──────────────────────────────────────────────── */}
        <section
          aria-label={t('slip.page_title')}
          className="card border-2 border-[var(--color-primary-500)] p-4 sm:p-6 min-w-0 shadow-md"
        >
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4 min-w-0">
            <div className="min-w-[12ch] flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="section-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary-600)]">
                  <Ticket size={15} aria-hidden="true" />
                  {t('slip.page_title')}
                </span>
                {slip.patientName && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] flex items-center gap-1">
                    <User size={12} aria-hidden="true" />
                    <span>{slip.patientName}</span>
                  </span>
                )}
              </div>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl sm:text-3xl font-black tracking-wider text-[var(--color-primary-500)] break-words"
                aria-label={t('a11y.token_label', { token: slip.token })}
              >
                {slip.token}
              </h1>
            </div>
            {/* Success check */}
            <CheckCircle
              size={36}
              className="text-[var(--color-accent)] shrink-0"
              aria-hidden="true"
            />
          </div>

          {/* Accessibility Route Alert pill if applied */}
          {hasAccessibility && (
            <div className="mb-4 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[var(--color-primary-900)] font-semibold flex items-center gap-2">
              <Accessibility size={16} className="text-[var(--color-primary-600)] shrink-0" />
              <span>{t('slip.accessibility_applied')}</span>
            </div>
          )}

          {/* Divider */}
          <hr className="border-[var(--color-border)] mb-4" aria-hidden="true" />

          {/* Department details */}
          <div className="flex flex-col gap-3.5 min-w-0">
            {/* Department */}
            <div className="flex items-start gap-3 min-w-0">
              <Building2
                size={20}
                className="text-[var(--color-primary-500)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-[12ch] flex-1">
                <p className="text-xs text-[var(--color-text-muted)] font-medium">
                  {t('slip.department')}
                </p>
                <p className="font-bold text-base sm:text-lg text-[var(--color-text)] break-words">
                  {t(slip.department.nameKey)}
                </p>
              </div>
            </div>

            {/* Doctor Name */}
            {(slip.doctorName || slip.department.doctorName) && (
              <div className="flex items-start gap-3 min-w-0">
                <Stethoscope
                  size={20}
                  className="text-[var(--color-primary-500)] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-[12ch] flex-1">
                  <p className="text-xs text-[var(--color-text-muted)] font-medium">
                    {t('slip.doctor')}
                  </p>
                  <p className="font-bold text-sm sm:text-base text-[var(--color-text)] break-words">
                    {slip.doctorName || slip.department.doctorName}
                  </p>
                </div>
              </div>
            )}

            {/* Location (Building, Floor, Room, Wing) */}
            <div className="flex items-start gap-3 min-w-0">
              <MapPin
                size={20}
                className="text-[var(--color-primary-500)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-[12ch] flex-1">
                <p className="text-xs text-[var(--color-text-muted)] font-medium">
                  {t('slip.location')}
                </p>
                <p className="font-semibold text-sm sm:text-base text-[var(--color-text)] break-words">
                  {t('common.building')} {slip.department.building},{' '}
                  {floorLabel(slip.department.floor, t)} —{' '}
                  {t('common.room')} {slip.roomNumber || slip.department.roomNumbers[0]}
                  {slip.wing || slip.department.wing ? ` (${slip.wing || slip.department.wing})` : ''}
                </p>
              </div>
            </div>

            {/* Estimated Wait */}
            <div className="flex items-start gap-3 min-w-0">
              <Clock
                size={20}
                className="text-[var(--color-primary-500)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-[12ch] flex-1">
                <p className="text-xs text-[var(--color-text-muted)] font-medium">
                  {t('slip.estimated_wait')}
                </p>
                <p className="font-semibold text-sm sm:text-base text-[var(--color-text)] break-words">
                  {slip.estimatedWait === 0
                    ? t('slip.no_wait')
                    : t('slip.minutes_wait', { minutes: slip.estimatedWait })}
                </p>
              </div>
            </div>

            {/* Human Readable Direction Callout */}
            {slip.humanReadableDirection && (
              <div className="mt-2 p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary-700)] mb-1">
                  <Compass size={15} aria-hidden="true" />
                  <span>{t('slip.human_direction_title')}</span>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text)] leading-relaxed break-words">
                  "{slip.humanReadableDirection}"
                </p>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-[var(--color-text-muted)] mt-5 pt-3.5 border-t border-[var(--color-border)]">
            {t('slip.generated_at')}: {formatTime(slip.generatedAt)}
          </p>
        </section>

        {/* Print instructions note */}
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)] text-center px-2">
          {t('slip.print_instructions')}
        </p>

        {/* ── DIRECTIONS ─────────────────────────────────────────────── */}
        <section aria-label={t('slip.directions_title')} className="min-w-0">
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-1 break-words">
            {t('slip.directions_title')}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-4">
            {t('slip.from_entrance')}
          </p>

          <ol
            role="list"
            aria-label={t('slip.directions_title')}
            className="flex flex-col gap-4 min-w-0"
          >
            {slip.steps.map((step) => (
              <NavStepCard key={step.stepNumber} step={step} />
            ))}
          </ol>
        </section>

        {/* ── ACTION BUTTONS ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 mt-1 pb-4 min-w-0">
          {/* Wayfinding link */}
          <Link
            to="/wayfinding"
            state={{ departmentId: slip.department.id }}
            className="btn btn-secondary btn-full btn-lg min-w-0"
          >
            <Navigation size={18} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{t('slip.lost_link')}</span>
          </Link>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="btn btn-ghost btn-full min-w-0"
            aria-label={t('common.print')}
          >
            <Printer size={18} aria-hidden="true" className="shrink-0" />
            <span>{t('common.print')}</span>
          </button>
        </div>
      </div>
    </BaseLayout>
  );
}
