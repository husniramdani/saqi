import { describe, expect, it } from 'vitest';
import { addDays, gstHhmm, gstMs, toGstIso } from './time';

describe('GST time helpers', () => {
  it('reads a GST wall-clock time as UTC+4', () => {
    expect(new Date(gstMs('2026-10-23', '22:00')).toISOString()).toBe('2026-10-23T18:00:00.000Z');
  });

  it('adds calendar days across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('formats with +04:00, rounded to the minute', () => {
    const ms = gstMs('2026-10-24', '01:00') + 48_000; // 01:00:48
    expect(toGstIso(ms)).toBe('2026-10-24T01:01:00+04:00');
    expect(gstHhmm(ms)).toBe('01:01');
  });

  it('crosses midnight in GST', () => {
    expect(toGstIso(gstMs('2026-10-23', '22:00') + 3 * 3_600_000)).toBe(
      '2026-10-24T01:00:00+04:00',
    );
  });
});
