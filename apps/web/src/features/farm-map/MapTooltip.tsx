import type { Block, BlockDecision, ScheduleItem } from '@saqi/shared';
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { duration, ease, gsap, useGSAP, useMotion } from '@/motion';
import { useLocale } from '@/i18n';
import { Chip, DECISION_CHIP, Figure, StaleTag } from '@/ui';
import { isStale, placeTooltip, type BlockBox } from './geometry';
import { windowLabel } from './window';

/**
 * Hover / focus card for a block. Decorative for assistive tech: the block's accessible name
 * already says all of this. Positioned on the (never mirrored) plan; its contents follow the
 * reading direction. Render it keyed by block, so every block gets a fresh card and entrance.
 */
export function MapTooltip({
  block,
  decision,
  schedule,
  anchor,
  bounds,
}: {
  block: Block;
  decision: BlockDecision;
  schedule: ScheduleItem[];
  /** The block as drawn, in px inside the map. */
  anchor: BlockBox;
  /** The map's size in px: the card never leaves it. */
  bounds: { width: number; height: number };
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();

  // Placed from its own measured size (offset sizes ignore the entrance transform), before
  // paint, on every render: the copy, the map's size and the zoom all move it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const at = placeTooltip(anchor, { width: el.offsetWidth, height: el.offsetHeight }, bounds);
    el.style.left = `${at.left}px`;
    el.style.top = `${at.top}px`;
    el.dataset['side'] = at.side;
  });

  // M8 · the card enters with a 4 px rise and a fade (`step`); reduced motion: it is just there.
  // Position is left/top only, so the tween's transform never fights it.
  useGSAP(
    () => {
      if (!reduced)
        gsap.from(ref.current, { opacity: 0, y: 4, duration: duration.step, ease: ease.standard });
    },
    { dependencies: [reduced], revertOnUpdate: true },
  );
  const window = windowLabel(block.id, schedule, locale);
  const staleHours = decision.reasons.find((r) => r.code === 'SENSOR_STALE')?.params['hours'];
  return (
    // Physical left/top: the plan does not mirror in RTL, so neither does the card's position.
    <div
      ref={ref}
      aria-hidden="true"
      data-map-tooltip={block.id}
      className="pointer-events-none absolute top-0 left-0 z-20 w-max max-w-[min(16rem,calc(100%-1rem))] rounded-md border border-border bg-overlay p-3 shadow-floating"
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
