import { describe, expect, it, vi } from 'vitest';
import { d1Formula, storyDecisions } from '@/features/landing/workedExample';
import { FALLBACK_STATS, fetchTestStats } from '@/features/test-stats/data';
import { colourExcerpt } from './data';

describe('making-of data', () => {
  it('shows 18 real lines of the design.md colour block, water scale included', () => {
    const lines = colourExcerpt();
    expect(lines).toHaveLength(18);
    expect(lines[0]?.text).toBe('colors:');
    expect(lines.filter((l) => l.water).map((l) => l.text.trim().split(':')[0])).toEqual([
      'water-0',
      'water-1',
      'water-2',
      'water-3',
      'water-4',
      'water-5',
      'water-6',
    ]);
    expect(lines.every((l) => !l.hex || /^#[0-9A-F]{6}$/i.test(l.hex))).toBe(true);
  });

  it('builds the D-1 formula from the engine, ending at 90.4 m³ (plan/04 §3)', () => {
    const { target, projected, taw, efficiency, area, wetted, volume } = d1Formula;
    expect(volume).toBe(90.4);
    // The terms on screen multiply out to the engine's answer.
    const shown = ((((target - projected) / 100) * taw) / efficiency) * area * 10 * wetted;
    expect(Math.round(shown * 10) / 10).toBe(volume);
  });

  it('has the engine decide Irrigate D-1, Skip D-2 and Deficit F-1', () => {
    expect(storyDecisions().map((d) => [d.blockId, d.decision, d.volumeM3])).toEqual([
      ['D-1', 'irrigate', 90.4],
      ['D-2', 'skip', 0],
      ['F-1', 'deficit', 155.5],
    ]);
  });

  it('falls back when test-stats.json is missing or malformed', async () => {
    vi.stubGlobal('fetch', async () => new Response('<!doctype html>', { status: 200 }));
    await expect(fetchTestStats()).resolves.toEqual(FALLBACK_STATS);
    const real = { engine: 60, api: 90, web: 150, e2e: 12, durationSec: 240 };
    vi.stubGlobal('fetch', async () => Response.json({ ...real, commit: 'abc', at: 'now' }));
    await expect(fetchTestStats()).resolves.toEqual(real);
    vi.unstubAllGlobals();
  });
});
