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
    <BaseLayout showHome={true} headerTitle="Staff Dashboard" isStaff={true}>
      <div className="page-container staff-container gap-5">
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

        {/* OPD Queue Section */}
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] leading-tight">
                {t('staff_dashboard.queue_title')}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {t('staff_dashboard.queue_desc')}
              </p>
            </div>
            <Button variant="primary" size="md" icon={<BellRing size={18} />} className="shrink-0 font-bold">
              {t('staff_dashboard.call_next')}
            </Button>
          </div>

          {/* ── DESKTOP VIEW (md: and above): Full-width Data Table ──────── */}
          <div className="hidden md:block w-full overflow-hidden rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-2)] border-b-2 border-[var(--color-border)] text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th scope="col" className="px-5 py-3.5">Token</th>
                    <th scope="col" className="px-5 py-3.5">Patient Name</th>
                    <th scope="col" className="px-5 py-3.5">Patient Type</th>
                    <th scope="col" className="px-5 py-3.5">Department</th>
                    <th scope="col" className="px-5 py-3.5">Scheduled Time</th>
                    <th scope="col" className="px-5 py-3.5">Live Status</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-base">
                  {MOCK_PATIENT_QUEUE.map((patient) => {
                    const isInConsult = patient.status === 'in_consultation';

                    return (
                      <tr
                        key={patient.token}
                        className={[
                          'transition-colors hover:bg-[var(--color-surface-2)]/60',
                          isInConsult
                            ? 'bg-[var(--color-primary-50)]/40 font-semibold'
                            : '',
                        ].join(' ')}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]">
                            {patient.token}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-[var(--color-text)] whitespace-nowrap">
                          {patient.patientName}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {patient.isGuest ? (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              Guest
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                              Registered
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-[var(--color-text)] whitespace-nowrap">
                          {patient.department}
                        </td>
                        <td className="px-5 py-4 text-[var(--color-text-muted)] font-mono text-sm whitespace-nowrap">
                          {patient.time}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge
                            variant={isInConsult ? 'info' : 'warning'}
                            label={isInConsult ? 'In Consultation' : 'Waiting'}
                          />
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {isInConsult ? (
                            <Button variant="secondary" size="sm" className="font-bold">
                              Complete
                            </Button>
                          ) : (
                            <Button variant="primary" size="sm" icon={<BellRing size={14} />} className="font-bold">
                              Call In
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── MOBILE VIEW (under md): Stacked Cards ──────────────────── */}
          <div className="flex md:hidden flex-col gap-3 min-w-0">
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
