import type { ReactNode } from 'react';

interface BottomActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Sticky bottom bar for primary page actions.
 * Respects the safe-area-inset-bottom on mobile.
 * Renders inside the page flow — place it at the bottom of your page JSX.
 */
export function BottomActionBar({ children, className = '' }: BottomActionBarProps) {
  return (
    <div
      role="group"
      aria-label="Page actions"
      className={`bottom-action-bar ${className}`}
    >
      {children}
    </div>
  );
}
