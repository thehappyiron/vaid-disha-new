import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  Sparkles,
  Accessibility,
  ChevronsUpDown,
  TrendingUp,
  Droplets,
  HeartHandshake,
  PlusSquare,
  Grid,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { BaseLayout } from '../../components/layout';
import { PageHeader, Button, Card } from '../../components/ui';
import { HospitalFloorMap } from '../../components/guidance/HospitalFloorMap';
import {
  FACILITY_PINS,
  FACILITY_FILTER_OPTIONS,
  type FacilityPin,
  type FacilityCategory,
} from '../../data/facilitiesData';
import type { Slip } from '../../types';

function getStoredSlip(): Slip | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vd-latest-slip');
    if (!raw) return null;
    return JSON.parse(raw) as Slip;
  } catch {
    return null;
  }
}

export function PatientFacilitiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialFilter = (searchParams.get('filter') as FacilityCategory) || 'all';

  const [activeCategory, setActiveCategory] = useState<FacilityCategory>(initialFilter);
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [selectedFacility, setSelectedFacility] = useState<FacilityPin | null>(null);

  const slip = getStoredSlip();
  const hasWheelchair =
    slip?.accessibilityNeeds?.includes('wheelchair') ||
    slip?.accessibilityNeeds?.includes('walking_difficulty');

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    return FACILITY_PINS.filter((pin) => {
      const matchCat = activeCategory === 'all' || pin.category === activeCategory;
      return matchCat;
    });
  }, [activeCategory]);

  // Facilities matching both floor and category
  const facilitiesOnCurrentFloor = useMemo(() => {
    return filteredFacilities.filter((pin) => pin.floor === selectedFloor);
  }, [filteredFacilities, selectedFloor]);

  // Keep step-free routing in the URL so the preference survives a reload.
  const navigateToDestination = (destinationNodeId: string) => {
    const startNodeId = localStorage.getItem('vd-last-location') || 'entrance-main';
    const params = new URLSearchParams({ dest: destinationNodeId, start: startNodeId });
    if (hasWheelchair) params.set('mobility', 'step-free');

    navigate(`/patient/guidance?${params.toString()}`, {
      state: { destinationNodeId, startNodeId },
    });
  };

  // Prioritize accessible washrooms for wheelchair and walking difficulties.
  const handleNearestWashroom = () => {
    let targetWashroomId = 'washroom-f0';
    if (hasWheelchair) {
      targetWashroomId = selectedFloor === 1 ? 'washroom-f1-acc' : 'washroom-f0';
    } else {
      if (selectedFloor === 0) targetWashroomId = 'washroom-f0';
      else if (selectedFloor === 1) targetWashroomId = 'washroom-f1';
      else targetWashroomId = 'washroom-f2';
    }

    navigateToDestination(targetWashroomId);
  };

  const handleNavigateToFacility = (pin: FacilityPin) => {
    navigateToDestination(pin.nodeId);
  };

  const getFloorLabel = (floor: number) =>
    floor === 0 ? t('common.ground_floor') : t('facilities.floor_label', { floor });

  const getFilterIcon = (id: FacilityCategory) => {
    switch (id) {
      case 'all':
        return <Grid size={16} />;
      case 'washroom':
        return <Sparkles size={16} />;
      case 'wheelchair':
        return <Accessibility size={16} />;
      case 'lift':
        return <ChevronsUpDown size={16} />;
      case 'ramp':
        return <TrendingUp size={16} />;
      case 'drinking_water':
        return <Droplets size={16} />;
      case 'prayer_room':
        return <HeartHandshake size={16} />;
      case 'pharmacy':
        return <PlusSquare size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  return (
    <BaseLayout headerTitle={t('facilities.title')}>
      <div className="mx-auto w-full px-4 sm:px-6 py-4 md:py-6 max-w-3xl lg:max-w-5xl flex flex-col gap-5 sm:gap-6">
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
          <PageHeader
            title={t('facilities.title', 'Hospital Facilities')}
            subtitle={t(
              'facilities.subtitle',
              'Easily locate washrooms, wheelchair stands, lifts, ramps, drinking water, and prayer rooms.'
            )}
          />

          {/* Primary Quick Action: Take me to the nearest washroom */}
          <div className="shrink-0">
            <Button
              variant="primary"
              size="lg"
              onClick={handleNearestWashroom}
              className="w-full sm:w-auto shadow-md flex items-center justify-center gap-2 text-sm sm:text-base font-black bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]"
              aria-label={t('facilities.take_nearest_washroom')}
            >
              <Sparkles size={18} />
              <span>{t('facilities.take_nearest_washroom', 'Take me to nearest washroom')}</span>
              {hasWheelchair && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold ml-1 inline-flex items-center gap-1">
                  <Accessibility size={13} aria-hidden="true" />
                  <span>{t('facilities.accessible')}</span>
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobility notice if wheelchair user */}
        {hasWheelchair && (
          <div className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800 rounded-xl text-blue-900 dark:text-blue-100 text-sm font-semibold">
            <Accessibility size={22} className="text-blue-600 shrink-0" />
            <span>
              <strong>{t('facilities.accessibility_active')}</strong>{' '}
              {t('facilities.accessibility_notice')}
            </span>
          </div>
        )}

        {/* Filter Chips Row */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
            {t('facilities.filter_by', 'Filter by Facility Type:')}
          </label>
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin focus:outline-none"
            role="tablist"
            aria-label={t('facilities.categories')}
          >
            {FACILITY_FILTER_OPTIONS.map((opt) => {
              const isSelected = activeCategory === opt.id;
              const count = FACILITY_PINS.filter(
                (p) => opt.id === 'all' || p.category === opt.id
              ).length;

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setActiveCategory(opt.id);
                    setSelectedFacility(null);
                  }}
                  className={[
                    'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-normal break-words shrink-0 transition-all border',
                    isSelected
                      ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)] shadow-sm'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]',
                  ].join(' ')}
                >
                  {getFilterIcon(opt.id)}
                  <span>{t(opt.labelKey, opt.id.replace('_', ' '))}</span>
                  <span
                    className={[
                      'px-1.5 py-0.5 rounded-full text-[11px] font-black',
                      isSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2D Floor Map with Interactive Pins */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-[var(--color-text)] flex items-center gap-2">
              <Compass size={20} className="text-[var(--color-primary-500)]" />
              <span>{t('facilities.interactive_map', 'Floor Map & Facility Pins')}</span>
            </h2>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              {t('facilities.floor_pins', {
                floor: getFloorLabel(selectedFloor),
                count: facilitiesOnCurrentFloor.length,
              })}
            </span>
          </div>

          <HospitalFloorMap
            currentFloor={selectedFloor}
            onSelectFloor={(fl) => {
              setSelectedFloor(fl);
              setSelectedFacility(null);
            }}
            pathNodes={[]}
            pathEdges={[]}
            showFacilityPins={true}
            showMapFooter={false}
            selectedFacilityCategory={activeCategory}
            selectedFacilityId={selectedFacility?.id}
            onSelectFacility={(fac) => setSelectedFacility(fac)}
          />
        </div>

        {/* Selected Facility Detail Preview Card */}
        {selectedFacility && (
          <Card
            highlighted
            className="border-2 border-[var(--color-primary-500)] bg-[var(--color-surface)] p-4 sm:p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 border-2 shadow-xs"
                  style={{
                    backgroundColor: selectedFacility.bgColor,
                    borderColor: selectedFacility.strokeColor,
                    color: selectedFacility.strokeColor,
                  }}
                >
                  {selectedFacility.shape === 'cross' ? (
                    <PlusSquare size={22} aria-hidden="true" />
                  ) : selectedFacility.shape === 'diamond' ? (
                    <Droplets size={22} aria-hidden="true" />
                  ) : selectedFacility.isAccessible ? (
                    <Accessibility size={22} aria-hidden="true" />
                  ) : (
                    <MapPin size={22} aria-hidden="true" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-[var(--color-text)]">
                      {t(selectedFacility.nameKey, { defaultValue: selectedFacility.name })}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                      {t(selectedFacility.shapeLabelKey, { defaultValue: selectedFacility.shapeLabel })}
                    </span>
                    {selectedFacility.isAccessible && (
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-green-100 text-green-900 border border-green-300 flex items-center gap-1.5">
                        <ShieldCheck size={13} aria-hidden="true" />
                        <span>{t('facilities.accessible')}</span>
                        <Accessibility size={13} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-1">
                    {t('facilities.floor_landmark', {
                      floor: getFloorLabel(selectedFacility.floor),
                      landmark: selectedFacility.pillarCode || t('facilities.central_block'),
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleNavigateToFacility(selectedFacility)}
                  className="flex items-center gap-2 font-bold w-full sm:w-auto"
                >
                  <span>{t('facilities.take_me_here', 'Guide me here')}</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Facility Cards Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-[var(--color-text)]">
              {t('facilities.all_facilities_list', 'Facility Directory')}
            </h2>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              {t('facilities.showing_facilities', { count: filteredFacilities.length })}
            </span>
          </div>

          {filteredFacilities.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)]">
                <Compass size={24} />
              </div>
              <h3 className="font-bold text-base text-[var(--color-text)]">
                {t('facilities.no_matching', 'No facilities found for this filter')}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                {t('facilities.no_matching_desc', 'Try selecting "All facilities" to view all hospital locations and amenities.')}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveCategory('all')}
                className="mt-2 font-bold"
              >
                <span>{t('facilities.show_all')}</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredFacilities.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;

                return (
                  <div
                    key={fac.id}
                    onClick={() => {
                      setSelectedFacility(fac);
                      setSelectedFloor(fac.floor);
                    }}
                    className={[
                      'p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left bg-[var(--color-surface)]',
                      isSelected
                        ? 'border-[var(--color-primary-500)] shadow-md ring-2 ring-[var(--color-primary-200)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary-400)] hover:shadow-xs',
                    ].join(' ')}
                  >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border"
                        style={{
                          backgroundColor: fac.bgColor,
                          borderColor: fac.strokeColor,
                          color: fac.strokeColor,
                        }}
                      >
                        {fac.shape === 'cross' ? (
                          <PlusSquare size={18} aria-hidden="true" />
                        ) : fac.shape === 'diamond' ? (
                          <Droplets size={18} aria-hidden="true" />
                        ) : fac.isAccessible ? (
                          <Accessibility size={18} aria-hidden="true" />
                        ) : (
                          <MapPin size={18} aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[var(--color-text)] leading-snug">
                          {t(fac.nameKey, { defaultValue: fac.name })}
                        </h4>
                        <span className="text-[11px] font-bold text-[var(--color-text-muted)]">
                          {t(fac.shapeLabelKey, { defaultValue: fac.shapeLabel })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--color-border)]">
                    <span className="font-bold text-[var(--color-text-muted)]">
                      {getFloorLabel(fac.floor)} {fac.pillarCode ? `• ${fac.pillarCode}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToFacility(fac);
                      }}
                      className="text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] font-black flex items-center gap-1"
                    >
                      <span>{t('facilities.take_me')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </BaseLayout>
  );
}
