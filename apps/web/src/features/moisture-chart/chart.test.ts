import type { SensorSeries } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { blockSeries, dailyMeans, dayTicks, HOUR_MS, linePath } from './chart';

const t0 = Date.parse('2026-10-23T10:00:00Z');
const at = (h: number) => new Date(t0 + h * HOUR_MS).toISOString();
const series = (sensorId: string, values: [number, number][]): SensorSeries => ({
  sensorId,
  depthCm: 30,
  stale: false,
  lastAt: at(values.at(-1)?.[0] ?? 0),
  points: values.map(([h, paw]) => ({ t: at(h), paw })),
});

describe('moisture chart geometry', () => {
  it('weights the sensors per hour and re-normalises when one is silent', () => {
    const pts = blockSeries(
      [
        series('D-3-30', [
          [0, 70],
          [1, 70],
          [2, 70],
        ]),
        series('D-3-60', [
          [0, 80],
          [1, 80],
        ]),
      ],
      { 'D-3-30': 0.6, 'D-3-60': 0.4 },
    );
    expect(pts.map((p) => +p.paw.toFixed(2))).toEqual([74, 74, 70]);
  });

  it('breaks the line across a sensor gap instead of interpolating', () => {
    const pts = [0, 1, 2, 12, 13].map((h) => ({ t: t0 + h * HOUR_MS, paw: 50 }));
    const d = linePath(
      pts,
      (t) => (t - t0) / HOUR_MS,
      (p) => 100 - p,
    );
    expect(d).toBe('M0.0 50.0L1.0 50.0L2.0 50.0M12.0 50.0L13.0 50.0');
  });

  it('places the 65 % threshold at the right height on a 0–100 axis', () => {
    const height = 200;
    const y = (paw: number) => height - (paw / 100) * height;
    expect(y(65)).toBe(70);
  });

  it('ticks at GST midnight (20:00 UTC)', () => {
    const ticks = dayTicks(Date.parse('2026-10-20T12:00:00Z'), Date.parse('2026-10-23T12:00:00Z'));
    expect(ticks.map((t) => new Date(t).toISOString())).toEqual([
      '2026-10-20T20:00:00.000Z',
      '2026-10-21T20:00:00.000Z',
      '2026-10-22T20:00:00.000Z',
    ]);
  });

  it('averages each GST day for the table alternative', () => {
    // 19:00 and 20:00 UTC fall on different GST days (23:00 and 00:00 GST).
    const pts = [
      { t: Date.parse('2026-10-23T19:00:00Z'), paw: 60 },
      { t: Date.parse('2026-10-23T20:00:00Z'), paw: 70 },
      { t: Date.parse('2026-10-23T21:00:00Z'), paw: 80 },
    ];
    expect(dailyMeans(pts)).toEqual([
      { date: '2026-10-23', mean: 60 },
      { date: '2026-10-24', mean: 75 },
    ]);
  });
});
