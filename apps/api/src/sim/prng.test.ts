import { describe, expect, it } from 'vitest';
import { mulberry32 } from './prng';

const take = (rng: () => number, n: number) => Array.from({ length: n }, rng);

describe('mulberry32', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(take(mulberry32(7), 100)).toEqual(take(mulberry32(7), 100));
  });

  it('stays in [0, 1)', () => {
    expect(take(mulberry32(7), 10_000).every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('diverges for different seeds', () => {
    expect(take(mulberry32(7), 5)).not.toEqual(take(mulberry32(8), 5));
  });
});
