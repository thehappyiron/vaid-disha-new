import type { ReactNode } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Circle,
} from 'lucide-react';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  /** Text label — required: NEVER use color alone */
  label: string;
  /** Optional custom icon — defaults to variant icon */
  icon?: ReactNode;
  /** Semantic pattern hint for colorblind-friendly mode (added as data-pattern) */
  pattern?: string;
  className?: string;
}

/* Default icon for each variant — ensures icon ALWAYS accompanies color */
const DEFAULT_ICONS: Record<BadgeVariant, ReactNode> = {
  success: <CheckCircle  size={14} aria-hidden="true" />,
  danger:  <AlertCircle  size={14} aria-hidden="true" />,
  warning: <AlertTriangle size={14} aria-hidden="true" />,
  info:    <Info          size={14} aria-hidden="true" />,
  neutral: <Circle        size={14} aria-hidden="true" />,
};

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  success: 'status-badge-success',
  danger:  'status-badge-danger',
  warning: 'status-badge-warning',
  info:    'status-badge-info',
  neutral: 'status-badge-neutral',
};

/* Colorblind pattern text for each variant */
const PATTERN_TEXT: Record<BadgeVariant, string> = {
  success: '✓',
  danger:  '✕',
  warning: '!',
  info:    'i',
  neutral: '–',
};

export function StatusBadge({
  variant,
  label,
  icon,
  pattern,
  className = '',
}: StatusBadgeProps) {
  const iconElement = icon ?? DEFAULT_ICONS[variant];

  return (
    <span
      className={`status-badge ${VARIANT_CLASS[variant]} ${className}`}
      data-pattern={pattern ?? PATTERN_TEXT[variant]}
    >
      <span className="inline-flex shrink-0 items-center justify-center" aria-hidden="true">
        {iconElement}
      </span>
      <span className="line-clamp-2">
        {label}
      </span>
    </span>
  );
}
