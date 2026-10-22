import { describe, expect, it } from 'vitest';
import { floorHour, shiftIso, shiftMs, unshiftIso } from './timeshift';

const anchor = '2026-10-23T17:00:00.000Z'; // 21:00 GST

describe('timeshift', () => {
  it('floors an instant to the start of its hour', () => {
    expect(new Date(floorHour('2026-10-25T10:37:12.345Z')).toISOString()).toBe(
      '2026-10-25T10:00:00.000Z',
    );
  });

  it('is zero inside the anchor hour', () => {
    expect(shiftMs('2026-10-23T17:59:59Z', anchor)).toBe(0);
  });

  it('shifts the anchor onto the current hour', () => {
    const ms = shiftMs('2026-10-25T10:37:00Z', anchor);
    expect(ms).toBe(41 * 3_600_000);
    expect(shiftIso(anchor, ms)).toBe('2026-10-25T10:00:00.000Z');
  });

  it('round-trips through unshift', () => {
    const ms = shiftMs('2026-11-02T08:00:00Z', anchor);
    const stored = '2026-10-20T03:00:00.000Z';
    expect(unshiftIso(shiftIso(stored, ms), ms)).toBe(stored);
  });
});
