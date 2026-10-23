import { blockById, farm07 } from '@saqi/shared';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { blockRect, TREE_GRID, UTILITY_LINES } from '@/features/farm-map/geometry';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { moistureStep } from '@/ui';
import { landingDecisions, landingSchedule } from './workedExample';

const byId = new Map(landingDecisions.map((decision) => [decision.blockId, decision]));
const tonightIds = new Set(
  landingSchedule.filter((item) => item.kind === 'night').map((item) => item.blockId),
);
/** Tonight's pipes draw last, on top of the network, as on the reference plan. */
const basePipes = farm07.blocks.filter((block) => !tonightIds.has(block.id));
const tonightPipes = farm07.blocks.filter((block) => tonightIds.has(block.id));
const staleHours = (blockId: string) =>
  byId.get(blockId)?.reasons.find((reason) => reason.code === 'SENSOR_STALE')?.params['hours'];

const fill = (blockId: string) => `w${moistureStep(byId.get(blockId)?.pawNow ?? null) ?? 0}`;

/** Utilities as drawn on the landing plan (the cockpit map keeps its own, interactive geometry). */
function Utilities() {
  return (
    <>
      <circle cx="120" cy="540" r="22" className="util" />
      <rect x="210" y="522" width="50" height="36" rx="4" className="util" />
      <circle cx="300" cy="540" r="30" className="util" />
      <rect x="440" y="520" width="40" height="40" rx="6" className="util pump" />
      <circle cx="900" cy="560" r="12" className="util" />
    </>
  );
}

function TreePatterns({ uid, prefix, r, className }: Record<string, string>) {
  return farm07.blocks
    .filter((block) => TREE_GRID[block.id])
    .map((block, index) => {
      const rect = blockRect(block.geometry.points);
      const [columns, rows] = TREE_GRID[block.id] ?? [1, 1];
      const width = Number((rect.width / columns).toFixed(3));
      const height = Number((rect.height / rows).toFixed(3));
      return (
        <pattern
          key={block.id}
          id={`${uid}${prefix}${index + 1}`}
          x={rect.x}
          y={rect.y}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={(width / 2).toFixed(2)}
            cy={(height / 2).toFixed(2)}
            r={r}
            className={className}
          />
        </pattern>
      );
    });
}

const texture = (uid: string, prefix: string, blockId: string) => {
  const palm = farm07.blocks
    .filter((block) => TREE_GRID[block.id])
    .findIndex((b) => b.id === blockId);
  if (palm >= 0) return `url(#${uid}${prefix}t${palm + 1})`;
  return blockById(farm07, blockId).crop === 'fodder'
    ? `url(#${uid}${prefix}hatch)`
    : `url(#${uid}${prefix}rib)`;
};

/** The tilted, decorative plan behind the hero headline. */
export function HeroMap() {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 1000 620" className="farm-svg">
      <defs>
        <TreePatterns uid={uid} prefix="ht" r="2.8" className="hm-tree" />
        <pattern
          id={`${uid}hrib`}
          x="620"
          y="0"
          width="20"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <line x1="10" y1="0" x2="10" y2="10" className="hm-rib" />
        </pattern>
        <pattern
          id={`${uid}hhatch`}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="8" className="hm-hatch" />
        </pattern>
        <filter id={`${uid}hglow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {farm07.blocks.map((block) => (
        <rect
          key={block.id}
          {...blockRect(block.geometry.points)}
          rx="8"
          className={`hm-blk ${fill(block.id)} hb`}
        />
      ))}
      {farm07.blocks.map((block) => (
        <rect
          key={block.id}
          {...blockRect(block.geometry.points)}
          fill={texture(uid, 'h', block.id)}
          className="hb"
        />
      ))}
      {basePipes.map((block) => (
        <path key={block.id} d={block.geometry.pipePath} className="pipe draw" />
      ))}
      <path d={UTILITY_LINES} className="pipe draw" />
      {tonightPipes.map((block) => (
        <path
          key={block.id}
          d={block.geometry.pipePath}
          className="pipe-glow draw"
          filter={`url(#${uid}hglow)`}
        />
      ))}
      {tonightPipes.map((block) => (
        <path key={block.id} d={block.geometry.pipePath} className="pipe on draw" />
      ))}
      {tonightPipes.map((block) => (
        <path key={block.id} d={block.geometry.pipePath} className="flow" />
      ))}
      <Utilities />
    </svg>
  );
}

/** Product card thumbnail: blocks and tonight's pipes only. */
export function MiniMap() {
  // The thumbnail's main runs to the card edge (y 560), past the pump.
  const pipe = (path: string) => path.replace('M460 540', 'M460 560');
  return (
    <svg viewBox="0 0 1000 620" width="100%">
      {farm07.blocks.map((block) => (
        <rect
          key={block.id}
          {...blockRect(block.geometry.points)}
          rx="14"
          className={`mm-blk ${fill(block.id)}`}
        />
      ))}
      <path d={pipe(blockById(farm07, 'D-2').geometry.pipePath)} className="mm-pipe" />
      {tonightPipes.map((block) => (
        <path key={block.id} d={pipe(block.geometry.pipePath)} className="mm-pipe on" />
      ))}
    </svg>
  );
}

/** Tag plates as placed on the reference plan: [x, y, width]. */
const PLATES: Record<string, readonly [number, number, number]> = {
  'D-1': [90, 109, 160],
  'D-2': [370, 109, 160],
  'D-3': [85, 319, 170],
  'D-4': [370, 319, 160],
  'G-1': [710, 61, 160],
  'G-2': [710, 163, 160],
  'F-1': [710, 319, 160],
};

const UTILITY_LABELS = [
  { x: 120, y: 592, key: 'well' },
  { x: 235, y: 592, key: 'ro' },
  { x: 300, y: 592, key: 'tank' },
  { x: 460, y: 592, key: 'pump' },
  { x: 900, y: 598, key: 'tse' },
] as const;

/** The complete Farm 07 plan in the farm section, with its tags and utility labels. */
export function FarmMap() {
  const { t } = useTranslation();
  const locale = useLocale();
  const uid = useId().replace(/:/g, '');
  const tag = (blockId: string) => {
    const decision = byId.get(blockId);
    const hours = staleHours(blockId);
    if (hours !== undefined) return t('landing.farm.offline', { hours: String(hours) });
    if (!decision || decision.pawNow === null) return '—';
    return `${formatNumber(decision.pawNow, locale, 1)}% · ${t(`decision.${decision.decision}`)}`;
  };
  const summary = farm07.blocks
    .map((block) => {
      const decision = byId.get(block.id);
      const water =
        staleHours(block.id) !== undefined
          ? t('landing.farm.summaryOffline')
          : t('landing.farm.summaryPaw', { paw: formatNumber(decision?.pawNow ?? 0, locale, 1) });
      return `${block.id} ${block.name[locale]} ${water}, ${t(`decision.${decision?.decision ?? 'skip'}`)}.`;
    })
    .join(' ');
  return (
    <svg
      viewBox="0 0 1000 620"
      className="farm-svg farm-map"
      role="img"
      aria-label={t('landing.farm.mapLabel', { blocks: summary })}
    >
      <defs>
        <TreePatterns uid={uid} prefix="ft" r="2.6" className="ft" />
        <pattern
          id={`${uid}frib`}
          x="620"
          y="0"
          width="20"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <line x1="10" y1="0" x2="10" y2="10" className="f-rib" />
        </pattern>
        <pattern
          id={`${uid}fhatch`}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="7" className="f-hatch" />
        </pattern>
        <pattern
          id={`${uid}fstale`}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="14" className="f-stale" />
        </pattern>
        <filter id={`${uid}fglow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {farm07.blocks.map((block) => {
        const rect = blockRect(block.geometry.points);
        return (
          <g key={block.id} className="fb-hit fblk">
            <rect {...rect} rx="10" className={`fb ${fill(block.id)}`} />
            <rect {...rect} rx="10" className="fb-tex" fill={texture(uid, 'f', block.id)} />
            {staleHours(block.id) !== undefined ? (
              <rect {...rect} rx="10" className="fb-tex" fill={`url(#${uid}fstale)`} />
            ) : null}
          </g>
        );
      })}
      {basePipes.map((block) => (
        <path key={block.id} d={block.geometry.pipePath} className="pipe fdraw" />
      ))}
      <path d={UTILITY_LINES} className="pipe fdraw" />
      {tonightPipes.map((block) => (
        <path
          key={block.id}
          d={block.geometry.pipePath}
          className="pipe-glow fdraw"
          filter={`url(#${uid}fglow)`}
        />
      ))}
      {tonightPipes.map((block) => (
        <path key={block.id} d={block.geometry.pipePath} className="pipe on fdraw" />
      ))}
      {tonightPipes.map((block) => (
        <path key={block.id} d={block.geometry.pipePath} className="flow" />
      ))}
      {farm07.blocks.map((block) => {
        const [x, y, width] = PLATES[block.id] ?? [0, 0, 160];
        const decision = byId.get(block.id);
        const em =
          staleHours(block.id) !== undefined ||
          decision?.decision === 'irrigate' ||
          decision?.decision === 'deficit';
        const cx = x + width / 2;
        return (
          <g key={block.id} className="plate-g">
            <rect x={x} y={y} width={width} height="48" rx="10" className="plate" />
            <text x={cx} y={y + 21} className="pl-code">
              {block.id}
            </text>
            <text x={cx} y={y + 39} className={em ? 'pl-val em' : 'pl-val'}>
              {tag(block.id)}
            </text>
          </g>
        );
      })}
      <Utilities />
      {UTILITY_LABELS.map((label) => (
        <text
          key={label.key}
          x={label.x}
          y={label.y}
          className={label.key === 'pump' ? 'u-lbl acc' : 'u-lbl'}
        >
          {t(`landing.farm.utilities.${label.key}`)}
        </text>
      ))}
    </svg>
  );
}
