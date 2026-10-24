import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  Printer,
  Navigation,
  CheckCircle,
  TriangleAlert,
  Stethoscope,
  Volume2,
  VolumeX,
  Share2,
  Download,
  AlertTriangle,
  FileText,
  Accessibility,
  X,
  Layers,
  DoorClosed,
  BellRing,
  UserCheck,
  Sparkles,
  Coffee,
  Radio,
} from 'lucide-react';
import { BaseLayout } from '../components/layout';
import {
  Button,
  StatusBadge,
  OptionCard,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getSlipById } from '../services/hospitalService';
import { usePatientLiveStatus } from '../services/liveStore';
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function floorLabel(floor?: number, t?: (key: string, opts?: any) => string): string {
  if (floor === undefined) return '';
  if (floor === 0) return t ? t('common.ground_floor') : 'Ground Floor';
  if (floor < 0) return `Floor B${Math.abs(floor)}`;
  return `Floor ${floor}`;
}

export function SlipPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [slip, setSlip] = useState<Slip | null>(
    (location.state as { slip?: Slip })?.slip || null
  );
  const liveStatus = usePatientLiveStatus(slip?.token, slip?.department?.id);
  const [loading, setLoading] = useState(!slip);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Modals state
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);

  // Load slip if not passed via location state
  useEffect(() => {
    async function fetchSlip() {
      if (!slip) {
        try {
          setLoading(true);
          const loaded = await getSlipById(id || 'latest');
          if (loaded) {
            setSlip(loaded);
          } else {
            navigate('/', { replace: true });
          }
        } catch {
          navigate('/', { replace: true });
        } finally {
          setLoading(false);
        }
      }
    }
    fetchSlip();
  }, [id, slip, navigate]);

  // Focus heading on mount
  useEffect(() => {
    if (slip) {
      headingRef.current?.focus();
    }
  }, [slip]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSpeakDirections = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = slip?.humanReadableDirection || '';
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
    };
    utterance.lang = langMap[i18n.language] || 'en-IN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleShare = async () => {
    if (!slip) return;
    const shareText = `Vaid Disha Hospital Slip\nToken: ${slip.token}\nPatient: ${slip.patientName || 'Patient'}${slip.isGuest ? ' (Guest)' : ''}\nDepartment: ${t(slip.department.nameKey)}\nDoctor: ${slip.doctorName || ''}\nRoom: ${slip.roomNumber || ''}, ${floorLabel(slip.floor, t)}\nDirection: ${slip.humanReadableDirection || ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hospital Slip - ${slip.token}`,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch {
      alert(shareText);
    }
  };

  const handleDownloadImage = () => {
    if (!slip) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1050;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1050);

    // Border
    ctx.strokeStyle = '#0072B2';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 1010);

    // Header band
    ctx.fillStyle = '#0072B2';
    ctx.fillRect(20, 20, 760, 100);

    // Hospital header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAID DISHA HOSPITAL', 400, 60);
    ctx.font = '16px sans-serif';
    ctx.fillText('OUTPATIENT APPOINTMENT SLIP', 400, 95);

    // Token Section
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6c757d';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TOKEN NUMBER', 50, 165);

    ctx.fillStyle = '#0072B2';
    ctx.font = 'bold 52px monospace';
    ctx.fillText(slip.token, 50, 225);

    // Patient Name
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 26px sans-serif';
    const guestLabel = slip.isGuest ? ' (Guest)' : '';
    ctx.fillText(`${slip.patientName || 'Patient'}${guestLabel}`, 50, 275);

    ctx.fillStyle = '#6c757d';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      `Date: ${formatDate(slip.generatedAt)} at ${formatTime(slip.generatedAt)}`,
      50,
      305
    );

    // Divider line
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 335);
    ctx.lineTo(750, 335);
    ctx.stroke();

    // Key details
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Department: ${t(slip.department.nameKey)}`, 50, 385);

    ctx.font = '19px sans-serif';
    ctx.fillText(`Doctor: ${slip.doctorName || 'Doctor on Duty'}`, 50, 425);
    ctx.fillText(`Room: ${slip.roomNumber || '101'}`, 50, 465);
    ctx.fillText(
      `Floor: ${floorLabel(slip.floor, t)} (${slip.wing || slip.department.wing || 'Main Wing'}, Building ${slip.department.building})`,
      50,
      505
    );

    // Queue status
    ctx.beginPath();
    ctx.moveTo(50, 535);
    ctx.lineTo(750, 535);
    ctx.stroke();

    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#E69F00';
    const effectiveStatus = liveStatus.status || slip.status;
    const effectiveWait = liveStatus.estimatedWaitMinutes ?? slip.estimatedWait;
    const effectivePeopleAhead = liveStatus.peopleAhead ?? slip.peopleAhead ?? 1;

    const statusText =
      effectiveStatus === 'in_progress'
        ? 'In Consultation'
        : effectiveStatus === 'turn_soon'
          ? 'Your Turn Soon'
          : 'Waiting in Queue';
    ctx.fillText(`Queue Status: ${statusText}`, 50, 575);

    ctx.fillStyle = '#212529';
    ctx.fillText(`Estimated Wait: ~${effectiveWait} minutes`, 50, 615);
    ctx.fillText(`People ahead of you: ${effectivePeopleAhead}`, 50, 655);

    // Direction box
    ctx.beginPath();
    ctx.moveTo(50, 690);
    ctx.lineTo(750, 690);
    ctx.stroke();

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#0072B2';
    ctx.fillText('HOW TO REACH FROM ENTRANCE:', 50, 730);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#212529';
    const dirText = slip.humanReadableDirection || 'Proceed from main entrance to the counter.';
    const words = dirText.split(' ');
    let line = '';
    let y = 765;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 680 && n > 0) {
        ctx.fillText(line, 50, y);
        line = words[n] + ' ';
        y += 28;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 50, y);

    // Printable footer
    ctx.fillStyle = '#6c757d';
    ctx.font = 'italic 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Please show this slip at the department counter upon arrival.', 400, 980);

    const link = document.createElement('a');
    link.download = `VaidDisha-Slip-${slip.token}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (loading || !slip) {
    return (
      <BaseLayout showHome={true} headerTitle={t('app.name')}>
        <div className="page-container text-center py-16">
          <p className="text-base text-[var(--color-text-muted)] font-medium">
            {t('common.loading')}
          </p>
        </div>
      </BaseLayout>
    );
  }

  const isEmergency = slip.department.category === 'emergency';
  const isGuestUser = slip.isGuest ?? (user ? user.isGuest : true);

  const effectiveStatus = liveStatus.status || slip.status || 'waiting';
  const effectiveWait = liveStatus.estimatedWaitMinutes ?? slip.estimatedWait ?? 15;
  const effectivePeopleAhead = liveStatus.peopleAhead ?? slip.peopleAhead ?? 1;
  const nowServingToken = liveStatus.nowServingToken;
  const deptLive = liveStatus.department;
  const activeAlerts = liveStatus.activeAlerts;

  // Live status badge & card styling (icon + text + colour)
  const getLiveConfig = () => {
    if (deptLive?.statusCode === 'emergency' || isEmergency) {
      return {
        variant: 'danger' as const,
        icon: <TriangleAlert size={18} className="text-red-600 shrink-0" aria-hidden="true" />,
        badgeLabel: 'Emergency Priority',
        headline: deptLive?.statusMessage || 'Emergency Priority — Immediate Care',
        subtext: 'Proceed directly to the triage desk.',
        cardClass: 'bg-red-50 border-2 border-red-400 text-red-950',
        clockColor: 'text-red-700',
        waitText: 'Immediate (No Wait)',
      };
    }

    if (effectiveStatus === 'in_progress') {
      return {
        variant: 'success' as const,
        icon: <UserCheck size={18} className="text-emerald-700 shrink-0 animate-pulse" aria-hidden="true" />,
        badgeLabel: t('slip.status_in_progress'),
        headline: `Attending Now in Room ${slip.roomNumber || deptLive?.roomNumber || '101'}`,
        subtext: 'Please enter the room now. The specialist is attending to you.',
        cardClass: 'bg-emerald-50 border-2 border-emerald-400 text-emerald-950',
        clockColor: 'text-emerald-700',
        waitText: t('slip.no_wait'),
      };
    }

    if (effectiveStatus === 'turn_soon') {
      return {
        variant: 'info' as const,
        icon: <BellRing size={18} className="text-blue-700 shrink-0 animate-bounce" aria-hidden="true" />,
        badgeLabel: t('slip.status_turn_soon'),
        headline: 'Your Turn Soon! (Next in line)',
        subtext: `Please stay directly outside Room ${slip.roomNumber || deptLive?.roomNumber || '101'}.`,
        cardClass: 'bg-blue-50 border-2 border-blue-400 text-blue-950',
        clockColor: 'text-blue-700',
        waitText: effectiveWait === 0 ? t('slip.no_wait') : t('slip.minutes_wait', { minutes: effectiveWait }),
      };
    }

    if (deptLive?.statusCode === 'break') {
      return {
        variant: 'warning' as const,
        icon: <Coffee size={18} className="text-amber-700 shrink-0" aria-hidden="true" />,
        badgeLabel: 'Doctor on Break',
        headline: deptLive.statusMessage || `Doctor on break until ${deptLive.breakUntil || 'shortly'}`,
        subtext: 'Consultations will resume shortly. Please relax in the waiting lounge.',
        cardClass: 'bg-amber-50 border-2 border-amber-400 text-amber-950',
        clockColor: 'text-amber-700',
        waitText: t('slip.minutes_wait', { minutes: effectiveWait }),
      };
    }

    if (deptLive?.statusCode === 'delayed') {
      return {
        variant: 'warning' as const,
        icon: <AlertTriangle size={18} className="text-orange-700 shrink-0" aria-hidden="true" />,
        badgeLabel: 'Department Delayed',
        headline: deptLive.statusMessage || `Lab delayed by ${deptLive.delayMinutes || 20} min`,
        subtext: 'Estimated wait times have been adjusted automatically based on batch workload.',
        cardClass: 'bg-orange-50 border-2 border-orange-400 text-orange-950',
        clockColor: 'text-orange-700',
        waitText: t('slip.minutes_wait', { minutes: effectiveWait }),
      };
    }

    // Default waiting
    return {
      variant: 'warning' as const,
      icon: <Clock size={18} className="text-amber-700 shrink-0" aria-hidden="true" />,
      badgeLabel: deptLive?.statusMessage || t('slip.status_waiting'),
      headline: deptLive?.statusMessage || 'Doctor with another patient',
      subtext: nowServingToken ? `Currently attending token #${nowServingToken}` : 'Queue is advancing normally.',
      cardClass: 'bg-[var(--color-warning-50)] border-2 border-[var(--color-warning-300)] text-[var(--color-warning-950)]',
      clockColor: 'text-[var(--color-warning-700)]',
      waitText: effectiveWait === 0 ? t('slip.no_wait') : t('slip.minutes_wait', { minutes: effectiveWait }),
    };
  };

  const statusConfig = getLiveConfig();

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container gap-4">
        {/* Emergency Alert Banner if Emergency */}
        {isEmergency && (
          <div
            role="alert"
            aria-live="assertive"
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 bg-[var(--color-danger-50)] border-2 border-[var(--color-danger-500)] rounded-2xl p-4 shadow-sm"
          >
            <TriangleAlert
              size={24}
              className="text-[var(--color-danger-500)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="font-bold text-[var(--color-danger-900)] text-base break-words">
              {t('slip.note_emergency')}
            </p>
          </div>
        )}

        {/* Copy toast feedback */}
        {copiedToast && (
          <div
            role="status"
            className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-950 rounded-xl text-sm font-bold text-center animate-fadeIn"
          >
            {t('slip.link_copied')}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            THE PRINTABLE HOSPITAL SLIP (Heart of the App)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
          {/* ══════════════════════════════════════════════════════════════════
              COLUMN 1 (Left on desktop): THE PRINTABLE HOSPITAL SLIP DETAILS
              ══════════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4">
            <article
              id="hospital-printable-slip"
              aria-label={t('slip.page_title')}
              className={[
                'card border-2 border-[var(--color-primary-500)] bg-[var(--color-surface)] shadow-md rounded-2xl',
                'p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden',
                // Printable paper effect styling
                'print:border-2 print:border-black print:shadow-none print:p-4',
              ].join(' ')}
            >
              {/* Hospital Header & Subtitle */}
              <div className="border-b-2 border-dashed border-[var(--color-border)] pb-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-700)] block">
                    {t('slip.hospital_title')}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider">
                    {t('slip.slip_subtitle')}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  {formatDate(slip.generatedAt)} • {formatTime(slip.generatedAt)}
                </span>
              </div>

              {/* 1. Large Token Number & Patient Name (with Guest badge if guest) */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--color-text-muted)] block mb-0.5">
                    {t('slip.your_token')}
                  </span>
                  <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[var(--color-primary-500)] leading-none"
                    aria-label={t('a11y.token_label', { token: slip.token })}
                  >
                    {slip.token}
                  </h1>
                </div>

                <div className="flex flex-col sm:items-end">
                  <span className="text-xs uppercase font-bold text-[var(--color-text-muted)]">
                    {t('slip.patient_label')}
                  </span>
                  <span className="font-extrabold text-xl sm:text-2xl text-[var(--color-text)]">
                    {slip.patientName || 'Patient'}
                  </span>
                  <div className="mt-1">
                    {isGuestUser ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {t('slip.guest_badge')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        {t('slip.registered_badge')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <hr className="divider border-t-2 border-[var(--color-border)] my-1" />

              {/* 2. Department, Doctor, Room, Floor – Large and clear with icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Department */}
                <OptionCard
                  as="div"
                  icon={<Building2 size={22} aria-hidden="true" />}
                  iconBgClass="bg-[var(--color-primary-50)] text-[var(--color-primary-500)]"
                  title={t('slip.department')}
                  description={t(slip.department.nameKey)}
                  className="p-3 bg-[var(--color-surface-2)] border-[var(--color-border)]"
                />

                {/* Doctor */}
                <OptionCard
                  as="div"
                  icon={<Stethoscope size={22} aria-hidden="true" />}
                  iconBgClass="bg-[var(--color-primary-50)] text-[var(--color-primary-500)]"
                  title={t('slip.doctor')}
                  description={slip.doctorName || slip.department.doctorName || 'Doctor on Duty'}
                  className="p-3 bg-[var(--color-surface-2)] border-[var(--color-border)]"
                />

                {/* Room */}
                <OptionCard
                  as="div"
                  icon={<DoorClosed size={22} aria-hidden="true" />}
                  iconBgClass="bg-[var(--color-primary-50)] text-[var(--color-primary-500)]"
                  title={t('slip.room')}
                  description={`Room ${slip.roomNumber || slip.department.roomNumbers[0]}`}
                  className="p-3 bg-[var(--color-surface-2)] border-[var(--color-border)]"
                />

                {/* Floor & Wing */}
                <OptionCard
                  as="div"
                  icon={<Layers size={22} aria-hidden="true" />}
                  iconBgClass="bg-[var(--color-primary-50)] text-[var(--color-primary-500)]"
                  title={t('slip.floor')}
                  description={`${floorLabel(slip.floor, t)} • ${slip.wing || slip.department.wing || 'West Wing'} (Bldg ${slip.department.building})`}
                  className="p-3 bg-[var(--color-surface-2)] border-[var(--color-border)]"
                />
              </div>

              <hr className="divider border-t-2 border-[var(--color-border)] my-1" />

              {/* 3. Live Status Card (Icon + Text + Colour with adjusting wait time & multi-tab sync) */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {t('slip.live_status')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Sync
                    </span>
                  </div>
                  <StatusBadge
                    variant={statusConfig.variant}
                    icon={statusConfig.icon}
                    label={statusConfig.badgeLabel}
                  />
                </div>

                {/* Main Live Card with Icon, Text, Color, and Dynamic Wait */}
                <div className={`p-4 rounded-2xl flex flex-col gap-3 transition-colors ${statusConfig.cardClass}`}>
                  {/* Status Headline & Description */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white/85 shrink-0 shadow-xs mt-0.5">
                      {statusConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-black leading-snug">
                        {statusConfig.headline}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold opacity-90 mt-0.5">
                        {statusConfig.subtext}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Metrics Row: Wait Time & Queue Position */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-current/15">
                    {/* Wait Time */}
                    <div className="p-2.5 rounded-xl bg-white/75 flex items-center gap-2.5">
                      <Clock size={20} className={`${statusConfig.clockColor} shrink-0`} />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                          {t('slip.estimated_wait')}
                        </span>
                        <span className="text-base sm:text-lg font-black">
                          {statusConfig.waitText}
                        </span>
                      </div>
                    </div>

                    {/* Queue Position & Now Serving */}
                    <div className="p-2.5 rounded-xl bg-white/75 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                          Queue Position
                        </span>
                        <span className="text-base font-extrabold">
                          {effectivePeopleAhead > 0
                            ? t('slip.people_ahead', { count: effectivePeopleAhead })
                            : t('slip.people_ahead_zero')}
                        </span>
                      </div>
                      {nowServingToken && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                            Now Serving
                          </span>
                          <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-black/10">
                            {nowServingToken}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Hospital Announcement / Delay Alert if any */}
                  {activeAlerts.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-white/90 border border-current/20 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                      <span className="truncate">{activeAlerts[0].title}: {activeAlerts[0].message}</span>
                    </div>
                  )}

                  {/* Live Room Status link */}
                  <Link
                    to={`/patient/live?token=${slip.token}&dept=${slip.department.id}&slipId=${slip.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/90 hover:bg-white text-xs sm:text-sm font-bold text-[var(--color-primary-800)] border border-[var(--color-primary-300)] transition-all shadow-xs group"
                  >
                    <span className="flex items-center gap-2">
                      <Radio size={16} className="text-[var(--color-primary-600)] animate-pulse" />
                      What's happening at destination right now?
                    </span>
                    <span className="text-[var(--color-primary-600)] group-hover:translate-x-1 transition-transform font-extrabold shrink-0">
                      View Live Tracker →
                    </span>
                  </Link>
                </div>
              </div>

              {/* Save slip status indicator */}
              {!isGuestUser ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs sm:text-sm font-semibold">
                  <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                  <span>{t('slip.auto_saved_notice')}</span>
                  <Link to="/patient/history" className="ml-auto underline font-bold text-xs sm:text-sm shrink-0">
                    {t('slip.view_history_btn')} →
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-medium flex-wrap">
                  <span>{t('history.guest_desc')}</span>
                  <Link to="/patient/start" className="underline font-bold text-xs shrink-0 text-amber-950">
                    {t('history.guest_login_btn')}
                  </Link>
                </div>
              )}
            </article>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              COLUMN 2 (Right on desktop): "HOW TO REACH" + ACTION BUTTONS
              ══════════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4">
            {/* 5. A short "How to reach" text box with speaker button */}
            <div className="p-4 rounded-2xl bg-[var(--color-primary-50)]/70 border-2 border-[var(--color-primary-300)] flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary-800)] flex items-center gap-1.5">
                  <Sparkles size={15} aria-hidden="true" />
                  {t('slip.how_to_reach_title')}
                </span>

                {/* TTS Speaker Button */}
                <button
                  type="button"
                  onClick={handleSpeakDirections}
                  className={[
                    'btn btn-sm px-3 rounded-full flex items-center gap-1.5 transition-all',
                    isSpeaking
                      ? 'btn-primary animate-pulse'
                      : 'btn-secondary bg-white text-[var(--color-primary-600)] border border-[var(--color-primary-400)]',
                  ].join(' ')}
                  aria-label={isSpeaking ? t('slip.stop_listening') : t('slip.listen_directions')}
                  title={isSpeaking ? t('slip.stop_listening') : t('slip.listen_directions')}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX size={16} />
                      <span className="text-xs font-bold">{t('slip.stop_listening')}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span className="text-xs font-bold">{t('slip.listen_directions')}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-base font-bold text-[var(--color-primary-950)] leading-relaxed break-words">
                "{slip.humanReadableDirection || 'Follow the hospital main corridor to the department counter.'}"
              </p>
            </div>

            {/* 6. PRIMARY BUTTON: "Help me find the way" */}
            <div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={<Navigation size={22} />}
                onClick={() =>
                  navigate(`/patient/guidance/${slip.id}`, {
                    state: { departmentId: slip.department.id, slip },
                  })
                }
              >
                {t('slip.help_find_way')}
              </Button>
            </div>

            {/* 7. SECONDARY BUTTONS */}
            <div className="flex flex-col gap-2.5">
              {/* I need urgent attention */}
              <Button
                variant="danger"
                fullWidth
                icon={<AlertTriangle size={18} />}
                onClick={() => navigate('/patient/emergency')}
              >
                {t('slip.urgent_attention')}
              </Button>

              {/* View lab reports */}
              <Button
                variant="secondary"
                fullWidth
                icon={<FileText size={18} />}
                onClick={() => setShowReportsModal(true)}
              >
                {t('slip.view_reports')}
              </Button>

              {/* Show nearest washroom / wheelchair point */}
              <Button
                variant="secondary"
                fullWidth
                icon={<Accessibility size={18} />}
                onClick={() => setShowAmenitiesModal(true)}
              >
                {t('slip.nearest_amenities')}
              </Button>
            </div>

            {/* 8. SAVE SLIP ACTIONS (Download as image, Share, Print/Save PDF) */}
            <div className="p-4 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Save & Share Slip
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={handleDownloadImage}
                  className="border border-[var(--color-border)]"
                >
                  {t('slip.download_image')}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Share2 size={16} />}
                  onClick={handleShare}
                  className="border border-[var(--color-border)]"
                >
                  {t('slip.share_slip')}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Printer size={16} />}
                  onClick={handlePrint}
                  className="border border-[var(--color-border)]"
                >
                  {t('slip.print_slip')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODAL 1: VIEW LAB REPORTS ──────────────────────────────── */}
        {showReportsModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reports-modal-title"
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3 sm:p-5"
          >
            <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl w-full max-w-md p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={22} className="text-[var(--color-primary-500)]" />
                  <h3 id="reports-modal-title" className="font-extrabold text-lg text-[var(--color-text)]">
                    {t('slip.view_reports')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportsModal(false)}
                  className="btn btn-ghost btn-sm btn-icon rounded-full"
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { title: 'Lipid Profile & Serum Creatinine', dept: 'Pathology Lab', date: '2026-09-03', size: '1.2 MB' },
                  { title: 'Chest X-Ray Digital', dept: 'Radiology', date: '2026-07-21', size: '3.4 MB' },
                  { title: 'ECG Report (12-Lead)', dept: 'Cardiology', date: '2026-10-15', size: '850 KB' },
                ].map((rep, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text)]">{rep.title}</h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{rep.dept} • {rep.date} • {rep.size}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Download size={14} />}
                      onClick={() => alert(`Simulated download for ${rep.title}`)}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-2">
                <Button variant="ghost" fullWidth onClick={() => setShowReportsModal(false)}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: NEAREST AMENITIES & ACCESSIBILITY POINTS ──────── */}
        {showAmenitiesModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="amenities-modal-title"
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3 sm:p-5"
          >
            <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl w-full max-w-md p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-3">
                <div className="flex items-center gap-2">
                  <Accessibility size={22} className="text-[var(--color-primary-500)]" />
                  <h3 id="amenities-modal-title" className="font-extrabold text-lg text-[var(--color-text)]">
                    {t('slip.amenities_title')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAmenitiesModal(false)}
                  className="btn btn-ghost btn-sm btn-icon rounded-full"
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* Accessible Washroom */}
                <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <Accessibility size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-text)]">{t('slip.washroom_label')}</h4>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('slip.washroom_desc')}</p>
                  </div>
                </div>

                {/* Wheelchair Point */}
                <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <Accessibility size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-text)]">{t('slip.wheelchair_label')}</h4>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('slip.wheelchair_desc')}</p>
                  </div>
                </div>

                {/* Drinking Water */}
                <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--color-text)]">{t('slip.drinking_water')}</h4>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('slip.drinking_water_desc')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <Button variant="ghost" fullWidth onClick={() => setShowAmenitiesModal(false)}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
