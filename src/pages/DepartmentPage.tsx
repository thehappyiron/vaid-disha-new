import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, MapPin, Clock } from 'lucide-react';
import { BaseLayout } from '../components/layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { PageHeader, OptionCard } from '../components/ui';
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
      navigate(`/patient/slip/${slip.id}`, { state: { slip } });
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
          <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
            {departments.map((dept) => {
              const isGenerating = generatingSlip === dept.id;
              return (
                <li key={dept.id} role="listitem">
                  <OptionCard
                    onClick={() => handleSelectDepartment(dept)}
                    disabled={!!generatingSlip}
                    ariaLabel={t(dept.nameKey)}
                    icon={<Building2 size={24} />}
                    title={isGenerating ? t('common.loading') : t(dept.nameKey)}
                    description={t(dept.descriptionKey)}
                    chevron={true}
                    badges={[
                      <div key="meta" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)] font-medium pt-1">
                        <span className="flex items-center gap-1 shrink-0">
                          <Building2 size={13} className="shrink-0" />
                          {t('common.building')} {dept.building}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <MapPin size={13} className="shrink-0" />
                          {floorLabel(dept.floor)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock size={13} className="shrink-0" />
                          ~{dept.estimatedWalkMinutes} {t('common.minutes_short')}
                        </span>
                      </div>
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BaseLayout>
  );
}
