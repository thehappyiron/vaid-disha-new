import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  /** For icon-only buttons — required for accessibility */
  iconOnly?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  iconOnly = false,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? 'btn-full' : '',
    iconOnly ? 'btn-icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinner = (
    <Loader2
      size={size === 'sm' ? 16 : 20}
      className="animate-spin"
      aria-hidden="true"
    />
  );

  const iconEl = loading ? null : icon ? (
    <span aria-hidden="true">{icon}</span>
  ) : null;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading}
      className={classes}
    >
      {loading && spinner}
      {!loading && iconEl && iconPosition === 'left' && iconEl}
      {!iconOnly && children}
      {!loading && iconEl && iconPosition === 'right' && iconEl}
      {/* Icon-only: render icon without label wrapper */}
      {!loading && iconOnly && icon && <span aria-hidden="true">{icon}</span>}
    </button>
  );
}
