import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Makes the card look and behave as a clickable element */
  interactive?: boolean;
  /** Remove default padding */
  noPadding?: boolean;
  /** Highlight with primary border */
  highlighted?: boolean;
}

export function Card({
  children,
  interactive = false,
  noPadding = false,
  highlighted = false,
  className = '',
  ...rest
}: CardProps) {
  const classes = [
    'card',
    interactive ? 'card-interactive' : '',
    highlighted ? 'border-[var(--color-primary-500)] border-2' : '',
    noPadding ? '!p-0' : '',
    'min-w-0',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

/* ── Card sub-components for consistent internal layout ─── */

export function CardHeader({ children, className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-2.5 mb-3 min-w-0 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-bold text-[var(--color-text)] leading-tight break-words min-w-0 ${className}`}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardBody({ children, className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-[var(--color-text)] min-w-0 break-words ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2.5 min-w-0 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
