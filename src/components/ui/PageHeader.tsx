import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  /** Page title — rendered as <h1> */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Show a back button */
  showBack?: boolean;
  /** Override the default back navigation */
  onBack?: () => void;
  /** Slot for trailing actions (e.g. a filter button) */
  actions?: ReactNode;
  /** Use a lower visual weight heading */
  level?: 1 | 2;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions,
  level = 1,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const HeadingTag = level === 1 ? 'h1' : 'h2';

  return (
    <div className="flex flex-col gap-1 mb-2">
      <div className="flex items-start gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="btn btn-ghost btn-icon flex-shrink-0 mt-0.5"
            aria-label={t('common.back')}
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <HeadingTag className="text-2xl font-bold text-[var(--color-text)] leading-tight truncate">
            {title}
          </HeadingTag>
          {subtitle && (
            <p className="text-[var(--color-text-muted)] mt-0.5 text-base">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
