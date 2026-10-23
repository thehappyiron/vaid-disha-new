import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, ArrowLeft, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { BaseLayout } from '../../components/layout';
import { Card, Button, StatusBadge, PageHeader } from '../../components/ui';

export function AdminComingSoonPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container">
        <PageHeader
          title={t('admin_coming_soon.page_title')}
          showBack={true}
          onBack={() => navigate('/')}
        />

        <Card className="text-center p-8 flex flex-col items-center gap-4 border-2 border-dashed border-[var(--color-neutral-400)] bg-[var(--color-surface)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-neutral-700)] flex items-center justify-center">
            <Building2 size={36} aria-hidden="true" />
          </div>

          <StatusBadge
            variant="warning"
            label={t('admin_coming_soon.badge')}
            icon={<Clock size={14} aria-hidden="true" />}
          />

          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            {t('admin_coming_soon.heading')}
          </h2>

          <p className="text-[var(--color-text-muted)] text-base max-w-md mx-auto leading-relaxed">
            {t('admin_coming_soon.description')}
          </p>

          <div className="w-full max-w-sm flex flex-col gap-2 pt-2 text-left">
            <div className="p-3 bg-[var(--color-surface-2)] rounded-lg text-xs text-[var(--color-text-muted)] flex items-center gap-2">
              <MapPin size={16} className="text-[var(--color-primary-500)] flex-shrink-0" />
              <span>Multi-building floor plan & pathway graph visualizer</span>
            </div>
            <div className="p-3 bg-[var(--color-surface-2)] rounded-lg text-xs text-[var(--color-text-muted)] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--color-primary-500)] flex-shrink-0" />
              <span>Hospital administrative onboarding & kiosk synchronization</span>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/')}
            className="mt-4"
          >
            {t('admin_coming_soon.back_home')}
          </Button>
        </Card>
      </div>
    </BaseLayout>
  );
}
