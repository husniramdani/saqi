import { afterEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_STATS, fetchTestStats } from './data';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTestStats', () => {
  it('falls back when test-stats.json is missing or malformed', async () => {
    vi.stubGlobal('fetch', async () => new Response('<!doctype html>', { status: 200 }));
    await expect(fetchTestStats()).resolves.toEqual(FALLBACK_STATS);
  });

  it('keeps only the validated counts from a real file', async () => {
    const real = { engine: 60, api: 90, web: 150, e2e: 12, durationSec: 240 };
    vi.stubGlobal('fetch', async () => Response.json({ ...real, commit: 'abc', at: 'now' }));
    await expect(fetchTestStats()).resolves.toEqual(real);
  });
});
