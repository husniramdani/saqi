import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('config: E2E switches', () => {
  it('defaults to the real clock, live weather, no scenarios and port 8787', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({ PORT: 8787, WEATHER_FIXTURE: '0', SCENARIOS: '0' });
    expect(c.NOW).toBeUndefined();
  });

  it('accepts a frozen instant and the weather fixture in memory mode', () => {
    const c = loadConfig({ NOW: '2026-10-23T17:00:00.000Z', WEATHER_FIXTURE: '1', PORT: '8788' });
    expect(c).toMatchObject({ NOW: '2026-10-23T17:00:00.000Z', WEATHER_FIXTURE: '1', PORT: 8788 });
  });

  it('rejects a NOW that is not an instant', () => {
    expect(() => loadConfig({ NOW: 'tonight' })).toThrow();
  });

  it('never lets the test switches reach a database deployment', () => {
    const pg = { DATA_SOURCE: 'pg', DATABASE_URL: 'unused-in-tests' };
    expect(() => loadConfig({ ...pg, WEATHER_FIXTURE: '1' })).toThrow(/memory mode/);
    expect(() => loadConfig({ ...pg, NOW: '2026-10-23T17:00:00Z' })).toThrow(/memory mode/);
    expect(() => loadConfig(pg)).not.toThrow();
  });

  it('never lets them reach a Vercel deployment, even in memory mode', () => {
    const vercel = { VERCEL: '1', DATA_SOURCE: 'memory' };
    expect(() => loadConfig({ ...vercel, WEATHER_FIXTURE: '1' })).toThrow(/memory mode/);
    expect(() => loadConfig({ ...vercel, NOW: '2026-10-23T17:00:00Z' })).toThrow(/memory mode/);
    expect(() => loadConfig({ ...vercel, SCENARIOS: '1' })).toThrow(/memory mode/);
    expect(loadConfig(vercel)).toMatchObject({ WEATHER_FIXTURE: '0', SCENARIOS: '0' });
  });
});
