import recordedForecast from './fixtures/openmeteo-forecast.json' with { type: 'json' };

/**
 * The recorded Open-Meteo payload (Al Ain, 2026-10-22) with ET₀ pinned to the worked example's
 * 5.8 mm (plan/04 §3), so the live scenario lands on its story: D-1 irrigates 90.4 m³, F-1 on
 * deficit, the month tight. Used by the route tests and by `WEATHER_FIXTURE=1` (E2E).
 */
export const workedExampleForecast = {
  ...recordedForecast,
  daily: {
    ...recordedForecast.daily,
    et0_fao_evapotranspiration: recordedForecast.daily.et0_fao_evapotranspiration.map(() => 5.8),
  },
};

/** A `fetch` that answers every request with the worked-example forecast; no network. */
export const workedExampleFetch: typeof fetch = async () => Response.json(workedExampleForecast);
