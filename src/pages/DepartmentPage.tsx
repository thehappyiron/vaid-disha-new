import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, MapPin, Clock, ChevronRight } from 'lucide-react';
import { BaseLayout } from '../components/layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { PageHeader } from '../components/ui';
import { getDepartmentsByPurpose, generateSlip } from '../services/hospitalService';
import type { Department } from '../types';

export function DepartmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const purposeId = (location.state as { purposeId?: string })?.purposeId;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [generatingSlip, setGeneratingSlip] = useState<string | null>(null);

  const loadDepartments = useCallback(async () => {
    if (!purposeId) {
      navigate('/purpose', { replace: true });
      return;
    }
    try {
      setLoading(true);
      setError(false);
      const data = await getDepartmentsByPurpose(purposeId);
      setDepartments(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [purposeId, navigate]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleSelectDepartment = async (dept: Department) => {
    if (!purposeId) return;
    try {
      setGeneratingSlip(dept.id);
      const slip = await generateSlip(purposeId, dept.id);
      navigate('/slip', { state: { slip } });
    } catch {
      setError(true);
    } finally {
      setGeneratingSlip(null);
    }
  };

  const floorLabel = (floor: number) => {
    if (floor === 0) return t('common.ground_floor');
    if (floor < 0) return `${t('common.floor')} B${Math.abs(floor)}`;
    return `${t('common.floor')} ${floor}`;
  };

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container">
        <PageHeader
          title={t('common.select')}
          subtitle="Choose the department for your visit"
          showBack={true}
          onBack={() => navigate('/purpose')}
        />

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage onRetry={loadDepartments} />
        ) : (
          <ul role="list" className="flex flex-col gap-3 min-w-0">
            {departments.map((dept) => {
              const isGenerating = generatingSlip === dept.id;
              return (
                <li key={dept.id} role="listitem" className="min-w-0">
                  <button
                    onClick={() => handleSelectDepartment(dept)}
                    disabled={!!generatingSlip}
                    className="w-full card card-interactive text-left p-4 sm:p-5 border-2 border-[var(--color-border)] hover:border-[var(--color-primary-500)] disabled:opacity-60 disabled:cursor-wait min-w-0"
                    aria-label={t(dept.nameKey)}
                    aria-busy={isGenerating}
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Building icon */}
                        <div
                          className="w-11 h-11 rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-500)] flex items-center justify-center shrink-0 mt-0.5"
                          aria-hidden="true"
                        >
                          <Building2 size={22} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base sm:text-lg text-[var(--color-text)] leading-tight break-words">
                            {isGenerating ? t('common.loading') : t(dept.nameKey)}
                          </p>
                          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1 break-words">
                            {t(dept.descriptionKey)}
                          </p>

                          {/* Meta badges */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] min-w-0" aria-hidden="true">
                            <span className="flex items-center gap-1 shrink-0 font-medium">
                              <Building2 size={13} className="shrink-0" />
                              {t('common.building')} {dept.building}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 shrink-0 font-medium">
                              <MapPin size={13} className="shrink-0" />
                              {floorLabel(dept.floor)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 shrink-0 font-medium">
                              <Clock size={13} className="shrink-0" />
                              ~{dept.estimatedWalkMinutes} {t('common.minutes_short')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[var(--color-text-muted)] shrink-0 mt-1" aria-hidden="true">
                        <ChevronRight size={20} />
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BaseLayout>
  );
}
