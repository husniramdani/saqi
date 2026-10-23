import { farm07 } from '@saqi/shared';
import { LogoMark } from '@/app/Logo';
import { FarmMap, MapLegend } from '@/features/farm-map';
import { scenarioDecisions, scenarioSchedule } from '@/features/farm-map/scenario';

/**
 * The social card (public/og.png), dev builds only: a 1200 × 630 frame with the Today map on the
 * demo night and the product line in the headline face. Rendered to PNG by `pnpm og`, which
 * screenshots this route in the Linux Playwright image so the fonts match CI's.
 */
export function Component() {
  return (
    <main
      data-og
      className="flex h-[630px] w-[1200px] items-center gap-12 overflow-hidden px-16 py-14"
    >
      <div className="flex w-[380px] shrink-0 flex-col gap-6">
        <LogoMark size={48} />
        <h1 className="text-4xl font-light tracking-[-0.04em]">Saqi · irrigation cockpit</h1>
        <p className="text-xl text-text-secondary">
          Tonight&rsquo;s irrigation for a fictional farm near Al Ain, explained. Live weather,
          simulated sensors.
        </p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-raised">
        <FarmMap
          farm={farm07}
          decisions={scenarioDecisions}
          schedule={scenarioSchedule}
          onSelect={() => undefined}
        />
        <MapLegend />
      </div>
    </main>
  );
}
