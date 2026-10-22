import { gstDate, WeatherSchema, type Weather } from '@saqi/shared';
import fallback from '../sim/fixtures/weather-fallback.json' with { type: 'json' };

const DAY_MS = 86_400_000;

export interface WeatherService {
  getWeather(): Promise<Weather>;
}

/**
 * Serves the committed fixture, re-dated so daily[0] is today (GST).
 * TODO(T09): Open-Meteo forecast + ET₀ fetch, TTL cache through the repo, stale fallback.
 */
export function createWeatherService(deps: { now: () => Date }): WeatherService {
  const base = WeatherSchema.parse(fallback);
  return {
    getWeather: async () => {
      const now = deps.now();
      const today = Date.parse(gstDate(now));
      return {
        ...base,
        fetchedAt: now.toISOString(),
        stale: false,
        daily: base.daily.map((d, i) => ({
          ...d,
          date: new Date(today + i * DAY_MS).toISOString().slice(0, 10),
        })),
      };
    },
  };
}
