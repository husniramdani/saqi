import { farm07 } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { barShare, nightWindow } from './axis';

describe('schedule axis', () => {
  const window = nightWindow('2026-10-23', farm07);

  it('spans 22:00 → 05:00 GST across midnight', () => {
    expect(new Date(window.start).toISOString()).toBe('2026-10-23T18:00:00.000Z');
    expect(new Date(window.end).toISOString()).toBe('2026-10-24T01:00:00.000Z');
    expect(window.hours).toBe(7);
  });

  it('places the worked example: D-1 22:00 → 01:01, F-1 01:01 → 04:28', () => {
    const d1 = barShare(
      { start: '2026-10-23T18:00:00.000Z', end: '2026-10-23T21:01:00.000Z' },
      window,
    );
    expect(d1.from).toBe(0);
    expect(d1.to).toBeCloseTo(181 / 420, 6); // 3 h 01 of 7 h = 43.1 %
    const f1 = barShare(
      { start: '2026-10-23T21:01:00.000Z', end: '2026-10-24T00:28:00.000Z' },
      window,
    );
    expect(f1.from).toBeCloseTo(0.431, 3);
    expect(f1.to).toBeCloseTo(388 / 420, 6);
  });

  it('clamps runs that spill outside the window', () => {
    expect(
      barShare({ start: '2026-10-23T17:00:00.000Z', end: '2026-10-24T02:00:00.000Z' }, window),
    ).toEqual({ from: 0, to: 1 });
  });
});
