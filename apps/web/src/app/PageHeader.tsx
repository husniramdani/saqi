import type { ReactNode } from 'react';

/** Page title row: a light headline on the start side, lead figures or controls on the end side. */
export function PageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pt-6 pb-8">
      <h1 className="text-3xl font-light tracking-[-0.035em] sm:text-4xl">{title}</h1>
      {children ? <div className="flex flex-wrap items-end gap-8">{children}</div> : null}
    </div>
  );
}
