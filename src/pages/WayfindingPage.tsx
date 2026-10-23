import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Navigation, ChevronDown } from 'lucide-react';
import { BaseLayout } from '../components/layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { NavStepCard } from '../components/NavStepCard';
import { PageHeader } from '../components/ui';
import { getKnownLocations, getAllDepartments, getWayfinding } from '../services/hospitalService';
import type { KnownLocation, Department, WayfindingResult } from '../types';

export function WayfindingPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const preselectedDeptId = (location.state as { departmentId?: string })?.departmentId;

  const [knownLocations, setKnownLocations] = useState<KnownLocation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [fromId, setFromId] = useState('main-entrance');
  const [toId, setToId] = useState(preselectedDeptId ?? '');
  const [result, setResult] = useState<WayfindingResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [locs, depts] = await Promise.all([getKnownLocations(), getAllDepartments()]);
      setKnownLocations(locs);
      setDepartments(depts);
      if (!toId && depts.length > 0) setToId(depts[0].id);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [toId]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFindRoute = async () => {
    if (!fromId || !toId) return;
    try {
      setSearching(true);
      setSearchError(false);
      setResult(null);
      const r = await getWayfinding(fromId, toId);
      setResult(r);
    } catch {
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container gap-5 min-w-0">
        {/* Heading */}
        <PageHeader
          title={t('wayfinding.page_title')}
          subtitle={t('wayfinding.page_subtitle')}
        />

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage onRetry={loadData} />
        ) : (
          <div className="flex flex-col gap-4 min-w-0">
            {/* FROM select */}
            <div className="min-w-0">
              <label
                htmlFor="from-select"
                className="block font-semibold mb-1.5 text-sm sm:text-base text-[var(--color-text)]"
              >
                {t('wayfinding.from_label')}
              </label>
              <div className="relative min-w-0">
                <select
                  id="from-select"
                  value={fromId}
                  onChange={(e) => {
                    setFromId(e.target.value);
                    setResult(null);
                  }}
                  className="input appearance-none pr-10 w-full min-w-0 text-ellipsis overflow-hidden"
                  aria-label={t('wayfinding.from_label')}
                >
                  {knownLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {t(loc.labelKey)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* TO select */}
            <div className="min-w-0">
              <label
                htmlFor="to-select"
                className="block font-semibold mb-1.5 text-sm sm:text-base text-[var(--color-text)]"
              >
                {t('wayfinding.to_label')}
              </label>
              <div className="relative min-w-0">
                <select
                  id="to-select"
                  value={toId}
                  onChange={(e) => {
                    setToId(e.target.value);
                    setResult(null);
                  }}
                  className="input appearance-none pr-10 w-full min-w-0 text-ellipsis overflow-hidden"
                  aria-label={t('wayfinding.to_label')}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {t(dept.nameKey)} – {t('common.building')} {dept.building}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Find route button */}
            <button
              onClick={handleFindRoute}
              disabled={!fromId || !toId || searching}
              className="btn btn-primary btn-full btn-lg min-w-0 mt-1"
              aria-busy={searching}
            >
              <Navigation size={20} aria-hidden="true" className="shrink-0" />
              <span>{searching ? t('common.loading') : t('wayfinding.find_route')}</span>
            </button>

            {/* Search error */}
            {searchError && <ErrorMessage onRetry={handleFindRoute} />}

            {/* Route result */}
            {result && !searching && (
              <section
                aria-label={t('wayfinding.result_title')}
                aria-live="polite"
                className="flex flex-col gap-4 min-w-0 mt-2"
              >
                <div className="card border-[var(--color-primary-500)] border-2 p-4 sm:p-5 min-w-0 shadow-md">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-1 break-words">
                    {t('wayfinding.result_title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-4 font-medium">
                    {t('wayfinding.walk_time', {
                      minutes: result.totalEstimatedMinutes,
                    })}
                  </p>

                  <ol role="list" className="flex flex-col gap-4 min-w-0">
                    {result.steps.map((step) => (
                      <NavStepCard key={step.stepNumber} step={step} />
                    ))}
                  </ol>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
