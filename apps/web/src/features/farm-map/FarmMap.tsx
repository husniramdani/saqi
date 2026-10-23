import type { BlockDecision, Farm, ScheduleItem } from '@saqi/shared';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl, useLocale } from '@/i18n';
import { cx, moistureToken } from '@/ui';
import {
  blockRect,
  clampZoom,
  isStale,
  nextInOrder,
  readingOrder,
  scheduledTonight,
  tagFontSize,
  TREE_GRID,
  UTILITY_LINES,
  VIEW,
  utilityLabelSize,
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
  /**
   * `canvas`: Today's map surface (design/dashboard.html): no ground of its own (the canvas grid
   * shows through) and the utility labels in the canvas's own wording.
   */
  variant?: 'default' | 'canvas';
}

/** Share of the visible plan at a plan coordinate, kept on the map. */
const shareOf = (value: number, start: number, size: number) =>
  Math.min(1, Math.max(0, (value - start) / size));

/** The svg's rendered box in px, kept current (the plan's own size where unmeasurable). */
function useBox() {
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState<{ width: number; height: number }>(VIEW);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, box };
}

/**
 * A water route: the accent pipe with dashes (`[data-flow]`, M2). `running` dashes travel
 * pump → block (`[data-running]`); the others hold still.
 */
const waterPipe = (path: string, id: string, dash: string, running: boolean) => (
  <>
    <path d={path} stroke="var(--color-accent)" strokeWidth={7} />
    <path
      d={path}
      data-flow={id}
      data-running={running ? '' : undefined}
      stroke={dash}
      strokeWidth={2.4}
      strokeDasharray="4 12"
    />
  </>
);

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
  variant = 'default',
}: FarmMapProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const uid = useId().replace(/:/g, '');
  const { ref, box } = useBox();
  const view = zoomRect(zoom);
  // `meet`: the plan fits the box and centres in it (the canvas letterboxes; elsewhere the box
  // has the plan's own aspect, so the offsets are 0).
  const fitScale = Math.min(box.width / VIEW.width, box.height / VIEW.height) || 1;
  const pad = {
    x: (box.width - VIEW.width * fitScale) / 2,
    y: (box.height - VIEW.height * fitScale) / 2,
  };
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
  const canvas = variant === 'canvas';
  // Tags never under 12.5 px on screen, so a phone-sized canvas grows them (22 units on desktop).
  const font = tagFontSize(scale);
  const labelSize = utilityLabelSize(scale);
  const dash = canvas ? 'var(--flow)' : 'var(--color-tag-text)';
  // The water points at the selection: with a block selected, only its route runs, pump →
  // block; tonight's other routes stay orange and still. Its own route is drawn when tonight's
  // routes don't include it. All of it is "Tonight's water", so that layer switch hides it all.
  // Nothing selected: all of tonight's routes run.
  const selectedBlock = selectedId ? blocks.find(({ block }) => block.id === selectedId) : undefined;
  const selectedRoute =
    selectedBlock && !tonight.has(selectedBlock.block.id) ? selectedBlock : undefined;
  const runs = (id: string) => !selectedBlock || selectedBlock.block.id === id;
  const runningKey = !layers.flow
    ? ''
    : selectedRoute
      ? `route:${selectedRoute.block.id}`
      : selectedBlock
        ? `tonight:${selectedBlock.block.id}`
        : [...tonight].join(',');
  useMapReveal(scope, reveal);
  usePipeFlow(scope, runningKey);
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
  const summary = [
    t('map.summary', {
      farm: farm.name[locale],
      count: farm.blocks.length,
      tonight: [...tonight].join(', ') || t('map.none'),
      stale: staleIds.join(', ') || t('map.none'),
    }),
    canvas ? t('mapControls.railAlternative') : null,
  ]
    .filter(Boolean)
    .join(' ');

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
  // Plan units → px inside the map (on the visible part of the plan when zoomed), past any
  // letterbox around it. The plan is never mirrored, so these are physical positions.
  const toX = (x: number) => pad.x + shareOf(x, view.x, view.width) * (box.width - 2 * pad.x);
  const toY = (y: number) => pad.y + shareOf(y, view.y, view.height) * (box.height - 2 * pad.y);

  return (
    <div ref={scope} className={canvas ? 'relative h-full w-full' : 'relative'}>
      <svg
        ref={ref}
        viewBox={zoomViewBox(zoom)}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={summary}
        className={cx('block w-full select-none', canvas ? 'h-full' : 'h-auto')}
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

        {canvas ? null : (
          <rect
            className="layer-ground"
            width={VIEW.width}
            height={VIEW.height}
            fill="var(--color-map)"
          />
        )}

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
                  {waterPipe(block.geometry.pipePath, block.id, dash, runs(block.id))}
                </g>
              ))}
            {selectedRoute ? (
              <g className="layer-route" data-route={selectedRoute.block.id}>
                {waterPipe(selectedRoute.block.geometry.pipePath, selectedRoute.block.id, dash, true)}
              </g>
            ) : null}
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
            {labelSize
              ? farm.utilities.map((u) => {
                  const cx = u.shape === 'circle' ? u.x : u.x + u.width / 2;
                  return (
                    // One baseline for the strip (y 470–600), as on the canvas; the canvas sets
                    // the TSE inlet's label under its own, lower pipe.
                    <text
                      key={u.id}
                      x={cx}
                      y={canvas ? (u.kind === 'tse' ? 598 : 592) : 594}
                      textAnchor="middle"
                      fontSize={labelSize}
                      // Mono for Latin codes; Arabic-script words need their own font to join.
                      className={isRtl(locale) ? undefined : 'font-mono'}
                      fill={
                        u.kind === 'pump'
                          ? 'var(--color-accent-text)'
                          : 'var(--color-text-secondary)'
                      }
                    >
                      {t(canvas ? `mapControls.utility.${u.kind}` : `map.utility.${u.kind}`, {
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
            const tagW = (font * 48) / 11;
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
                      // The canvas sets its codes 8/22 of their size under the tag's middle.
                      dy={canvas ? font * (8 / 22) : '0.35em'}
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
          key={tooltipFor.block.id}
          block={tooltipFor.block}
          decision={tooltipDecision}
          schedule={schedule}
          anchor={{
            left: toX(tooltipFor.rect.x),
            top: toY(tooltipFor.rect.y),
            right: toX(tooltipFor.rect.x + tooltipFor.rect.width),
            bottom: toY(tooltipFor.rect.y + tooltipFor.rect.height),
            labelX: toX(tooltipFor.block.geometry.label.x),
          }}
          bounds={box}
        />
      ) : null}
    </div>
  );
}
