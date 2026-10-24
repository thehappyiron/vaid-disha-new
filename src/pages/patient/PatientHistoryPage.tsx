import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BaseLayout } from '../../components/layout';
import {
  PageHeader,
  Button,
  Card,
  StatusBadge,
  OptionCard,
} from '../../components/ui';
import { getPatientSlipHistory } from '../../services/hospitalService';
import type { Slip, VisitRecord, MedicalReport } from '../../types';

export function PatientHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const [activeTab, setActiveTab] = useState<'slips' | 'reports'>('slips');
  const [slips, setSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getPatientSlipHistory(user?.id);
        setSlips(data);
      } catch (err) {
        console.warn('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Combine user mock visits if registered
  const pastVisits: VisitRecord[] = user?.visits || [];
  const reports: MedicalReport[] = user?.reports || [];

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
          <OptionCard
            as="div"
            icon={<User size={24} aria-hidden="true" />}
            iconBgClass="bg-[var(--color-primary-500)] text-white shadow-sm font-bold text-lg"
            title={user.name}
            description={`Phone: ${user.phone || '9876543210'} • ABHA: ${user.abhaId || '12-3456-7890-1234'}`}
            badge={
              <StatusBadge
                variant="success"
                icon={<CheckCircle2 size={13} />}
                label={t('slip.registered_badge')}
              />
            }
          />
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
