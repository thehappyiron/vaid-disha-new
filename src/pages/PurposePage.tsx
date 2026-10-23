import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight } from 'lucide-react';
import { BaseLayout } from '../components/layout';
import { DynamicIcon } from '../components/DynamicIcon';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmergencyCard, PageHeader } from '../components/ui';
import { getPurposeOptions, searchPurposes } from '../services/hospitalService';
import type { PurposeOption } from '../types';

export function PurposePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [purposes, setPurposes] = useState<PurposeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPurposes = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getPurposeOptions();
      setPurposes(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurposes();
  }, [loadPurposes]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      loadPurposes();
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPurposes(query);
        setPurposes(results);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, loadPurposes]);

  const handleSelect = (purpose: PurposeOption) => {
    navigate('/department', { state: { purposeId: purpose.id } });
  };

  const clearSearch = () => {
    setQuery('');
    searchRef.current?.focus();
  };

  // Filter out emergency option from standard list
  const standardPurposes = purposes.filter((p) => p.id !== 'emergency');

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container">
        {/* Page Header */}
        <PageHeader
          title={t('purpose.page_title')}
          subtitle={t('purpose.page_subtitle')}
          showBack={true}
          onBack={() => navigate('/patient/start')}
        />

        {/* 1. EMERGENCY OPTION PINNED AT VERY TOP */}
        <div className="w-full min-w-0" role="region" aria-label="Urgent medical assistance">
          <EmergencyCard to="/patient/emergency" />
        </div>

        {/* Visual Divider with text */}
        <div className="relative my-1 text-center min-w-0">
          <hr className="divider" aria-hidden="true" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-bg)] px-3 text-xs sm:text-sm font-bold text-[var(--color-text-muted)] tracking-wide max-w-[90%] truncate">
            {t('purpose.or_choose_reason')}
          </span>
        </div>

        {/* Search box */}
        <div className="relative min-w-0">
          <label htmlFor="purpose-search" className="sr-only">
            {t('purpose.search_label')}
          </label>
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            aria-hidden="true"
          >
            <Search size={20} />
          </span>
          <input
            ref={searchRef}
            id="purpose-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search_placeholder')}
            className="input pl-11 pr-11 text-base w-full min-w-0"
            autoComplete="off"
            aria-controls="purpose-list"
            aria-label={t('purpose.search_label')}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] p-1 hover:text-[var(--color-text)]"
              aria-label={t('common.close')}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Content area */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage onRetry={loadPurposes} />
        ) : (
          <div className="min-w-0">
            {searchLoading && (
              <p role="status" aria-live="polite" className="sr-only">
                {t('common.loading')}
              </p>
            )}

            <ul
              id="purpose-list"
              role="list"
              aria-label={t('purpose.page_title')}
              className="flex flex-col gap-3 min-w-0"
            >
              {standardPurposes.length === 0 ? (
                <li className="card text-center py-8 text-[var(--color-text-muted)] min-w-0">
                  {t('purpose.not_found')}
                </li>
              ) : (
                standardPurposes.map((purpose) => (
                  <li key={purpose.id} role="listitem" className="min-w-0">
                    <button
                      onClick={() => handleSelect(purpose)}
                      className="w-full card card-interactive text-left flex items-center justify-between gap-3 p-3.5 sm:p-4 border-2 border-[var(--color-border)] hover:border-[var(--color-primary-500)] min-h-[4rem] min-w-0"
                      aria-label={t(purpose.labelKey)}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Icon */}
                        <span
                          className="w-11 h-11 rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-500)] flex items-center justify-center flex-shrink-0"
                          aria-hidden="true"
                        >
                          <DynamicIcon
                            name={purpose.icon}
                            size={22}
                            strokeWidth={2}
                          />
                        </span>

                        {/* Label */}
                        <span className="font-bold text-[var(--color-text)] text-base sm:text-lg leading-tight break-words min-w-0 flex-1">
                          {t(purpose.labelKey)}
                        </span>
                      </div>

                      {/* Arrow */}
                      <span
                        className="text-[var(--color-text-muted)] flex-shrink-0 ml-1"
                        aria-hidden="true"
                      >
                        <ChevronRight size={20} />
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
