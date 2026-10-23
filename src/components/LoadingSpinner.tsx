import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const text = label ?? t('common.loading');

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={text}
      className="flex flex-col items-center justify-center gap-4 py-12"
    >
      <Loader2
        size={40}
        className="text-[var(--color-primary)] animate-spin"
        aria-hidden="true"
      />
      <p className="text-[var(--color-text-secondary)] font-medium">{text}</p>
    </div>
  );
}
