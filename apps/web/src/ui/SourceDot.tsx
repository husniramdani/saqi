import type { ReactNode } from 'react';
import { cx } from './cx';

export type Source = 'live' | 'sim' | 'off';

const DOT: Record<Source, string> = {
  live: 'size-2 bg-success',
  // Dashed ring: simulated data is honest about itself.
  sim: 'size-[9px] border-[1.5px] border-dashed border-accent-text',
  off: 'size-2 bg-stale',
};

/** Where a figure comes from: live, simulated or offline. Always with a word. */
export function SourceDot({ source, children }: { source: Source; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-sm text-text-secondary">
      <span aria-hidden="true" className={cx('inline-block shrink-0 rounded-full', DOT[source])} />
      {children}
    </span>
  );
}
