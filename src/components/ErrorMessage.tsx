import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="card flex flex-col items-center gap-4 text-center py-8"
    >
      <AlertCircle
        size={40}
        className="text-[var(--color-danger)]"
        aria-hidden="true"
      />
      <p className="text-[var(--color-text-primary)] font-medium">
        {message ?? t('common.error')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          aria-label={t('common.retry')}
        >
          <RefreshCw size={18} aria-hidden="true" />
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
