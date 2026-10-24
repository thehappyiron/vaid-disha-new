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
  /** Slot for trailing actions (e.g. a filter button or logout) */
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
    <>
      {/* ── MOBILE LAYOUT (< md): Title gets full row on its own line ── */}
      <header className="space-y-3 mb-2 md:hidden w-full">
        {(showBack || actions) && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-ghost btn-icon min-h-[44px] min-w-[44px] shrink-0"
                aria-label={t('common.back')}
              >
                <ArrowLeft size={22} aria-hidden="true" />
              </button>
            ) : (
              <div />
            )}

            {actions && (
              <div className="flex items-center gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>
        )}

        <HeadingTag className="text-2xl font-bold leading-tight w-full text-[var(--color-text)]">
          {title}
        </HeadingTag>

        {subtitle && (
          <p className="w-full text-base text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        )}
      </header>

      {/* ── DESKTOP & TABLET LAYOUT (>= md): Title sits beside buttons with min-w-[16ch] ── */}
      <header className="hidden md:flex md:items-start md:justify-between md:gap-4 mb-2 w-full">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-ghost btn-icon min-h-[44px] min-w-[44px] shrink-0 mt-0.5"
              aria-label={t('common.back')}
            >
              <ArrowLeft size={22} aria-hidden="true" />
            </button>
          )}

          <div className="flex-1 min-w-[16ch]">
            <HeadingTag className="text-2xl font-bold text-[var(--color-text)] leading-tight">
              {title}
            </HeadingTag>
            {subtitle && (
              <p className="text-[var(--color-text-muted)] text-base mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            {actions}
          </div>
        )}
      </header>
    </>
  );
}
