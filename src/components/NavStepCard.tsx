import {
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  CornerRightUp,
  MapPin,
  Footprints,
} from 'lucide-react';
import type { NavigationStep } from '../types';
import { useTranslation } from 'react-i18next';

// Lucide doesn't export ElevatorIcon directly - use a fallback
const DIRECTION_ICONS: Record<NavigationStep['directionIcon'], React.ReactNode> = {
  'arrow-up': <ArrowUp size={24} aria-hidden="true" />,
  'arrow-right': <ArrowRight size={24} aria-hidden="true" />,
  'arrow-left': <ArrowLeft size={24} aria-hidden="true" />,
  'corner-right-up': <CornerRightUp size={24} aria-hidden="true" />,
  'map-pin': <MapPin size={24} aria-hidden="true" />,
  'elevator': <ArrowUp size={24} aria-hidden="true" />,
  'stairs': <Footprints size={24} aria-hidden="true" />,
};

interface NavStepCardProps {
  step: NavigationStep;
}

export function NavStepCard({ step }: NavStepCardProps) {
  const { t } = useTranslation();
  const isLast = step.directionIcon === 'map-pin';

  return (
    <li className="flex gap-4 items-start">
      {/* Step circle */}
      <div
        className={`step-circle flex-shrink-0 mt-1 ${
          isLast ? 'step-circle-done' : 'step-circle-active'
        }`}
        aria-label={t('a11y.step_number', { number: step.stepNumber })}
      >
        {step.stepNumber}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start gap-3">
          {/* Direction icon */}
          <span
            className={`flex-shrink-0 mt-0.5 ${
              isLast
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-primary)]'
            }`}
            aria-label={t('a11y.direction_icon')}
          >
            {DIRECTION_ICONS[step.directionIcon]}
          </span>

          <div className="flex-1">
            <p className="font-medium text-[var(--color-text)] leading-snug">
              {t(step.instructionKey, step.instructionParams ?? {})}
            </p>
            {step.landmark && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                📍 {step.landmark}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
