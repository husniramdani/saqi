import { describe, expect, it } from 'vitest';
import { moistureStep, moistureToken } from './moisture';

describe('moistureStep: seven equal steps, step = min(6, floor(PAW / 100 × 7))', () => {
  it.each([
    [0, 0],
    [14.2, 0], // 0–14 % is water-0
    [14.3, 1],
    [49, 3], // F-1 in the scenario
    [68, 4], // D-1
    [85.7, 5],
    [86, 6], // 86–100 % is water-6
    [100, 6],
    [-3, 0], // clamped: sensor noise below 0
    [104, 6],
  ])('PAW %d → water-%d', (paw, step) => {
    expect(moistureStep(paw)).toBe(step);
  });

  it('has no step without a reading', () => {
    expect(moistureStep(null)).toBeNull();
    expect(moistureStep(Number.NaN)).toBeNull();
  });

  it('reads the colour from the theme, and marks missing data as stale', () => {
    expect(moistureToken(68)).toBe('var(--color-water-4)');
    expect(moistureToken(null)).toBe('var(--color-stale)');
  });
});
