import { useId, type ReactNode } from 'react';
import { cx } from './cx';

interface PanelProps {
  title?: ReactNode;
  /** End of the title row: a timestamp or unit, set in mono. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Raised surface, hairline border, 20 px radius and padding (design.md · Panel). */
export function Panel({ title, meta, actions, className, children }: PanelProps) {
  const titleId = useId();
  const hasHeader = Boolean(title || meta || actions);
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cx('rounded-lg border border-border bg-surface p-5 shadow-raised', className)}
    >
      {hasHeader ? (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 id={titleId} className="text-md font-semibold">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {meta ? <span className="num text-xs text-text-muted">{meta}</span> : null}
            {actions}
          </div>
        </header>
      ) : null}
      {children}
    </section>
  );
}
