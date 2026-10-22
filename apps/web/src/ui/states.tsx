import { useId, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Chip } from './Chip';
import { cx } from './cx';

/** A static block sized like the content it stands in for; no shimmer (design.md: no gradients). */
export function Skeleton({
  inline = '100%',
  block = 16,
  className,
}: {
  inline?: CSSProperties['inlineSize'];
  block?: CSSProperties['blockSize'];
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx('block rounded-md bg-surface-well', className)}
      style={{ inlineSize: inline, blockSize: block }}
    />
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md bg-surface-raised p-4">
      <p className="text-md font-semibold">{title}</p>
      {children ? <p className="text-text-secondary">{children}</p> : null}
      {action}
    </div>
  );
}

/** A failed panel says what failed and offers a retry; the rest of the page stays usable. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-md bg-error-soft p-4">
      <p className="text-text-primary">{message}</p>
      {onRetry ? (
        <Button variant="ghost" onClick={onRetry}>
          {t('state.retry')}
        </Button>
      ) : null}
    </div>
  );
}

/** "Stale · 9 h" with the stale hatch, so staleness never relies on colour alone. */
export function StaleTag({ hours }: { hours: number }) {
  const { t } = useTranslation();
  const hatch = useId();
  return (
    <Chip variant="warn">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <defs>
          <pattern
            id={hatch}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--color-rib)" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="12" height="12" rx="3" fill="var(--color-stale)" />
        <rect width="12" height="12" rx="3" fill={`url(#${hatch})`} />
      </svg>
      {t('state.stale', { hours })}
    </Chip>
  );
}
