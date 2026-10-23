import { farm07 } from '@saqi/shared';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { blockRect, TREE_GRID, UTILITY_LINES } from '@/features/farm-map/geometry';
import { useLocale } from '@/i18n';
import { moistureToken } from '@/ui';
import { landingDecisions, landingSchedule } from './workedExample';

interface Props {
  variant: 'hero' | 'thumbnail' | 'full';
}

const scheduled = new Set(
  landingSchedule.filter((item) => item.kind === 'night').map((item) => item.blockId),
);
const byId = new Map(landingDecisions.map((decision) => [decision.blockId, decision]));

/** One Farm 07 geometry implementation for every landing-page map appearance. */
export function LandingMapArtwork({ variant }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  const uid = useId().replace(/:/g, '');
  const full = variant === 'full';
  const summary = t('landing.farm.mapSummary', {
    farm: farm07.name[locale],
    irrigated: [...scheduled].join(', '),
  });

  return (
    <svg
      viewBox="0 0 1000 620"
      className={`landing-map landing-map--${variant}`}
      {...(full ? { role: 'img', 'aria-label': summary } : { 'aria-hidden': true })}
    >
      <defs>
        {farm07.blocks
          .filter((block) => TREE_GRID[block.id])
          .map((block) => {
            const rect = blockRect(block.geometry.points);
            const [columns, rows] = TREE_GRID[block.id] ?? [1, 1];
            return (
              <pattern
                key={block.id}
                id={`${uid}-landing-trees-${block.id}`}
                x={rect.x}
                y={rect.y}
                width={rect.width / columns}
                height={rect.height / rows}
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx={rect.width / columns / 2}
                  cy={rect.height / rows / 2}
                  r="2.6"
                  fill="var(--color-tree)"
                />
              </pattern>
            );
          })}
        <pattern id={`${uid}-landing-ribs`} width="20" height="10" patternUnits="userSpaceOnUse">
          <line x1="10" y1="0" x2="10" y2="10" stroke="var(--color-rib)" strokeWidth="1.5" />
        </pattern>
        <pattern
          id={`${uid}-landing-fodder`}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--color-rib)" strokeWidth="1.2" />
        </pattern>
        <pattern
          id={`${uid}-landing-stale`}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="14" stroke="var(--color-stale)" strokeWidth="3" />
        </pattern>
      </defs>

      <g className="landing-map__blocks">
        {farm07.blocks.map((block) => {
          const rect = blockRect(block.geometry.points);
          const decision = byId.get(block.id);
          const texture = TREE_GRID[block.id]
            ? `url(#${uid}-landing-trees-${block.id})`
            : block.crop === 'fodder'
              ? `url(#${uid}-landing-fodder)`
              : `url(#${uid}-landing-ribs)`;
          const stale = decision?.reasons.some((reason) => reason.code === 'SENSOR_STALE');
          return (
            <g key={block.id} data-landing-block={block.id}>
              <rect
                {...rect}
                rx="10"
                fill={moistureToken(decision?.pawNow ?? null)}
                stroke="var(--color-block-edge)"
                strokeWidth="3"
              />
              <rect {...rect} rx="10" fill={texture} />
              {stale ? <rect {...rect} rx="10" fill={`url(#${uid}-landing-stale)`} /> : null}
            </g>
          );
        })}
      </g>

      <g className="landing-map__pipes" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {farm07.blocks.map((block) => (
          <path
            key={block.id}
            d={block.geometry.pipePath}
            stroke="var(--color-pipe)"
            strokeWidth="5"
          />
        ))}
        <path d={UTILITY_LINES} stroke="var(--color-pipe)" strokeWidth="5" />
      </g>
      <g className="landing-map__flow" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {farm07.blocks
          .filter((block) => scheduled.has(block.id))
          .map((block) => (
            <g key={block.id}>
              <path d={block.geometry.pipePath} stroke="var(--color-accent)" strokeWidth="7" />
              <path
                d={block.geometry.pipePath}
                stroke="var(--color-accent-foreground)"
                strokeWidth="2"
                strokeDasharray="4 12"
              />
            </g>
          ))}
      </g>

      {full ? (
        <g className="landing-map__labels">
          {farm07.blocks.map((block) => {
            const decision = byId.get(block.id);
            const label = block.geometry.label;
            return (
              <g key={block.id} transform={`translate(${label.x - 80} ${label.y - 24})`}>
                <rect width="160" height="48" rx="10" fill="var(--color-tag)" />
                <text x="80" y="20" textAnchor="middle" className="landing-map__code">
                  {block.id}
                </text>
                <text x="80" y="39" textAnchor="middle" className="landing-map__value">
                  {decision?.pawNow === null ? t('map.stale') : `${decision?.pawNow.toFixed(1)}%`}
                  {' · '}
                  {decision ? t(`decision.${decision.decision}`) : ''}
                </text>
              </g>
            );
          })}
        </g>
      ) : null}

      <g className="landing-map__utilities">
        {farm07.utilities.map((utility) =>
          utility.shape === 'circle' ? (
            <circle
              key={utility.id}
              cx={utility.x}
              cy={utility.y}
              r={utility.r}
              fill="var(--color-utility)"
              stroke={
                utility.kind === 'pump' ? 'var(--color-accent)' : 'var(--color-utility-stroke)'
              }
              strokeWidth={utility.kind === 'pump' ? 2.5 : 1.5}
            />
          ) : (
            <rect
              key={utility.id}
              x={utility.x}
              y={utility.y}
              width={utility.width}
              height={utility.height}
              rx="6"
              fill="var(--color-utility)"
              stroke={
                utility.kind === 'pump' ? 'var(--color-accent)' : 'var(--color-utility-stroke)'
              }
              strokeWidth={utility.kind === 'pump' ? 2.5 : 1.5}
            />
          ),
        )}
      </g>
    </svg>
  );
}
