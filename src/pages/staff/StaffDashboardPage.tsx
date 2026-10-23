import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope,
  LogOut,
  BellRing,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BaseLayout } from '../../components/layout';
import {
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
            <div className="flex-1">
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
                <OptionCard
                  key={patient.token}
                  as="div"
                  selected={isInConsult}
                  icon={
                    <span className="font-mono font-black text-xs sm:text-sm tracking-tight">
                      {patient.token}
                    </span>
                  }
                  iconBgClass={
                    isInConsult
                      ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]'
                  }
                  title={patient.patientName}
                  description={`${patient.department} • Scheduled: ${patient.time}`}
                  badge={
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        variant={isInConsult ? 'info' : 'warning'}
                        label={isInConsult ? 'In Consultation' : 'Waiting'}
                      />
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
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
