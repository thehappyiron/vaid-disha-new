import React, { type ReactNode, type KeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';

export interface OptionCardProps {
  /** Optional icon element (rendered inside a fixed 48px square container) */
  icon?: ReactNode;
  /** Custom background/text classes for the icon container */
  iconBgClass?: string;
  /** Title text or node — gets min-w-[12ch] and wraps whole words */
  title: ReactNode;
  /** Description text or node — spans full card width (col-span-2) at base 18px */
  description?: ReactNode;
  /** Primary badge or tag — spans full card width below text */
  badge?: ReactNode;
  /** Array of secondary badges or metadata tags */
  badges?: ReactNode[];
  /** Whether to show a trailing chevron (or pass a custom chevron element) */
  chevron?: boolean | ReactNode;
  /** Right accessory slot in the title row (e.g. checkbox, radio, speaker button) */
  rightSlot?: ReactNode;
  /** Footer content spanning full card width (e.g. action link with arrow) */
  footer?: ReactNode;
  /** Custom child content rendered below description / badges */
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
  /** HTML tag to render: 'button' (default for clickable), 'div', or 'li' */
  as?: 'button' | 'div' | 'li';
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
}

/**
 * Reusable, accessible OptionCard component that adheres strictly to the layout rules:
 * 1. Mobile layout is VERTICAL by default.
 *    - Row 1: Fixed icon (48px max, shrink-0) + Title (min-w-[12ch], flex-1, wraps whole words) + optional rightSlot/chevron.
 *    - Row 2: Description spans full card width (col-span-2) at base 18px size (never < 16px).
 *    - Row 3: Badges / tags row spans full card width (col-span-2) in a flex-wrap row below text.
 *    - Row 4: Optional footer or custom children spanning full width (col-span-2).
 * 2. Uses CSS Grid: grid-template-columns: auto 1fr.
 * 3. Text columns have min-w-[12ch] so letters never squeeze.
 * 4. Words wrap naturally with overflow-wrap: break-word without breaking ordinary words mid-word.
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
}: OptionCardProps) {
  const isClickable = Boolean(onClick) && !disabled;

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    // For div / li elements that act as buttons, trigger onClick on Enter or Space
    if (isClickable && Component !== 'button' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent<HTMLElement>);
    }
  };

  const determinedRole = role ?? (isClickable && Component !== 'button' ? 'button' : undefined);
  const determinedTabIndex = tabIndex ?? (disabled ? -1 : isClickable && Component !== 'button' ? 0 : undefined);

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

  return (
    <Component
      id={id}
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
        'option-card w-full text-left transition-all box-border',
        'p-4 sm:p-5 rounded-2xl border-2',
        'grid grid-cols-[auto_1fr] items-start gap-x-3.5 gap-y-2.5',
        stateClasses,
        interactiveClasses,
        disabledClasses,
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* ROW 1 - Col 1: Icon container (Fixed 48px max, shrink-0) */}
      {icon && (
        <div
          className={[
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 p-2.5',
            iconBgClass || (selected
              ? 'bg-[var(--color-primary-500)] text-white'
              : highlighted
                ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                : 'bg-[var(--color-surface-2)] text-[var(--color-primary-600)]'),
          ].join(' ')}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {/* ROW 1 - Col 2: Title block + optional right accessories */}
      <div
        className={[
          'flex items-center justify-between gap-2.5 min-w-[12ch] flex-1 self-center',
          !icon ? 'col-span-2' : '',
        ].join(' ')}
      >
        <div className="min-w-[12ch] flex-1">
          <div className="font-bold text-lg sm:text-xl text-[var(--color-text)] leading-snug break-words">
            {title}
          </div>
        </div>

        {/* Right accessories: custom slot or chevron */}
        {(rightSlot || chevron) && (
          <div className="shrink-0 flex items-center gap-1.5 self-center">
            {rightSlot}
            {chevron && (
              typeof chevron === 'boolean' ? (
                <ChevronRight size={22} className="text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
              ) : (
                chevron
              )
            )}
          </div>
        )}
      </div>

      {/* ROW 2 - Spans full width: Description at base 18px size */}
      {description && (
        <div className="col-span-2 pt-0.5 w-full">
          <div className="text-base text-[var(--color-text-muted)] font-medium leading-relaxed break-words">
            {description}
          </div>
        </div>
      )}

      {/* ROW 3 - Spans full width: Badges in a flex-wrap row below the text */}
      {(badge || (badges && badges.length > 0)) && (
        <div className="col-span-2 flex flex-wrap items-center gap-2 pt-1 w-full" aria-hidden="true">
          {badge}
          {badges?.map((b, i) => (
            <span key={i} className="shrink-0">{b}</span>
          ))}
        </div>
      )}

      {/* Custom Children spanning full card width */}
      {children && (
        <div className="col-span-2 pt-1 w-full">
          {children}
        </div>
      )}

      {/* Footer row spanning full card width */}
      {footer && (
        <div className="col-span-2 pt-3 mt-1 border-t border-[var(--color-border)] w-full">
          {footer}
        </div>
      )}
    </Component>
  );
}
