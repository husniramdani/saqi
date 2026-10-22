import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Arrow } from './Arrow';
import { cx } from './cx';

export type ButtonVariant = 'accent' | 'ink' | 'ghost';
export type ButtonSize = 'md' | 'field' | 'icon';

const VARIANT: Record<ButtonVariant, string> = {
  // One accent button per view: the primary action (design.md).
  accent: 'bg-accent text-accent-foreground',
  ink: 'bg-primary text-primary-foreground',
  ghost: 'border border-border-strong bg-transparent text-text-primary',
};
const ARROW: Record<ButtonVariant, string> = {
  accent: 'bg-primary text-primary-foreground',
  ink: 'bg-primary-foreground text-primary',
  ghost: 'bg-surface-well text-text-primary',
};

/** Pill classes, also for links that look like buttons (`<Link className={buttonClasses()}>`). */
export function buttonClasses({
  variant = 'ink',
  size = 'md',
  arrow = false,
}: { variant?: ButtonVariant; size?: ButtonSize; arrow?: boolean } = {}) {
  return cx(
    'relative inline-flex items-center justify-center gap-3 rounded-full font-medium whitespace-nowrap no-underline select-none',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANT[variant],
    size === 'md' && 'min-h-[50px] text-[15px]',
    size === 'md' && (arrow ? 'ps-5 pe-1' : 'px-5'),
    size === 'field' && 'min-h-14 w-full px-6 text-lg',
    size === 'icon' && 'size-11',
  );
}

/** The circular arrow at the end of a pill. */
export function PillArrow({ variant = 'ink' }: { variant?: ButtonVariant }) {
  return (
    <span
      className={cx('grid size-[42px] shrink-0 place-items-center rounded-full', ARROW[variant])}
    >
      <Arrow />
    </span>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ends the pill with the circular arrow (primary navigation actions). */
  arrow?: boolean;
  /** Keeps the button's width, hides the label and blocks clicks. */
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'ink',
  size = 'md',
  arrow = false,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonClasses({ variant, size, arrow }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={cx('inline-flex items-center gap-3', loading && 'invisible')}>
        {children}
        {arrow ? <PillArrow variant={variant} /> : null}
      </span>
      {loading ? (
        // TODO(T15): spin with GSAP (motion goes through GSAP only); static ring until then.
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" data-spinner>
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
            <path
              d="M9 2a7 7 0 0 1 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

/** Ink text with a hairline underline; 44 px tall target. */
export const textLinkClasses =
  'inline-flex min-h-11 items-center border-b border-border-strong text-[15px] font-medium text-text-primary no-underline';
