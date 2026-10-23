import type { BlockDecision, Farm, ScheduleItem } from '@saqi/shared';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl, useLocale } from '@/i18n';
import { moistureToken } from '@/ui';
import {
  blockRect,
  clampZoom,
  isStale,
  nextInOrder,
  readingOrder,
  scheduledTonight,
  showUtilityLabels,
  tagFontSize,
  TREE_GRID,
  UTILITY_LINES,
  VIEW,
  zoomRect,
  zoomViewBox,
  type Rect,
} from './geometry';
import { DEFAULT_MAP_LAYERS, type MapLayerKey, type MapLayers } from './layers';
import { useHoverLift, useLayerFade, useMapReveal, usePipeFlow } from './mapMotion';
import { MapTooltip } from './MapTooltip';

interface FarmMapProps {
  farm: Farm;
  decisions: BlockDecision[];
  schedule: ScheduleItem[];
  selectedId?: string | undefined;
  onSelect: (blockId: string) => void;
  /** Play the once-per-session draw-in (Today only). */
  reveal?: boolean;
  /** Which layers show; all of them by default. */
  layers?: MapLayers;
  /** 1 (whole farm) to 2, centred on the farm; see `zoomViewBox`. */
  zoom?: number;
}

/** Share of the visible plan at a plan coordinate, kept on the map. */
const shareOf = (value: number, start: number, size: number) =>
  Math.min(1, Math.max(0, (value - start) / size));

/** Rendered px per SVG unit, kept current with the map's width (1 where unmeasurable). */
function useScale() {
  const ref = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / VIEW.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, scale };
}

/**
 * Farm 07 as a hand-drawn site plan (Nightfield canvas): blocks filled by plant-available water,
 * tree / rib / hatch textures, a stale hatch, pipes from the pump with tonight's routes in
 * orange, ink tags with block codes, and the utility strip. The plan itself never mirrors in RTL.
 * Each layer is its own `<g class="layer-*">` for the motion moments (T16); the switchable ones
 * sit in a `[data-layer]` wrapper that hides them (and hides them from assistive tech).
 */
export function FarmMap({
  farm,
  decisions,
  schedule,
  selectedId,
  onSelect,
  reveal = false,
  layers = DEFAULT_MAP_LAYERS,
  zoom = 1,
}: FarmMapProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const uid = useId().replace(/:/g, '');
  const { ref, scale: fitScale } = useScale();
  const view = zoomRect(zoom);
  // Rendered px per plan unit: the zoom magnifies the plan inside the same box.
  const scale = fitScale * clampZoom(zoom);
  const [active, setActive] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const groups = useRef(new Map<string, SVGGElement>());
  const scope = useRef<HTMLDivElement>(null);

  const blocks = useMemo(
    () => farm.blocks.map((b) => ({ block: b, rect: blockRect(b.geometry.points) })),
    [farm.blocks],
  );
  const byId = new Map(decisions.map((d) => [d.blockId, d]));
  const tonight = scheduledTonight(schedule);
  const font = tagFontSize(scale);
  useMapReveal(scope, reveal);
  usePipeFlow(scope, layers.flow ? [...tonight].join(',') : '');
  useHoverLift(scope, active);
  useLayerFade(scope, layers);

  const layer = (key: MapLayerKey) =>
    layers[key]
      ? { 'data-layer': key }
      : { 'data-layer': key, visibility: 'hidden', 'aria-hidden': true as const };

  const name = (id: string) => farm.blocks.find((b) => b.id === id)?.name[locale] ?? id;
  const label = (id: string) => {
    const d = byId.get(id);
    if (!d) return `${id} ${name(id)}`;
    return [
      `${id} ${name(id)}`,
      d.pawNow === null ? t('map.noReading') : t('map.water', { paw: d.pawNow }),
      t(`decision.${d.decision}`),
      d.volumeM3 > 0 ? t('map.volumeTonight', { m3: d.volumeM3 }) : null,
      isStale(d) ? t('map.staleSensor') : null,
    ]
      .filter(Boolean)
      .join(', ');
  };
  const staleIds = decisions.filter(isStale).map((d) => d.blockId);
  const summary = t('map.summary', {
    farm: farm.name[locale],
    count: farm.blocks.length,
    tonight: [...tonight].join(', ') || t('map.none'),
    stale: staleIds.join(', ') || t('map.none'),
  });

  const onKeyDown = (e: KeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
      return;
    }
    const rtl =
      (e.currentTarget.closest('[dir]')?.getAttribute('dir') ?? document.documentElement.dir) ===
      'rtl';
    const order = readingOrder(
      blocks.map((b) => ({ id: b.block.id, rect: b.rect })),
      rtl,
    );
    const forward = ['ArrowDown', rtl ? 'ArrowLeft' : 'ArrowRight'];
    const back = ['ArrowUp', rtl ? 'ArrowRight' : 'ArrowLeft'];
    const target = forward.includes(e.key)
      ? nextInOrder(order, id, 1)
      : back.includes(e.key)
        ? nextInOrder(order, id, -1)
        : e.key === 'Home'
          ? order[0]
          : e.key === 'End'
            ? order.at(-1)
            : undefined;
    if (!target) return;
    e.preventDefault();
    groups.current.get(target)?.focus();
  };

  const outline = (r: Rect, className: string, stroke: string, width: number) => (
    <rect
      x={r.x}
      y={r.y}
      width={r.width}
      height={r.height}
      rx={10}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      className={className}
      pointerEvents="none"
    />
  );
  const tooltipFor = active ? blocks.find((b) => b.block.id === active) : undefined;
  const tooltipDecision = active ? byId.get(active) : undefined;

  return (
    <div ref={scope} className="relative">
      <svg
        ref={ref}
        viewBox={zoomViewBox(zoom)}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={summary}
        className="block h-auto w-full select-none"
      >
        <defs>
          {blocks
            .filter(({ block }) => TREE_GRID[block.id])
            .map(({ block, rect }) => {
              const [cols, rows] = TREE_GRID[block.id] ?? [1, 1];
              const w = rect.width / cols;
              const h = rect.height / rows;
              return (
                <pattern
                  key={block.id}
                  id={`${uid}-trees-${block.id}`}
                  x={rect.x}
                  y={rect.y}
                  width={w}
                  height={h}
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx={w / 2} cy={h / 2} r={2.6} fill="var(--color-tree)" />
                </pattern>
              );
            })}
          <pattern
            id={`${uid}-ribs`}
            x={620}
            y={0}
            width={20}
            height={10}
            patternUnits="userSpaceOnUse"
          >
            <line x1={10} y1={0} x2={10} y2={10} stroke="var(--color-rib)" strokeWidth={1.5} />
          </pattern>
          <pattern
            id={`${uid}-hatch`}
            width={7}
            height={7}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={7} stroke="var(--color-rib)" strokeWidth={1.2} />
          </pattern>
          <pattern
            id={`${uid}-stale`}
            width={14}
            height={14}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={14}
              stroke="var(--color-stale)"
              strokeWidth={3}
              strokeOpacity={0.9}
            />
          </pattern>
        </defs>

        <rect
          className="layer-ground"
          width={VIEW.width}
          height={VIEW.height}
          fill="var(--color-map)"
        />

        <g className="layer-blocks">
          {blocks.map(({ block, rect }) => {
            const d = byId.get(block.id);
            return (
              <g key={block.id}>
                <rect
                  {...rect}
                  rx={10}
                  fill="var(--color-surface-well)"
                  stroke="var(--color-border-strong)"
                  strokeWidth={1.5}
                />
                <rect
                  {...rect}
                  rx={10}
                  data-flip-id={`block-${block.id}`}
                  data-block-fill={block.id}
                  fill={layers.paw ? moistureToken(d?.pawNow ?? null) : 'var(--color-surface-well)'}
                  stroke="var(--color-block-edge)"
                  strokeWidth={3}
                />
              </g>
            );
          })}
        </g>

        <g {...layer('texture')}>
          <g className="layer-texture" pointerEvents="none">
            {blocks.map(({ block, rect }) => {
              const texture =
                block.crop === 'date_palm'
                  ? `url(#${uid}-trees-${block.id})`
                  : block.mode === 'pulse'
                    ? `url(#${uid}-ribs)`
                    : `url(#${uid}-hatch)`;
              return <rect key={block.id} {...rect} rx={10} fill={texture} />;
            })}
          </g>
        </g>

        <g {...layer('stale')}>
          <g className="layer-stale" pointerEvents="none">
            {blocks
              .filter(({ block }) => {
                const d = byId.get(block.id);
                return d ? isStale(d) : false;
              })
              .map(({ block, rect }) => (
                <rect
                  key={block.id}
                  {...rect}
                  rx={10}
                  fill={`url(#${uid}-stale)`}
                  data-stale={block.id}
                />
              ))}
          </g>
        </g>

        <g {...layer('pipes')}>
          <g
            className="layer-pipes"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          >
            <path d={UTILITY_LINES} stroke="var(--color-pipe)" strokeWidth={5} />
            {blocks.map(({ block }) => (
              <path
                key={block.id}
                d={block.geometry.pipePath}
                stroke="var(--color-pipe)"
                strokeWidth={5}
              />
            ))}
          </g>
        </g>

        <g {...layer('flow')}>
          <g
            className="layer-flow"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          >
            {blocks
              .filter(({ block }) => tonight.has(block.id))
              .map(({ block }) => (
                <g key={block.id} data-scheduled={block.id}>
                  <path d={block.geometry.pipePath} stroke="var(--color-accent)" strokeWidth={7} />
                  {/* Water flow (M2): these dashes travel pump → block; still under reduced motion. */}
                  <path
                    d={block.geometry.pipePath}
                    data-flow={block.id}
                    stroke="var(--color-tag-text)"
                    strokeWidth={2.4}
                    strokeDasharray="4 12"
                  />
                </g>
              ))}
          </g>
        </g>

        <g {...layer('utilities')}>
          <g className="layer-utilities" pointerEvents="none">
            {farm.utilities.map((u) =>
              u.shape === 'circle' ? (
                <circle
                  key={u.id}
                  cx={u.x}
                  cy={u.y}
                  r={u.r}
                  fill="var(--color-utility)"
                  stroke="var(--color-utility-stroke)"
                  strokeWidth={1.5}
                />
              ) : (
                <rect
                  key={u.id}
                  x={u.x}
                  y={u.y}
                  width={u.width}
                  height={u.height}
                  rx={u.kind === 'pump' ? 7 : 5}
                  fill="var(--color-utility)"
                  stroke={u.kind === 'pump' ? 'var(--color-accent)' : 'var(--color-utility-stroke)'}
                  strokeWidth={u.kind === 'pump' ? 2.5 : 1.5}
                />
              ),
            )}
            {showUtilityLabels(scale)
              ? farm.utilities.map((u) => {
                  const cx = u.shape === 'circle' ? u.x : u.x + u.width / 2;
                  return (
                    // One baseline for the whole strip (y 470–600), as on the canvas.
                    <text
                      key={u.id}
                      x={cx}
                      y={594}
                      textAnchor="middle"
                      fontSize={17}
                      // Mono for Latin codes; Arabic-script words need their own font to join.
                      className={isRtl(locale) ? undefined : 'font-mono'}
                      fill={
                        u.kind === 'pump'
                          ? 'var(--color-accent-text)'
                          : 'var(--color-text-secondary)'
                      }
                    >
                      {t(`map.utility.${u.kind}`, {
                        label: u.label,
                        capacity: farm.pumpCapacityM3h,
                      })}
                    </text>
                  );
                })
              : null}
          </g>
        </g>

        <g className="layer-labels">
          {blocks.map(({ block, rect }) => {
            const id = block.id;
            const selected = id === selectedId;
            const tagW = font * 4.4;
            const tagH = font * 2;
            const { x, y } = block.geometry.label;
            return (
              <g
                key={id}
                ref={(el) => {
                  if (el) groups.current.set(id, el);
                  else groups.current.delete(id);
                }}
                role="button"
                tabIndex={0}
                aria-label={label(id)}
                aria-pressed={selected}
                data-block={id}
                className="cursor-pointer outline-none"
                onClick={() => onSelect(id)}
                onKeyDown={(e) => onKeyDown(e, id)}
                onMouseEnter={() => setActive(id)}
                onMouseLeave={() => setActive((a) => (a === id ? null : a))}
                onFocus={() => {
                  setActive(id);
                  setFocused(id);
                }}
                onBlur={() => {
                  setActive((a) => (a === id ? null : a));
                  setFocused((f) => (f === id ? null : f));
                }}
              >
                {/* The whole block is the hit area; the tag only labels it. */}
                <rect {...rect} rx={10} fill="transparent" />
                {selected ? outline(rect, 'layer-selected', 'var(--color-accent)', 6) : null}
                {!selected && active === id
                  ? outline(rect, 'layer-hover', 'var(--color-text-primary)', 3)
                  : null}
                {focused === id
                  ? outline(
                      {
                        x: rect.x - 6,
                        y: rect.y - 6,
                        width: rect.width + 12,
                        height: rect.height + 12,
                      },
                      'layer-focus',
                      'var(--color-focus)',
                      3,
                    )
                  : null}
                <g {...layer('labels')}>
                  <g data-tag>
                    <rect
                      x={x - tagW / 2}
                      y={y - tagH / 2}
                      width={tagW}
                      height={tagH}
                      rx={10}
                      fill={selected ? 'var(--color-accent)' : 'var(--color-tag)'}
                      pointerEvents="none"
                    />
                    <text
                      x={x}
                      y={y}
                      dy="0.35em"
                      textAnchor="middle"
                      fontSize={font}
                      fontWeight={500}
                      className="font-mono"
                      fill={selected ? 'var(--color-accent-foreground)' : 'var(--color-tag-text)'}
                      pointerEvents="none"
                    >
                      {id}
                    </text>
                  </g>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
      {tooltipFor && tooltipDecision ? (
        <MapTooltip
          block={tooltipFor.block}
          decision={tooltipDecision}
          schedule={schedule}
          // The plan is never mirrored, so the anchor is a physical position on it (on the
          // visible part of it when zoomed).
          at={{
            x: shareOf(tooltipFor.block.geometry.label.x, view.x, view.width),
            y: shareOf(tooltipFor.rect.y, view.y, view.height),
          }}
        />
      ) : null}
    </div>
  );
}
