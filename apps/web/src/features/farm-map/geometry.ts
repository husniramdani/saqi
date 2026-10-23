import type { BlockDecision, ScheduleItem } from '@saqi/shared';

/** The site plan's coordinate system (plan/03 §1 · Map geometry). */
export const VIEW = { width: 1000, height: 620 } as const;

/** Map zoom: 1× shows the whole farm, 2× a quarter of it, in quarter steps. */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.25;

export const clampZoom = (zoom: number) =>
  Number.isFinite(zoom) ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) : ZOOM_MIN;

/** The visible part of the plan at a zoom, centred on the middle of Farm 07. */
export function zoomRect(zoom: number): Rect {
  const z = clampZoom(zoom);
  const width = VIEW.width / z;
  const height = VIEW.height / z;
  return { x: (VIEW.width - width) / 2, y: (VIEW.height - height) / 2, width, height };
}

/** SVG `viewBox` for a zoom (rounded to 0.01 units). */
export function zoomViewBox(zoom: number): string {
  const { x, y, width, height } = zoomRect(zoom);
  return [x, y, width, height].map((n) => Number(n.toFixed(2))).join(' ');
}

/** Tree grids per palm block, cols × rows (plan/03 §1: "D-1: 12×10, D-2: 12×8, …"). */
export const TREE_GRID: Record<string, readonly [number, number]> = {
  'D-1': [12, 10],
  'D-2': [12, 8],
  'D-3': [10, 8],
  'D-4': [8, 8],
};

/** Feed lines between the utilities: well → RO → tank → pump, and the TSE inlet → pump. */
export const UTILITY_LINES = 'M142 540 H210 M260 540 H270 M330 540 H440 M888 560 H480';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding box of an SVG `points` list. Farm 07's blocks are axis-aligned, drawn rounded. */
export function blockRect(points: string): Rect {
  const xy = points
    .trim()
    .split(/\s+/)
    .map((p) => p.split(',').map(Number) as [number, number]);
  const xs = xy.map(([x]) => x);
  const ys = xy.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/**
 * Tag text size in SVG units for the map's rendered scale (px per unit). design.md: map text at
 * least 12 px on screen, so small maps grow their tags; capped so a tag still fits the
 * shortest block (G-2, 85 units tall).
 */
export function tagFontSize(scale: number): number {
  return Math.min(40, Math.max(22, 12.5 / Math.max(scale, 0.01)));
}

/** Utility labels are 17 units; below 12 px on screen they hide rather than shrink. */
export const showUtilityLabels = (scale: number) => 17 * scale >= 12;

/** A block is stale when the engine had to decide without a fresh sensor. */
export const isStale = (d: BlockDecision) =>
  d.pawNow === null || d.reasons.some((r) => r.code === 'SENSOR_STALE');

/** Blocks with a night run tonight: their pipes carry the water route. */
export const scheduledTonight = (schedule: ScheduleItem[]) =>
  new Set(schedule.filter((i) => i.kind === 'night' && i.volumeM3 > 0).map((i) => i.blockId));

/**
 * Next block for an arrow key, in reading order (rows top to bottom; within a row, the reading
 * direction). `order` is block ids already sorted that way. Wraps at both ends.
 */
export function nextInOrder(order: string[], current: string, step: 1 | -1): string {
  const i = order.indexOf(current);
  const next = (i + step + order.length) % order.length;
  return order[next] ?? current;
}

/** Block ids in reading order: by row (top edge), then by x, reversed within a row for RTL. */
export function readingOrder(blocks: { id: string; rect: Rect }[], rtl: boolean): string[] {
  return [...blocks]
    .sort((a, b) => a.rect.y - b.rect.y || (rtl ? b.rect.x - a.rect.x : a.rect.x - b.rect.x))
    .map((b) => b.id);
}
