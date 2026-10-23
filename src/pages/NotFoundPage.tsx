import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-dvh items-center justify-center px-5 gap-6 text-center">
      <p className="text-7xl font-black text-[var(--color-border)]" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        {t('not_found.title')}
      </h1>
      <p className="text-[var(--color-text-secondary)]">
        {t('not_found.subtitle')}
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={18} aria-hidden="true" />
        {t('not_found.home_link')}
      </Link>
    </div>
  );
}
