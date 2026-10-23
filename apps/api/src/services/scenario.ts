import type { SensorSeries } from '@saqi/shared';
import { z } from 'zod';
import type { Deps } from '../app';
import type { Repo } from '../repo/types';
import type { WeatherService } from './weather';

/**
 * Dev scenarios for walking the unhappy paths (T20), selected per request with `?scenario=`.
 * Opt-in: `createApp` routes to them only with SCENARIOS=1, which config allows in local memory
 * mode only (`pnpm dev` sets it; production never). Each one is a small
 * override on the normal deps, so everything downstream (engine, routes, schemas) runs as usual.
 * `api-down` lives in the web client (it points at a dead URL); the API can't fake its absence.
 */
export const ScenarioSchema = z.enum([
  'weather-stale',
  'no-irrigation-tonight',
  'budget-over',
  'all-sensors-stale-D3',
]);
export type Scenario = z.infer<typeof ScenarioSchema>;

const HOUR_MS = 3_600_000;

/** Weather from a fetch four hours ago that couldn't be refreshed. */
function staleWeather(weather: WeatherService, now: () => Date): WeatherService {
  return {
    async getWeather() {
      const w = await weather.getWeather();
      const at = new Date(Math.floor((now().getTime() - 4 * HOUR_MS) / HOUR_MS) * HOUR_MS);
      return { ...w, stale: true, fetchedAt: at.toISOString() };
    },
  };
}

/** Every soil profile near the top of its range: no block crosses its threshold tonight. */
function wetFarm(repo: Repo): Repo {
  const soak = (s: SensorSeries): SensorSeries => ({
    ...s,
    points: s.points.map((p) => ({ ...p, paw: Math.max(p.paw, 94) })),
  });
  return {
    ...repo,
    getLatestReadings: async () =>
      Object.fromEntries(
        Object.entries(await repo.getLatestReadings()).map(([id, s]) => [id, soak(s)]),
      ),
  };
}

/** An allocation the month is already past, so the guard cuts every tier it may. */
function tightBudget(repo: Repo): Repo {
  return {
    ...repo,
    getAllocation: async (month) => Math.round((await repo.getAllocation(month)) * 0.6),
  };
}

/** D-3's sensors stopped reporting six hours ago (both depths). */
function silentBlock(repo: Repo, blockId: string, now: () => Date): Repo {
  const cut = async (series: SensorSeries[]) => {
    const farm = await repo.getFarm();
    const ids = new Set(farm.sensors.filter((s) => s.blockId === blockId).map((s) => s.id));
    const cutoff = now().getTime() - 6 * HOUR_MS;
    return series.map((s) => {
      if (!ids.has(s.sensorId)) return s;
      const points = s.points.filter((p) => Date.parse(p.t) <= cutoff);
      return { ...s, points, stale: true, lastAt: points.at(-1)?.t ?? s.lastAt };
    });
  };
  return {
    ...repo,
    getReadings: async (id, since) => cut(await repo.getReadings(id, since)),
    getLatestReadings: async () => {
      const latest = await repo.getLatestReadings();
      const series = await cut(Object.values(latest));
      return Object.fromEntries(series.map((s) => [s.sensorId, s]));
    },
  };
}

export function withScenario(deps: Deps, scenario: Scenario): Deps {
  const { repo, weather, now } = deps;
  switch (scenario) {
    case 'weather-stale':
      return { ...deps, weather: staleWeather(weather, now) };
    case 'no-irrigation-tonight':
      return { ...deps, repo: wetFarm(repo) };
    case 'budget-over':
      return { ...deps, repo: tightBudget(repo) };
    case 'all-sensors-stale-D3':
      return { ...deps, repo: silentBlock(repo, 'D-3', now) };
  }
}
