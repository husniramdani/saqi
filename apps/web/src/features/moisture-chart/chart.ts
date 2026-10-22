import type { SensorPoint, SensorSeries } from '@saqi/shared';

export const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const GST_MS = 4 * HOUR_MS;

export interface Pt {
  t: number;
  paw: number;
}

const toPts = (points: SensorPoint[]): Pt[] =>
  points.map((p) => ({ t: Date.parse(p.t), paw: p.paw }));

/**
 * The block's PAW per hour: weighted mean of the sensors that reported that hour, re-normalised
 * over them (as the engine does for the latest reading). Hours no sensor reported are absent.
 */
export function blockSeries(series: SensorSeries[], weights: Record<string, number>): Pt[] {
  const sums = new Map<number, { w: number; v: number }>();
  for (const s of series) {
    const w = weights[s.sensorId] ?? 1;
    for (const p of toPts(s.points)) {
      const acc = sums.get(p.t) ?? { w: 0, v: 0 };
      sums.set(p.t, { w: acc.w + w, v: acc.v + w * p.paw });
    }
  }
  return [...sums.entries()].sort(([a], [b]) => a - b).map(([t, { w, v }]) => ({ t, paw: v / w }));
}

export const sensorPts = (s: SensorSeries): Pt[] => toPts(s.points);

/**
 * An SVG path through the points, lifting the pen wherever two readings are further apart than
 * `maxGapMs`: a silent sensor shows as a gap, never as an invented straight line.
 */
export function linePath(
  pts: Pt[],
  x: (t: number) => number,
  y: (paw: number) => number,
  maxGapMs = 1.5 * HOUR_MS,
): string {
  let d = '';
  let prev: Pt | undefined;
  for (const p of pts) {
    const jump = !prev || p.t - prev.t > maxGapMs;
    d += `${jump ? 'M' : 'L'}${x(p.t).toFixed(1)} ${y(p.paw).toFixed(1)}`;
    prev = p;
  }
  return d;
}

/** GST midnights strictly inside (from, to]: one tick per day. */
export function dayTicks(from: number, to: number): number[] {
  const firstGstMidnight = Math.ceil((from + GST_MS) / DAY_MS) * DAY_MS - GST_MS;
  const ticks: number[] = [];
  for (let t = firstGstMidnight; t <= to; t += DAY_MS) ticks.push(t);
  return ticks;
}

/** Mean PAW per GST calendar day, newest last: the chart's table alternative. */
export function dailyMeans(pts: Pt[]): { date: string; mean: number }[] {
  const days = new Map<string, { n: number; sum: number }>();
  for (const p of pts) {
    const date = new Date(p.t + GST_MS).toISOString().slice(0, 10);
    const acc = days.get(date) ?? { n: 0, sum: 0 };
    days.set(date, { n: acc.n + 1, sum: acc.sum + p.paw });
  }
  return [...days.entries()].map(([date, { n, sum }]) => ({ date, mean: sum / n }));
}
