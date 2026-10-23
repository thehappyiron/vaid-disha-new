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
import { Card, Button, StatusBadge, PageHeader } from '../../components/ui';

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
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-danger-500)] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <AlertTriangle size={32} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
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
        <div className="grid grid-cols-1 gap-3.5 mt-1">
          <Card className="p-4 border-2 border-[var(--color-danger-300)] flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-danger-100)] text-[var(--color-danger-700)] flex items-center justify-center flex-shrink-0">
              <MapPin size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Immediate Location
              </span>
              <span className="font-extrabold text-base text-[var(--color-text)] break-words">
                {t('patient_emergency.location_label')}
              </span>
            </div>
          </Card>

          <Card className="p-4 border-2 border-[var(--color-primary-300)] flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center flex-shrink-0">
              <Phone size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Direct Emergency Call
              </span>
              <a
                href="tel:108"
                className="font-extrabold text-base text-[var(--color-primary-700)] hover:underline break-words"
              >
                {t('patient_emergency.hotline_label')}
              </a>
            </div>
          </Card>

          <Card className="p-4 border-2 border-[var(--color-border)] flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text)] flex items-center justify-center flex-shrink-0">
              <Clock size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                24×7 Rapid Response
              </span>
              <span className="font-semibold text-sm text-[var(--color-text-muted)] break-words">
                {t('patient_emergency.staff_alert')}
              </span>
            </div>
          </Card>
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
