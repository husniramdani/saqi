import { WeatherSchema, type Weather } from '@saqi/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import recorded from '../sim/fixtures/openmeteo-forecast.json' with { type: 'json' };
import fallback from '../sim/fixtures/weather-fallback.json' with { type: 'json' };
import {
  createWeatherService,
  OpenMeteoResponseSchema,
  toWeather,
  type WeatherDeps,
} from './weather';

const T0 = Date.parse('2026-10-22T08:00:00Z');
const TTL_S = 1800;

/** A repo cache in a Map, like memory mode. */
function fakeRepo() {
  const store = new Map<string, { payload: Weather; fetchedAt: string }>();
  return {
    store,
    getWeatherCache: async (key: string) => store.get(key) ?? null,
    setWeatherCache: async (key: string, payload: Weather) => {
      store.set(key, { payload, fetchedAt: payload.fetchedAt });
    },
  };
}

function setup(fetchImpl: typeof fetch, repo = fakeRepo()) {
  let at = T0;
  const fetchSpy = vi.fn(fetchImpl);
  const deps: WeatherDeps = {
    fetch: fetchSpy,
    repo,
    now: () => new Date(at),
    lat: 24.21,
    lon: 55.74,
    ttlSeconds: TTL_S,
    timeoutMs: 20,
  };
  return {
    service: createWeatherService(deps),
    fetchSpy,
    repo,
    advance: (ms: number) => {
      at += ms;
    },
  };
}

const ok: typeof fetch = async () => Response.json(recorded);
const fail500: typeof fetch = async () => new Response('upstream down', { status: 500 });
const malformed: typeof fetch = async () => Response.json({ hello: 'world' });
const hang: typeof fetch = (_url, init) =>
  new Promise((_, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
  });

afterEach(() => vi.restoreAllMocks());

describe('toWeather', () => {
  it('maps the recorded Open-Meteo payload onto the Weather contract', () => {
    const w = toWeather(OpenMeteoResponseSchema.parse(recorded), new Date(T0).toISOString());
    expect(() => WeatherSchema.parse(w)).not.toThrow();
    expect(w.daily).toHaveLength(7);
    expect(w.daily[0]).toMatchObject({ date: '2026-10-22', et0Mm: 6.31 });
    expect(w.daily.every((d) => d.et0Mm >= 0 && d.et0Mm <= 12)).toBe(true);
    expect(w.current).toEqual({ tempC: 35.6, humidityPct: 19, windKmh: 10.4, isDay: true });
    expect(w.stale).toBe(false);
  });

  it('drops days Open-Meteo has no data for', () => {
    const raw = OpenMeteoResponseSchema.parse(recorded);
    const gappy = {
      ...raw,
      daily: {
        ...raw.daily,
        et0_fao_evapotranspiration: [...raw.daily.et0_fao_evapotranspiration.slice(0, 6), null],
      },
    };
    expect(toWeather(gappy, new Date(T0).toISOString()).daily).toHaveLength(6);
  });
});

describe('weather service', () => {
  it('fetches once and serves from memory within the TTL', async () => {
    const { service, fetchSpy, advance } = setup(ok);
    const first = await service.getWeather();
    advance(TTL_S * 1000 - 1);
    expect(await service.getWeather()).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    advance(2);
    await service.getWeather();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('asks Open-Meteo for the farm, its daily ET₀ and GST days', async () => {
    const { service, fetchSpy } = setup(ok);
    await service.getWeather();
    const url = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(url.searchParams.get('latitude')).toBe('24.21');
    expect(url.searchParams.get('daily')).toContain('et0_fao_evapotranspiration');
    expect(url.searchParams.get('timezone')).toBe('Asia/Dubai');
  });

  it('reuses a fresh repo copy after a cold start instead of fetching', async () => {
    const warm = setup(ok);
    await warm.service.getWeather();
    const cold = setup(ok, warm.repo);
    await cold.service.getWeather();
    expect(cold.fetchSpy).not.toHaveBeenCalled();
  });

  it('serves the last good payload marked stale when Open-Meteo answers 500', async () => {
    let impl: typeof fetch = ok;
    const { service, advance } = setup((...args) => impl(...args));
    const good = await service.getWeather();
    advance(TTL_S * 1000 + 1);
    impl = fail500;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const stale = await service.getWeather();
    expect(stale).toEqual({ ...good, stale: true });
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('falls back to the committed fixture, stale, when a request times out with nothing cached', async () => {
    const { service } = setup(hang);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await service.getWeather()).toEqual({ ...WeatherSchema.parse(fallback), stale: true });
  });

  it('treats a malformed payload as a failure, never throwing', async () => {
    const { service } = setup(malformed);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const w = await service.getWeather();
    expect(w.stale).toBe(true);
    expect(() => WeatherSchema.parse(w)).not.toThrow();
  });

  it('waits a minute before retrying after a failure', async () => {
    const { service, fetchSpy, advance } = setup(fail500);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await service.getWeather();
    advance(59_000);
    await service.getWeather();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    advance(2_000);
    await service.getWeather();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps working when the repo cache itself fails', async () => {
    const broken = {
      ...fakeRepo(),
      getWeatherCache: () => Promise.reject(new Error('db down')),
      setWeatherCache: () => Promise.reject(new Error('db down')),
    };
    const { service } = setup(ok, broken);
    expect((await service.getWeather()).stale).toBe(false);
  });
});
