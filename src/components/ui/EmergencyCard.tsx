import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface EmergencyCardProps {
  to?: string;
  onClick?: () => void;
  className?: string;
}

export function EmergencyCard({
  to = '/patient/emergency',
  onClick,
  className = '',
}: EmergencyCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${t('purpose.emergency_card_title')}. ${t('purpose.emergency_card_subtitle')}`}
      className={[
        'w-full text-left rounded-2xl p-4 sm:p-5 transition-all cursor-pointer box-border',
        'border-[3px] border-[var(--color-danger-500)]',
        'bg-[var(--color-danger-50)] shadow-sm hover:shadow-md hover:brightness-98',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-danger-500)]/40',
        'grid grid-cols-[auto_1fr] items-start gap-x-3.5 gap-y-2',
        className,
      ].join(' ')}
    >
      {/* ROW 1 - Col 1: Warning Icon */}
      <div
        className="w-12 h-12 rounded-xl bg-[var(--color-danger-500)] text-white flex items-center justify-center shrink-0 shadow-sm"
        aria-hidden="true"
      >
        <AlertTriangle size={26} strokeWidth={2.5} />
      </div>

      {/* ROW 1 - Col 2: Title and trailing arrow indicator */}
      <div className="flex items-center justify-between gap-2.5 min-w-[12ch] flex-1 self-center">
        <div className="min-w-[12ch] flex-1">
          <span className="font-extrabold text-[var(--color-danger-900)] text-base sm:text-lg leading-snug break-words">
            {t('purpose.emergency_card_title')}
          </span>
        </div>

        <div
          className="w-9 h-9 rounded-full bg-[var(--color-danger-500)] text-white flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <ArrowRight size={18} strokeWidth={2.5} />
        </div>
      </div>

      {/* ROW 2 - Spans full card width: Subtitle at base 18px (>=16px) */}
      <div className="col-span-2 pt-0.5">
        <p className="text-base font-semibold text-[var(--color-danger-800)] leading-relaxed break-words">
          {t('purpose.emergency_card_subtitle')}
        </p>
      </div>
    </div>
  );
}
