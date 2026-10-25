import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Shield,
  Download,
  Ticket,
  Stethoscope,
  CheckCircle2,
  Edit2,
  Check,
} from 'lucide-react';
import { useAuth, deriveNameFromEmail } from '../../context/AuthContext';
import { BaseLayout } from '../../components/layout';
import {
  PageHeader,
  Button,
  Card,
  StatusBadge,
  OptionCard,
} from '../../components/ui';
import { getPatientSlipHistory } from '../../services/hospitalService';
import {
  fetchSupabaseSlips,
  fetchSupabaseVisits,
  fetchSupabaseReports,
  subscribeToRealtimeSlips,
  subscribeToRealtimeVisits,
} from '../../services/supabaseClient';
import type { Slip, VisitRecord, MedicalReport } from '../../types';

export function PatientHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isGuest, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'slips' | 'reports'>('slips');
  const [slips, setSlips] = useState<Slip[]>([]);
  const [cloudVisits, setCloudVisits] = useState<VisitRecord[]>([]);
  const [cloudReports, setCloudReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [ageInput, setAgeInput] = useState<number | ''>('');
  const [genderInput, setGenderInput] = useState<string>('');

  // Determine authentic patient name
  const authenticatedName = useMemo(() => {
    if (user?.name && user.name !== 'Patient' && user.name !== 'Registered Patient') {
      return user.name;
    }
    const slipWithName = slips.find((s) => s.patientName && s.patientName !== 'Patient');
    if (slipWithName?.patientName) return slipWithName.patientName;
    if (user?.email) {
      const derived = deriveNameFromEmail(user.email);
      if (derived && derived !== 'Registered Patient') return derived;
    }
    return user?.name || 'Registered Patient';
  }, [user, slips]);

  // Synchronize authenticated name if user profile was generic
  useEffect(() => {
    if (user && user.name === 'Patient' && authenticatedName && authenticatedName !== 'Patient') {
      updateUserProfile({ name: authenticatedName });
    }
  }, [user, authenticatedName, updateUserProfile]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [cloudSlips, localSlips] = await Promise.all([
          fetchSupabaseSlips(user?.id, user?.email, user?.phone),
          getPatientSlipHistory(user?.id, user?.email),
        ]);
        const slipMap = new Map<string, Slip>();
        for (const s of cloudSlips) slipMap.set(s.token || s.id, s);
        for (const s of localSlips) {
          const key = s.token || s.id;
          if (!slipMap.has(key)) slipMap.set(key, s);
        }

        if (isMounted) {
          setSlips(Array.from(slipMap.values()));
        }

        if (user?.id) {
          const [vData, rData] = await Promise.all([
            fetchSupabaseVisits(user.id, user.email),
            fetchSupabaseReports(user.id),
          ]);
          if (isMounted) {
            if (vData.length > 0) setCloudVisits(vData);
            if (rData.length > 0) setCloudReports(rData);
          }
        }
      } catch (err) {
        console.warn('Failed to load history', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    // Setup Supabase Realtime subscriptions for live synchronization
    const unsubscribeSlips = subscribeToRealtimeSlips(user?.id, user?.email, (newOrUpdatedSlip) => {
      if (!isMounted) return;
      setSlips((prev) => {
        const map = new Map<string, Slip>();
        map.set(newOrUpdatedSlip.token || newOrUpdatedSlip.id, newOrUpdatedSlip);
        for (const s of prev) {
          const key = s.token || s.id;
          if (!map.has(key)) map.set(key, s);
        }
        return Array.from(map.values());
      });
    });

    const unsubscribeVisits = subscribeToRealtimeVisits(user?.id, (newOrUpdatedVisit) => {
      if (!isMounted) return;
      setCloudVisits((prev) => {
        const map = new Map<string, VisitRecord>();
        map.set(newOrUpdatedVisit.id, newOrUpdatedVisit);
        for (const v of prev) {
          if (!map.has(v.id)) map.set(v.id, v);
        }
        return Array.from(map.values());
      });
    });

    return () => {
      isMounted = false;
      unsubscribeSlips();
      unsubscribeVisits();
    };
  }, [user?.id, user?.email, user?.phone]);

  // Combine user visits & reports
  const pastVisits: VisitRecord[] = cloudVisits.length > 0 ? cloudVisits : (user?.visits || []);
  const reports: MedicalReport[] = cloudReports.length > 0 ? cloudReports : (user?.reports || []);

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container gap-4">
        {/* Header with back button */}
        <PageHeader
          title={t('history.page_title')}
          subtitle={t('history.page_subtitle')}
          onBack={() => navigate('/')}
        />

        {/* ── GUEST USER PROMPT ────────────────────────────────────────── */}
        {isGuest && (
          <OptionCard
            as="div"
            icon={<Shield size={24} aria-hidden="true" />}
            iconBgClass="bg-[var(--color-primary-500)] text-white shadow-sm"
            title={t('history.guest_title')}
            description={t('history.guest_desc')}
            className="border-[var(--color-primary-400)] bg-[var(--color-primary-50)]/60"
            footer={
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<User size={16} />}
                  onClick={() => navigate('/patient/start')}
                >
                  {t('history.guest_login_btn')}
                </Button>
              </div>
            }
          />
        )}

        {/* ── REGISTERED USER PROFILE BANNER ──────────────────────────── */}
        {!isGuest && user && (
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-500)] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  <User size={24} aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-xl text-[var(--color-text)] tracking-tight">
                      {authenticatedName}
                    </h2>
                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setNameInput(authenticatedName);
                          setAgeInput(user.age !== undefined && user.age !== null ? user.age : '');
                          setGenderInput(user.gender || '');
                          setIsEditingProfile(true);
                        }}
                        className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-surface-2)] transition-colors"
                        title="Edit profile"
                        aria-label="Edit profile"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-mono font-semibold text-[var(--color-primary-600)] mt-0.5">
                    Patient ID: {user.id}
                  </p>
                </div>
              </div>
              <StatusBadge
                variant="success"
                icon={<CheckCircle2 size={13} />}
                label={t('slip.registered_badge', 'Registered Patient')}
              />
            </div>

            {/* Profile Edit Form */}
            {isEditingProfile ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nameInput.trim()) {
                    updateUserProfile({
                      name: nameInput.trim(),
                      age: ageInput !== '' ? Number(ageInput) : undefined,
                      gender: genderInput || undefined,
                    });
                    setIsEditingProfile(false);
                  }
                }}
                className="mt-2 pt-3 border-t border-[var(--color-border)] flex flex-col gap-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 text-sm font-semibold rounded-lg border-2 border-[var(--color-primary-500)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">Age (years)</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={ageInput}
                      onChange={(e) => setAgeInput(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 25"
                      className="w-full px-3 py-2 text-sm font-semibold rounded-lg border-2 border-[var(--color-primary-500)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">Gender</label>
                    <select
                      value={genderInput}
                      onChange={(e) => setGenderInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold rounded-lg border-2 border-[var(--color-primary-500)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[var(--color-primary-500)] text-white text-xs font-bold hover:brightness-110 flex items-center gap-1.5 shadow-sm"
                  >
                    <Check size={14} /> Save to Cloud Profile
                  </button>
                </div>
              </form>
            ) : (
              /* Profile Details Badges */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)]">
                <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2 flex flex-col">
                  <span className="font-bold text-[10px] uppercase text-[var(--color-text-muted)]">Phone</span>
                  <span className="font-semibold text-[var(--color-text)] truncate">{user.phone || '1234567890'}</span>
                </div>
                <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2 flex flex-col">
                  <span className="font-bold text-[10px] uppercase text-[var(--color-text-muted)]">Email</span>
                  <span className="font-semibold text-[var(--color-text)] truncate">{user.email || 'None'}</span>
                </div>
                <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2 flex flex-col">
                  <span className="font-bold text-[10px] uppercase text-[var(--color-text-muted)]">Age & Gender</span>
                  <span className="font-semibold text-[var(--color-text)] truncate">
                    {user.age !== undefined && user.age !== null ? `${user.age} yrs` : 'Not set'} • {user.gender || 'Not set'}
                  </span>
                </div>
                <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2 flex flex-col">
                  <span className="font-bold text-[10px] uppercase text-[var(--color-text-muted)]">ABHA ID</span>
                  <span className="font-semibold text-[var(--color-text)] truncate">{user.abhaId || '12-3456-7890-1234'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB SELECTOR (Registered Only) ─────────────────────────── */}
        {!isGuest && (
          <div className="flex gap-2 border-b-2 border-[var(--color-border)] pb-2" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'slips'}
              onClick={() => setActiveTab('slips')}
              className={[
                'btn btn-sm text-sm font-bold transition-all',
                activeTab === 'slips'
                  ? 'btn-primary'
                  : 'btn-ghost text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              <Ticket size={16} />
              <span>{t('history.visits_tab')}</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              className={[
                'btn btn-sm text-sm font-bold transition-all',
                activeTab === 'reports'
                  ? 'btn-primary'
                  : 'btn-ghost text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              <FileText size={16} />
              <span>{t('history.reports_tab')} ({reports.length})</span>
            </button>
          </div>
        )}

        {/* ── TAB 1: VISITS & SLIPS ───────────────────────────────────── */}
        {(!isGuest ? activeTab === 'slips' : true) && (
          <div className="flex flex-col gap-4">
            {/* Recent Slips from localStorage */}
            {slips.length > 0 && (
              <section aria-label={t('history.current_session_slips')}>
                <h3 className="section-label">
                  {isGuest ? t('history.current_session_slips') : t('history.active_slips', { defaultValue: 'Recent Visit Slips' })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slips.map((slip) => {
                    const statusVariant =
                      slip.status === 'in_progress' ? 'success' : slip.status === 'turn_soon' ? 'info' : 'warning';
                    const statusLabel =
                      slip.status === 'in_progress'
                        ? t('slip.status_in_progress')
                        : slip.status === 'turn_soon'
                          ? t('slip.status_turn_soon')
                          : t('slip.status_waiting');

                    return (
                      <OptionCard
                        key={slip.id}
                        onClick={() => navigate(`/patient/slip/${slip.id}`, { state: { slip } })}
                        icon={<Ticket size={24} />}
                        iconBgClass="bg-[var(--color-primary-500)] text-white shadow-sm"
                        title={
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{slip.token}</span>
                            <span className="text-sm font-normal text-[var(--color-text-muted)]">
                              • {t(slip.department.nameKey)}
                            </span>
                          </div>
                        }
                        description={`Room ${slip.roomNumber || slip.department.roomNumbers[0]}, Floor ${slip.floor ?? slip.department.floor} — ${slip.doctorName || 'Doctor on Duty'}`}
                        badge={
                          <StatusBadge
                            variant={statusVariant}
                            icon={<Clock size={13} />}
                            label={statusLabel}
                          />
                        }
                        footer={
                          <div className="flex items-center justify-between text-xs text-[var(--color-primary-600)] font-bold">
                            <span>{new Date(slip.generatedAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1">
                              {t('history.view_slip')} <ArrowRight size={14} />
                            </span>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past Medical Consultations (for registered users) */}
            {!isGuest && (
              <section aria-label={t('history.past_consultations')}>
                <h3 className="section-label">{t('history.past_consultations')}</h3>
                {pastVisits.length === 0 && slips.length === 0 ? (
                  <Card className="text-center py-8 text-[var(--color-text-muted)]">
                    <p>{t('history.no_records')}</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pastVisits.map((visit) => (
                      <OptionCard
                        key={visit.id}
                        as="div"
                        icon={<Ticket size={22} />}
                        iconBgClass="bg-[var(--color-surface-2)] text-[var(--color-text)] font-mono font-bold text-xs"
                        title={
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] font-mono font-bold text-xs">
                              {visit.tokenNumber}
                            </span>
                            <span>{visit.departmentName}</span>
                          </div>
                        }
                        description={visit.diagnosisSummary}
                        badge={
                          <StatusBadge
                            variant={visit.status === 'completed' ? 'neutral' : 'info'}
                            label={visit.status === 'completed' ? 'Completed' : 'In Progress'}
                          />
                        }
                        footer={
                          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] font-medium pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={13} />
                              {visit.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Stethoscope size={13} />
                              {visit.doctorName}
                            </span>
                          </div>
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Guest with no slips */}
            {isGuest && slips.length === 0 && !loading && (
              <Card className="text-center py-10 text-[var(--color-text-muted)]">
                <Ticket size={36} className="mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-base">{t('history.no_records')}</p>
                <p className="text-xs mt-1">Start a visit at the hospital entrance to receive your queue slip.</p>
                <div className="mt-4">
                  <Button variant="primary" size="sm" onClick={() => navigate('/patient/visit')}>
                    Start New Visit
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── TAB 2: MEDICAL REPORTS (Registered Only) ────────────────── */}
        {!isGuest && activeTab === 'reports' && (
          <section aria-label={t('history.reports_tab')}>
            <h3 className="section-label">{t('history.reports_title')}</h3>
            {reports.length === 0 ? (
              <Card className="text-center py-8 text-[var(--color-text-muted)]">
                <p>No medical reports available yet.</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {reports.map((report) => (
                  <OptionCard
                    key={report.id}
                    as="div"
                    icon={<FileText size={20} />}
                    iconBgClass="bg-blue-50 text-[var(--color-primary-500)]"
                    title={report.title}
                    description={`${report.department} • ${report.date} • ${report.fileSize}`}
                    footer={
                      <div className="pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Download size={15} />}
                          onClick={() => alert(`Simulated downloading ${report.title} (${report.fileSize})`)}
                        >
                          {t('history.download_report')}
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </BaseLayout>
  );
}
