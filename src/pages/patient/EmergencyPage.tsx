import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Phone,
  MapPin,
  ShieldAlert,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { BaseLayout } from '../../components/layout';
import { Button, StatusBadge, PageHeader, OptionCard } from '../../components/ui';

export function EmergencyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container">
        <PageHeader
          title={t('patient_emergency.page_title')}
          showBack={true}
          onBack={() => navigate(-1)}
          actions={
            <StatusBadge
              variant="danger"
              label={t('patient_emergency.badge')}
              icon={<ShieldAlert size={14} aria-hidden="true" />}
            />
          }
        />

        {/* Priority Emergency Banner */}
        <div className="w-full rounded-2xl p-5 border-[3px] border-[var(--color-danger-500)] bg-[var(--color-danger-50)] shadow-md">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-danger-500)] text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle size={32} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--color-danger-900)] leading-tight">
                {t('patient_emergency.urgent_banner')}
              </h2>
              <p className="text-base font-bold text-[var(--color-danger-900)] mt-1.5 leading-relaxed break-words">
                {t('patient_emergency.urgent_notice')}
              </p>
            </div>
          </div>
        </div>

        {/* Key Emergency Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-1">
          <OptionCard
            as="div"
            icon={<MapPin size={24} aria-hidden="true" />}
            iconBgClass="bg-[var(--color-danger-100)] text-[var(--color-danger-700)]"
            title="Immediate Location"
            description={t('patient_emergency.location_label')}
            className="border-[var(--color-danger-300)]"
          />

          <OptionCard
            as="a"
            href="tel:108"
            icon={<Phone size={24} aria-hidden="true" />}
            iconBgClass="bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
            title="Direct Emergency Call"
            description={t('patient_emergency.hotline_label')}
            className="border-[var(--color-primary-300)] hover:underline"
          />

          <OptionCard
            as="div"
            icon={<Clock size={24} aria-hidden="true" />}
            iconBgClass="bg-[var(--color-surface-2)] text-[var(--color-text)]"
            title="24×7 Rapid Response"
            description={t('patient_emergency.staff_alert')}
            className="border-[var(--color-border)]"
          />
        </div>

        {/* Back to normal visit button */}
        <div className="pt-3">
          <Button
            variant="ghost"
            fullWidth
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/purpose')}
          >
            {t('patient_emergency.back_btn')}
          </Button>
        </div>
      </div>
    </BaseLayout>
  );
}
