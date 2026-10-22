import type { Block, BlockDecision, ScheduleItem } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { Chip, cx, DECISION_CHIP, Figure, StaleTag } from '@/ui';
import { isStale } from './geometry';
import { windowLabel } from './window';

/**
 * Hover / focus card above a block. Decorative for assistive tech: the block's accessible name
 * already says all of this. Positioned on the (never mirrored) plan; its contents follow the
 * reading direction.
 */
export function MapTooltip({
  block,
  decision,
  schedule,
  at,
}: {
  block: Block;
  decision: BlockDecision;
  schedule: ScheduleItem[];
  /** Anchor as shares of the map: x of the label, y of the block's top edge. */
  at: { x: number; y: number };
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const window = windowLabel(block.id, schedule, locale);
  const staleHours = decision.reasons.find((r) => r.code === 'SENSOR_STALE')?.params['hours'];
  return (
    <div
      aria-hidden="true"
      className={cx(
        'pointer-events-none absolute z-10 w-max max-w-64 -translate-y-full rounded-md border border-border bg-overlay p-3 shadow-floating',
        // Edge blocks open inward, so the card never leaves a narrow map.
        at.x < 1 / 3 ? 'translate-x-0' : at.x > 2 / 3 ? '-translate-x-full' : '-translate-x-1/2',
      )}
      // Physical left: the plan does not mirror in RTL, so neither does the anchor.
      style={{ left: `${at.x * 100}%`, top: `calc(${at.y * 100}% - 8px)` }}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium">
          <span className="num">{block.id}</span> {block.name[locale]}
        </span>
        <Chip variant={DECISION_CHIP[decision.decision]}>{t(`decision.${decision.decision}`)}</Chip>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-4">
        {decision.pawNow === null ? null : <Figure value={decision.pawNow} unit="%" size="sm" />}
        {decision.volumeM3 > 0 ? (
          <Figure value={decision.volumeM3} unit="m³" size="sm" accent />
        ) : null}
      </div>
      {window ? <p className="num mt-1.5 text-xs text-text-secondary">{window}</p> : null}
      {isStale(decision) && typeof staleHours === 'number' ? (
        <div className="mt-2">
          <StaleTag hours={staleHours} />
        </div>
      ) : null}
    </div>
  );
}
