import { DayPlanSchema, SensorSeriesSchema, WeatherSchema } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../app';
import { loadConfig } from '../config';
import { createHourlyMemoryRepo } from '../repo/hourly';
import recordedForecast from '../sim/fixtures/openmeteo-forecast.json' with { type: 'json' };
import { withTimeShift } from './timeshift';
import { createWeatherService } from './weather';

const makeApp = (env: Record<string, string> = {}) => {
  const now = () => new Date();
  const config = loadConfig(env);
  const stored = createHourlyMemoryRepo(now);
  const weather = createWeatherService({
    fetch: async () => Response.json(recordedForecast),
    repo: stored,
    now,
    lat: config.FARM_LAT,
    lon: config.FARM_LON,
    ttlSeconds: config.WEATHER_TTL_SECONDS,
  });
  return createApp({ config, repo: withTimeShift(stored, now), weather, now });
};

async function get<S extends z.ZodType>(app: ReturnType<typeof makeApp>, path: string, schema: S) {
  const res = await app.request(path);
  expect(res.status).toBe(200);
  return schema.parse(await res.json()) as z.output<S>;
}

describe('dev scenarios (memory mode)', () => {
  const app = makeApp();

  it('weather-stale: serves the forecast, marked stale and hours old', async () => {
    const w = await get(app, '/api/weather?scenario=weather-stale', WeatherSchema);
    expect(w.stale).toBe(true);
    expect(Date.now() - Date.parse(w.fetchedAt)).toBeGreaterThan(3 * 3_600_000);
  });

  it('no-irrigation-tonight: no night watering, greenhouse pulses still run', async () => {
    const plan = await get(app, '/api/plan/today?scenario=no-irrigation-tonight', DayPlanSchema);
    expect(plan.schedule.filter((i) => i.kind !== 'pulse')).toEqual([]);
    expect(plan.schedule.some((i) => i.kind === 'pulse')).toBe(true);
    expect(plan.decisions.some((d) => d.decision === 'irrigate' || d.decision === 'deficit')).toBe(
      false,
    );
  });

  it('budget-over: the month is over and blocks are cut', async () => {
    const plan = await get(app, '/api/plan/today?scenario=budget-over', DayPlanSchema);
    expect(plan.budget.status).toBe('over');
    expect(plan.decisions.some((d) => d.decision === 'deficit')).toBe(true);
  });

  it('all-sensors-stale-D3: every D-3 sensor is stale and the decision says so', async () => {
    const series = await get(
      app,
      '/api/blocks/D-3/readings?scenario=all-sensors-stale-D3',
      z.array(SensorSeriesSchema),
    );
    expect(series.length).toBeGreaterThan(0);
    expect(series.every((s) => s.stale)).toBe(true);
    const plan = await get(app, '/api/plan/today?scenario=all-sensors-stale-D3', DayPlanSchema);
    const d3 = plan.decisions.find((d) => d.blockId === 'D-3');
    expect(d3?.pawNow).toBeNull();
    expect(d3?.confidence).toBe('low');
  });

  it('leaves the normal app alone, and ignores unknown names', async () => {
    for (const path of ['/api/weather', '/api/weather?scenario=nope']) {
      expect((await get(app, path, WeatherSchema)).stale).toBe(false);
    }
  });

  it('is never available in pg mode', async () => {
    const pg = makeApp({ DATA_SOURCE: 'pg', DATABASE_URL: 'postgres://unused' });
    expect((await get(pg, '/api/weather?scenario=weather-stale', WeatherSchema)).stale).toBe(false);
  });
});
