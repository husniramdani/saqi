import type { Decision } from '@saqi/shared';
import type { ReactNode } from 'react';
import { cx } from './cx';

export type ChipVariant = 'solid' | 'ok' | 'warn' | 'error' | 'outline';

const VARIANT: Record<ChipVariant, string> = {
  solid: 'border-accent bg-accent text-accent-foreground',
  ok: 'border-transparent bg-success-soft text-success',
  warn: 'border-transparent bg-warning-soft text-warning',
  error: 'border-transparent bg-error-soft text-error',
  outline: 'border-border-strong bg-surface text-text-secondary',
};

/** Irrigate and Deficit carry tonight's orange; Skip is calm green; Pulse is quiet. */
export const DECISION_CHIP: Record<Decision, ChipVariant> = {
  irrigate: 'solid',
  deficit: 'solid',
  skip: 'ok',
  pulse: 'outline',
};

/** 26 px status / decision chip. Always a word, never colour alone. */
export function Chip({
  variant = 'outline',
  className,
  children,
}: {
  variant?: ChipVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap',
        VARIANT[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
