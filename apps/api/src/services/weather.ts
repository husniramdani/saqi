import { WeatherSchema, type Weather } from '@saqi/shared';
import { z } from 'zod';
import type { Repo } from '../repo/types';
import fallback from '../sim/fixtures/weather-fallback.json' with { type: 'json' };

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const DAILY = [
  'et0_fao_evapotranspiration',
  'temperature_2m_max',
  'temperature_2m_min',
  'relative_humidity_2m_mean',
  'wind_speed_10m_max',
] as const;
/** After a failed fetch, serve the stale copy this long before trying Open-Meteo again. */
const RETRY_AFTER_MS = 60_000;

// Open-Meteo leaves a value null when a model has no data for that day.
const series = z.array(z.number().nullable());
export const OpenMeteoResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    is_day: z.union([z.literal(0), z.literal(1)]),
  }),
  daily: z.object({
    time: z.array(z.string()),
    et0_fao_evapotranspiration: series,
    temperature_2m_max: series,
    temperature_2m_min: series,
    relative_humidity_2m_mean: series,
    wind_speed_10m_max: series,
  }),
});
type OpenMeteoResponse = z.infer<typeof OpenMeteoResponseSchema>;

/** Raw Open-Meteo payload → our `Weather` contract. Days with any missing value are dropped. */
export function toWeather(raw: OpenMeteoResponse, fetchedAt: string): Weather {
  const d = raw.daily;
  const daily = d.time.flatMap((date, i) => {
    const [et0Mm, tMaxC, tMinC, humidityMeanPct, windMaxKmh] = DAILY.map((k) => d[k][i]);
    return et0Mm == null ||
      tMaxC == null ||
      tMinC == null ||
      humidityMeanPct == null ||
      windMaxKmh == null
      ? []
      : [{ date, et0Mm, tMaxC, tMinC, humidityMeanPct, windMaxKmh }];
  });
  return WeatherSchema.parse({
    fetchedAt,
    stale: false,
    current: {
      tempC: raw.current.temperature_2m,
      humidityPct: raw.current.relative_humidity_2m,
      windKmh: raw.current.wind_speed_10m,
      isDay: raw.current.is_day === 1,
    },
    daily,
  });
}

export interface WeatherService {
  getWeather(): Promise<Weather>;
}

export interface WeatherDeps {
  fetch: typeof fetch;
  repo: Pick<Repo, 'getWeatherCache' | 'setWeatherCache'>;
  now: () => Date;
  lat: number;
  lon: number;
  ttlSeconds: number;
  timeoutMs?: number;
}

/**
 * Live weather and FAO-56 ET₀ for the farm (plan/02 §3.3). Layers: an in-process TTL cache,
 * then the repo cache (which survives cold starts in pg mode), then Open-Meteo. When Open-Meteo
 * fails it never throws: it serves the last good payload, or the committed fixture, marked stale.
 */
export function createWeatherService(deps: WeatherDeps): WeatherService {
  const { repo, now, lat, lon, timeoutMs = 4000 } = deps;
  const ttlMs = deps.ttlSeconds * 1000;
  const key = `open-meteo:${lat},${lon}`;
  let memory: { payload: Weather; expiresAt: number } | null = null;

  // The repo is a cache here: if it fails (e.g. pg down), carry on without it.
  const readRepo = () => repo.getWeatherCache(key).catch(() => null);
  const writeRepo = (payload: Weather) => repo.setWeatherCache(key, payload).catch(() => undefined);

  async function fetchFresh(): Promise<Weather> {
    const url = new URL(FORECAST_URL);
    url.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,is_day',
      daily: DAILY.join(','),
      timezone: 'Asia/Dubai',
      forecast_days: '7',
      past_days: '0',
    }).toString();
    const res = await deps.fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`Open-Meteo answered ${res.status}`);
    const weather = toWeather(OpenMeteoResponseSchema.parse(await res.json()), now().toISOString());
    if (weather.daily.length < 2) throw new Error('Open-Meteo returned fewer than 2 usable days');
    return weather;
  }

  return {
    async getWeather() {
      const at = now().getTime();
      if (memory && at < memory.expiresAt) return memory.payload;

      const cached = await readRepo();
      if (cached && at - Date.parse(cached.fetchedAt) < ttlMs && !cached.payload.stale) {
        memory = { payload: cached.payload, expiresAt: Date.parse(cached.fetchedAt) + ttlMs };
        return cached.payload;
      }

      try {
        const payload = await fetchFresh();
        memory = { payload, expiresAt: at + ttlMs };
        await writeRepo(payload);
        return payload;
      } catch (err) {
        const last = memory?.payload ?? cached?.payload ?? WeatherSchema.parse(fallback);
        const payload = { ...last, stale: true };
        console.warn(`weather: Open-Meteo unavailable, serving stale data (${String(err)})`);
        memory = { payload, expiresAt: at + RETRY_AFTER_MS };
        return payload;
      }
    },
  };
}
