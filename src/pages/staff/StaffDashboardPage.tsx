import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope,
  LogOut,
  BellRing,
  Clock,
  UserCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BaseLayout } from '../../components/layout';
import {
  Card,
  Button,
  PageHeader,
  StatusBadge,
  OptionCard,
} from '../../components/ui';
import { MOCK_PATIENT_QUEUE } from '../../data/mockUserData';

export function StaffDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <BaseLayout showHome={true} headerTitle="Staff Dashboard">
      <div className="page-container">
        {/* Page Header */}
        <PageHeader
          title={t('staff_dashboard.page_title')}
          subtitle={t('staff_dashboard.page_subtitle')}
          showBack={true}
          onBack={() => navigate('/')}
          actions={
            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
            >
              {t('staff_dashboard.logout')}
            </Button>
          }
        />

        {/* Staff Profile Card */}
        <OptionCard
          icon={<Stethoscope size={24} />}
          iconBgClass="bg-[var(--color-primary-500)] text-white shadow-sm"
          title={user?.name || 'Dr. Ananya Iyer'}
          description={`ID: ${user?.staffId || 'STF-101'} • ${user?.designation || 'Senior Medical Officer'} • ${user?.department || 'General OPD'}`}
          badge={<StatusBadge variant="success" label="On Duty" icon={<UserCheck size={14} />} />}
          className="bg-[var(--color-primary-50)] border-2 border-[var(--color-primary-200)]"
        />

        {/* OPD Queue with vertical mobile layout and no duplicate (Guest) */}
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[var(--color-text)] leading-tight">
                {t('staff_dashboard.queue_title')}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {t('staff_dashboard.queue_desc')}
              </p>
            </div>
            <Button variant="primary" size="sm" icon={<BellRing size={16} />} className="shrink-0">
              {t('staff_dashboard.call_next')}
            </Button>
          </div>

          <div className="flex flex-col gap-3 min-w-0">
            {MOCK_PATIENT_QUEUE.map((patient) => {
              const isInConsult = patient.status === 'in_consultation';

              return (
                <Card
                  key={patient.token}
                  className={[
                    'p-4 transition-all border-2 min-w-0',
                    isInConsult
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]/30'
                      : 'border-[var(--color-border)]',
                  ].join(' ')}
                >
                  {/* Vertical mobile layout: Token + Status on top, Name + Guest tag in middle, Metadata below */}
                  <div className="flex flex-col gap-2.5 min-w-0">
                    {/* Top Row: Token + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] font-mono font-bold text-sm text-[var(--color-text)]">
                          {patient.token}
                        </span>
                        {/* Single Guest/Registered Tag (no duplicate text) */}
                        {patient.isGuest ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Guest
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                            Registered
                          </span>
                        )}
                      </div>

                      <StatusBadge
                        variant={isInConsult ? 'info' : 'warning'}
                        label={isInConsult ? 'In Consultation' : 'Waiting'}
                        className="shrink-0"
                      />
                    </div>

                    {/* Middle: Patient Name (clean, no duplicate '(Guest)' tag) */}
                    <div className="min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-[var(--color-text)] break-words leading-snug">
                        {patient.patientName}
                      </h3>
                    </div>

                    {/* Bottom Metadata row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)] min-w-0">
                      <span className="flex items-center gap-1 min-w-0 truncate">
                        <Building size={13} className="shrink-0" />
                        {patient.department}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock size={13} className="shrink-0" />
                        {patient.time}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
