import React, { type ReactNode, type KeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';

export interface OptionCardProps {
  /** Optional icon element (rendered inside a fixed icon container, 48px standard, 40px on <360px) */
  icon?: ReactNode;
  /** Custom background/text classes for the icon container */
  iconBgClass?: string;
  /** Title text or node */
  title: ReactNode;
  /** Description text or node */
  description?: ReactNode;
  /** Primary badge or tag — ALWAYS rendered on its own row below the text spanning col-span-2 */
  badge?: ReactNode;
  /** Array of secondary badges or metadata tags */
  badges?: ReactNode[];
  /** Optional chevron or accessory (24px wide and shrink-0) */
  chevron?: boolean | ReactNode;
  /** Right accessory slot in the title row (e.g. checkbox, radio, speaker button) */
  rightSlot?: ReactNode;
  /** Footer content spanning full card width */
  footer?: ReactNode;
  /** Custom child content rendered below description / badges (e.g. inputs/forms) */
  children?: ReactNode;
  /** Whether the card is selected/checked */
  selected?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Highlighted visual state (e.g. primary role card) */
  highlighted?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /** Custom keydown handler */
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  /** HTML tag to render: 'button' (default for clickable), 'a', 'div', or 'li' */
  as?: 'button' | 'a' | 'div' | 'li';
  /** ARIA role override (e.g. 'button', 'radio', 'checkbox', 'listitem') */
  role?: string;
  /** Accessible label */
  ariaLabel?: string;
  /** ARIA checked state for checkboxes / radios */
  ariaChecked?: boolean;
  /** ARIA pressed state for toggle buttons */
  ariaPressed?: boolean;
  /** Additional container classes */
  className?: string;
  /** Element ID */
  id?: string;
  /** TabIndex override */
  tabIndex?: number;
  /** Link URL when as='a' */
  href?: string;
}

/**
 * Shared OptionCard component
 * Grid structure: grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 items-start
 * - Col 1: Icon box (48px standard, 40px on <360px screens)
 * - Col 2: Title and Description in the 1fr column (taking 100% of remaining width)
 * - Row 2 (col-span-2): Badges ALWAYS on their own wrapping row below the text
 * - Row 3 (col-span-2): Children / forms at full card width
 * - Row 4 (col-span-2): Footer
 */
export function OptionCard({
  icon,
  iconBgClass,
  title,
  description,
  badge,
  badges,
  chevron,
  rightSlot,
  footer,
  children,
  selected = false,
  disabled = false,
  highlighted = false,
  onClick,
  onKeyDown,
  as: Component = onClick ? 'button' : 'div',
  role,
  ariaLabel,
  ariaChecked,
  ariaPressed,
  className = '',
  id,
  tabIndex,
  href,
}: OptionCardProps) {
  const isClickable = (Boolean(onClick) || Boolean(href)) && !disabled;

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    if (isClickable && Component !== 'button' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent<HTMLElement>);
    }
  };

  const determinedRole = role ?? (isClickable && Component !== 'button' && Component !== 'a' ? 'button' : undefined);
  const determinedTabIndex = tabIndex ?? (disabled ? -1 : isClickable && Component !== 'button' && Component !== 'a' ? 0 : undefined);

  // Border & background styling based on state
  const stateClasses = selected
    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]/40 shadow-sm'
    : highlighted
      ? 'border-[var(--color-primary-500)] bg-gradient-to-br from-[var(--color-primary-50)]/30 to-[var(--color-surface)] shadow-md'
      : 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm';

  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:border-[var(--color-primary-400)] hover:shadow-md active:scale-[0.99]'
    : '';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  const gridColsClass = icon ? 'grid-cols-[auto_minmax(0,1fr)]' : 'grid-cols-1';

  return (
    <Component
      id={id}
      href={Component === 'a' ? href : undefined}
      type={Component === 'button' ? 'button' : undefined}
      role={determinedRole}
      tabIndex={determinedTabIndex}
      aria-disabled={disabled ? true : undefined}
      aria-checked={ariaChecked}
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      disabled={Component === 'button' ? disabled : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={disabled ? undefined : handleKeyDown}
      className={[
        'w-full text-left rounded-xl border-2 p-4 grid gap-x-4 gap-y-2 items-start transition-all box-border',
        gridColsClass,
        stateClasses,
        interactiveClasses,
        disabledClasses,
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Col 1: Icon box (48px standard, shrinks to 40px on screens narrower than 360px) */}
      {icon && (
        <span
          className={[
            'icon-box shrink-0 w-10 min-[360px]:w-12 h-10 min-[360px]:h-12 flex items-center justify-center rounded-lg p-2',
            iconBgClass || (selected
              ? 'bg-[var(--color-primary-500)] text-white'
              : highlighted
                ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                : 'bg-[var(--color-surface-2)] text-[var(--color-primary-600)]'),
          ].join(' ')}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      {/* Col 2: Title and Description in the 1fr column (takes all remaining width) */}
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          {typeof title === 'string' ? (
            <p className="text-lg font-bold leading-snug">{title}</p>
          ) : (
            <div className="text-lg font-bold leading-snug">{title}</div>
          )}

          {/* Optional chevron (24px wide, shrink-0) or right accessory */}
          {(chevron || rightSlot) && (
            <div className="shrink-0 flex items-center gap-1.5 self-center">
              {rightSlot}
              {chevron && (
                typeof chevron === 'boolean' ? (
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center text-[var(--color-text-muted)]" aria-hidden="true">
                    <ChevronRight size={24} />
                  </span>
                ) : (
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center text-[var(--color-text-muted)]" aria-hidden="true">
                    {chevron}
                  </span>
                )
              )}
            </div>
          )}
        </div>

        {description && (
          typeof description === 'string' ? (
            <p className="text-base text-[var(--color-text-muted)] font-medium leading-snug mt-1">{description}</p>
          ) : (
            <div className="text-base text-[var(--color-text-muted)] font-medium leading-snug mt-1">{description}</div>
          )
        )}
      </div>

      {/* Row 2 (col-span-2): Badges ALWAYS on their own wrapping row below the text */}
      {(badge || (badges && badges.length > 0)) && (
        <div className="col-span-2 flex flex-wrap gap-2 pt-0.5 w-full" aria-hidden="true">
          {badge}
          {badges?.map((b, i) => (
            <span key={i} className="shrink-0">{b}</span>
          ))}
        </div>
      )}

      {/* Row 3 (col-span-2): Children / forms at full card width */}
      {children && (
        <div className="col-span-2 w-full pt-1">
          {children}
        </div>
      )}

      {/* Row 4 (col-span-2): Footer */}
      {footer && (
        <div className="col-span-2 w-full pt-2 mt-1 border-t border-[var(--color-border)]">
          {footer}
        </div>
      )}
    </Component>
  );
}
