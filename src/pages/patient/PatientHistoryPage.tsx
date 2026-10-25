import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Mail,
  RefreshCw,
  Search,
  UserCheck,
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
  fetchSupabaseUserByEmailOrPhone,
  subscribeToRealtimeSlips,
  subscribeToRealtimeVisits,
} from '../../services/supabaseClient';
import type { Slip, VisitRecord, MedicalReport, UserProfile } from '../../types';

export function PatientHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isGuest: rawIsGuest, updateUserProfile, switchPatientAccountByEmail } = useAuth();

  // Guard against doctor/staff credentials contaminating the patient view
  const isStaffUser = user?.role === 'staff' || user?.id?.startsWith('stf-');
  const effectiveUser = isStaffUser ? null : user;

  // Active email account being viewed
  const [emailAccount, setEmailAccount] = useState<string>(() => {
    if (effectiveUser?.email) return effectiveUser.email.trim().toLowerCase();
    try {
      const saved = localStorage.getItem('vd-patient-email');
      if (saved) return saved.trim().toLowerCase();
      const latestRaw = localStorage.getItem('vd-latest-slip');
      if (latestRaw) {
        const parsed = JSON.parse(latestRaw);
        if (parsed?.patientEmail) return parsed.patientEmail.trim().toLowerCase();
      }
    } catch {}
    return '';
  });

  const [cloudProfile, setCloudProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'slips' | 'reports'>('slips');
  const [slips, setSlips] = useState<Slip[]>([]);
  const [cloudVisits, setCloudVisits] = useState<VisitRecord[]>([]);
  const [cloudReports, setCloudReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Email account switcher states
  const [isSwitchingEmail, setIsSwitchingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSwitchError, setEmailSwitchError] = useState('');

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [ageInput, setAgeInput] = useState<number | ''>('');
  const [genderInput, setGenderInput] = useState<string>('');

  const isGuest = !emailAccount && (rawIsGuest || !effectiveUser);

  // Synchronize emailAccount if user logs in or user profile changes
  useEffect(() => {
    if (effectiveUser?.email) {
      const clean = effectiveUser.email.trim().toLowerCase();
      if (clean !== emailAccount) {
        setEmailAccount(clean);
      }
    }
  }, [effectiveUser?.email]);

  // Determine authentic patient name — NEVER a doctor or random staff
  const authenticatedName = useMemo(() => {
    if (cloudProfile?.name && cloudProfile.name !== 'Patient' && cloudProfile.name !== 'Registered Patient') {
      return cloudProfile.name;
    }
    if (
      effectiveUser?.name &&
      effectiveUser.name !== 'Patient' &&
      effectiveUser.name !== 'Registered Patient' &&
      !effectiveUser.name.toLowerCase().startsWith('dr.')
    ) {
      return effectiveUser.name;
    }
    const slipWithName = slips.find(
      (s) => s.patientName && s.patientName !== 'Patient' && !s.patientName.toLowerCase().startsWith('dr.')
    );
    if (slipWithName?.patientName) return slipWithName.patientName;
    if (emailAccount) {
      const derived = deriveNameFromEmail(emailAccount);
      if (derived && derived !== 'Registered Patient') return derived;
    }
    return effectiveUser?.name || 'Registered Patient';
  }, [cloudProfile, effectiveUser, slips, emailAccount]);

  // Load patient cloud profile whenever email changes
  useEffect(() => {
    let isMounted = true;
    if (!emailAccount) {
      setCloudProfile(null);
      return;
    }

    fetchSupabaseUserByEmailOrPhone(emailAccount).then((profile) => {
      if (isMounted && profile) {
        setCloudProfile(profile);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [emailAccount]);

  // Main data loader strictly partitioned by active email or patient ID
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const activeId = cloudProfile?.id || effectiveUser?.id;
      const cleanEmail = emailAccount || undefined;

      const [cloudSlips, localSlips] = await Promise.all([
        fetchSupabaseSlips(activeId, cleanEmail),
        getPatientSlipHistory(activeId, cleanEmail),
      ]);

      const slipMap = new Map<string, Slip>();
      for (const s of cloudSlips) slipMap.set(s.token || s.id, s);
      for (const s of localSlips) {
        const key = s.token || s.id;
        if (!slipMap.has(key)) slipMap.set(key, s);
      }

      setSlips(Array.from(slipMap.values()));

      if (activeId || cleanEmail) {
        const [vData, rData] = await Promise.all([
          fetchSupabaseVisits(activeId, cleanEmail),
          activeId ? fetchSupabaseReports(activeId) : Promise.resolve([]),
        ]);
        setCloudVisits(vData);
        setCloudReports(rData);
      } else {
        setCloudVisits([]);
        setCloudReports([]);
      }
    } catch (err) {
      console.warn('[PatientHistory] Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [cloudProfile?.id, effectiveUser?.id, emailAccount]);

  // Trigger data load on email or user change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  useEffect(() => {
    let isMounted = true;
    const activeId = cloudProfile?.id || effectiveUser?.id;
    const cleanEmail = emailAccount || undefined;

    // 1. Supabase Postgres Realtime Subscription strictly isolated for this email / user
    const unsubscribeSlips = subscribeToRealtimeSlips(activeId, cleanEmail, (newOrUpdatedSlip) => {
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

    const unsubscribeVisits = subscribeToRealtimeVisits(activeId, (newOrUpdatedVisit) => {
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

    // 2. Cross-tab real-time sync via BroadcastChannel
    let broadcast: BroadcastChannel | null = null;
    try {
      broadcast = new BroadcastChannel('vaid-disha-sync');
      broadcast.onmessage = (event) => {
        if (!isMounted) return;
        if (event.data?.type === 'SLIP_CREATED' || event.data?.type === 'QUEUE_UPDATED') {
          loadData();
        }
      };
    } catch {}

    // 3. Storage event sync
    const handleStorage = (e: StorageEvent) => {
      if (!isMounted) return;
      if (e.key === 'vd-patient-slips' || e.key === 'vd-latest-slip' || e.key === 'vd-patient-email') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      unsubscribeSlips();
      unsubscribeVisits();
      broadcast?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [cloudProfile?.id, effectiveUser?.id, emailAccount, loadData]);

  // Handle switching to a different email account
  const handleSwitchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setEmailSwitchError('Please enter a valid email address');
      return;
    }
    setEmailSwitchError('');
    try {
      await switchPatientAccountByEmail(clean);
      setEmailAccount(clean);
      setIsSwitchingEmail(false);
      setEmailInput('');
    } catch {
      setEmailSwitchError('Failed to switch account. Please try again.');
    }
  };

  // Profile data values
  const displayId =
    cloudProfile?.id ||
    effectiveUser?.id ||
    (emailAccount ? `pat-${emailAccount.replace(/[^a-z0-9]/gi, '').slice(0, 10)}` : 'pat-guest');

  const displayPhone = cloudProfile?.phone || effectiveUser?.phone || 'Not set';
  const displayAge = cloudProfile?.age !== undefined ? cloudProfile.age : effectiveUser?.age;
  const displayGender = cloudProfile?.gender || effectiveUser?.gender;
  const displayAbha = cloudProfile?.abhaId || effectiveUser?.abhaId || '12-3456-7890-1234';

  const pastVisits: VisitRecord[] = cloudVisits.length > 0 ? cloudVisits : (effectiveUser?.visits || []);
  const reports: MedicalReport[] = cloudReports.length > 0 ? cloudReports : (effectiveUser?.reports || []);

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container gap-4">
        {/* Header with back button */}
        <PageHeader
          title={t('history.page_title')}
          subtitle={t('history.page_subtitle')}
          onBack={() => navigate('/')}
        />

        {/* ── ACCOUNT EMAIL PARTITION & SWITCHER BAR ────────────────────── */}
        <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[var(--color-primary-600)] flex items-center justify-center font-bold shrink-0">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Active Patient Account:
                  </span>
                  <span className="text-sm font-black text-[var(--color-text)] truncate">
                    {emailAccount || 'Guest (No email linked)'}
                  </span>
                  {emailAccount && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 size={11} /> Isolated Cloud Records
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  History is strictly partitioned by email. Each account sees only their own visits and slips.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
                onClick={() => loadData()}
                title="Refresh records"
              >
                Refresh
              </Button>
              <Button
                variant={isSwitchingEmail ? 'ghost' : 'secondary'}
                size="sm"
                icon={<Search size={14} />}
                onClick={() => {
                  setIsSwitchingEmail(!isSwitchingEmail);
                  setEmailSwitchError('');
                }}
              >
                {isSwitchingEmail ? 'Cancel' : 'Switch Email'}
              </Button>
            </div>
          </div>

          {/* Switch Email Input Drawer */}
          {isSwitchingEmail && (
            <form
              onSubmit={handleSwitchEmail}
              className="mt-2 pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email to view history (e.g. yourname@gmail.com)"
                  className="w-full pl-9 pr-3 py-2 text-sm font-semibold rounded-lg border-2 border-[var(--color-primary-500)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" variant="primary" size="sm" icon={<UserCheck size={16} />}>
                View Account History
              </Button>
              {emailSwitchError && (
                <p className="text-xs font-bold text-red-600 sm:w-full">{emailSwitchError}</p>
              )}
            </form>
          )}
        </div>

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
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<User size={16} />}
                  onClick={() => navigate('/patient/start')}
                >
                  {t('history.guest_login_btn')}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsSwitchingEmail(true)}
                  className="text-xs font-bold text-[var(--color-primary-600)] hover:underline"
                >
                  Have an existing registered email? Click here to load it
                </button>
              </div>
            }
          />
        )}

        {/* ── REGISTERED USER PROFILE BANNER ──────────────────────────── */}
        {!isGuest && (
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
                          setAgeInput(displayAge !== undefined && displayAge !== null ? displayAge : '');
                          setGenderInput(displayGender || '');
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
                    Patient ID: {displayId}
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
                    if (cloudProfile) {
                      setCloudProfile({
                        ...cloudProfile,
                        name: nameInput.trim(),
                        age: ageInput !== '' ? Number(ageInput) : undefined,
                        gender: genderInput || undefined,
                      });
                    }
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
                      placeholder="Enter patient name"
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
                  <span className="font-semibold text-[var(--color-text)] truncate">{displayPhone}</span>
                </div>
                <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2 flex flex-col">
                  <span className="font-bold text-[10px] uppercase text-[var(--color-text-muted)]">Email</span>
                  <span className="font-semibold text-[var(--color-text)] truncate">{emailAccount || 'None'}</span>
                </div>
                <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2 flex flex-col">
                  <span className="font-bold text-[10px] uppercase text-[var(--color-text-muted)]">Age & Gender</span>
                  <span className="font-semibold text-[var(--color-text)] truncate">
                    {displayAge !== undefined && displayAge !== null ? `${displayAge} yrs` : 'Not set'} • {displayGender || 'Not set'}
                  </span>
                </div>
                <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2 flex flex-col">
                  <span className="font-bold text-[10px] uppercase text-[var(--color-text-muted)]">ABHA ID</span>
                  <span className="font-semibold text-[var(--color-text)] truncate">{displayAbha}</span>
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
              <span>{t('history.visits_tab')} ({slips.length})</span>
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
            {/* Recent Slips strictly matching this patient account */}
            {slips.length > 0 && (
              <section aria-label={t('history.current_session_slips')}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="section-label">
                    {isGuest ? t('history.current_session_slips') : t('history.active_slips', { defaultValue: 'Recent Visit Slips' })}
                  </h3>
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                    {slips.length} {slips.length === 1 ? 'slip' : 'slips'} found
                  </span>
                </div>
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
                            <span className="font-mono font-black">{slip.token}</span>
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
                {pastVisits.length === 0 && slips.length === 0 && !loading ? (
                  <Card className="text-center py-10 text-[var(--color-text-muted)] flex flex-col items-center">
                    <Ticket size={36} className="mb-2 opacity-40 text-[var(--color-primary-500)]" />
                    <p className="font-bold text-base text-[var(--color-text)]">
                      No previous visits found for {emailAccount || 'this account'}.
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-md">
                      Any hospital slips generated with this email address will appear here automatically and update in real time.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="primary" size="sm" onClick={() => navigate('/patient/visit')}>
                        Generate OPD Visit Slip
                      </Button>
                    </div>
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
              <Card className="text-center py-10 text-[var(--color-text-muted)] flex flex-col items-center">
                <Ticket size={36} className="mb-2 opacity-40 text-[var(--color-primary-500)]" />
                <p className="font-semibold text-base text-[var(--color-text)]">{t('history.no_records')}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Start a visit at the hospital entrance to receive your queue slip.
                </p>
                <div className="mt-4 flex items-center gap-2">
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
                <p>No medical reports available yet for this account.</p>
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
