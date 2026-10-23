import { ApiErrorSchema, type ApiErrorCode } from '@saqi/shared';
import type { z } from 'zod';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

/** Dev scenarios (T20); the API serves all but `api-down` when it runs with SCENARIOS=1. */
export const DEV_SCENARIOS = [
  'normal',
  'api-down',
  'weather-stale',
  'no-irrigation-tonight',
  'budget-over',
  'all-sensors-stale-D3',
] as const;
const SCENARIO_KEY = 'saqi.scenario';

/**
 * Dev builds only: `?scenario=` on any page URL picks a scenario for this tab (kept in
 * sessionStorage, since in-app links drop the query); `?scenario=normal` clears it.
 */
function readDevScenario(): string | null {
  if (!import.meta.env.DEV || typeof location === 'undefined') return null;
  try {
    const fromUrl = new URLSearchParams(location.search).get('scenario');
    if (fromUrl === 'normal') sessionStorage.removeItem(SCENARIO_KEY);
    else if (fromUrl) sessionStorage.setItem(SCENARIO_KEY, fromUrl);
    return sessionStorage.getItem(SCENARIO_KEY);
  } catch {
    return null; // storage blocked: no scenario
  }
}

export const devScenario = readDevScenario();
// `api-down`: a port nothing listens on, so every request fails like a dead API.
const BASE_URL = devScenario === 'api-down' ? 'http://127.0.0.1:9' : API_URL;
const withScenario = (path: string) =>
  devScenario && devScenario !== 'api-down'
    ? `${path}${path.includes('?') ? '&' : '?'}scenario=${encodeURIComponent(devScenario)}`
    : path;

/** Every failed request becomes one of these; `NETWORK` means the request never got an answer. */
export class ApiError extends Error {
  override name = 'ApiError';
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode | 'NETWORK',
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

async function request<S extends z.ZodType>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  schema: S,
  body?: unknown,
): Promise<z.output<S>> {
  const init: RequestInit =
    body === undefined
      ? { method }
      : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${withScenario(path)}`, init);
  } catch (err) {
    throw new ApiError(0, 'NETWORK', err instanceof Error ? err.message : 'Network error');
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiErrorSchema.safeParse(data);
    if (!parsed.success) throw new ApiError(res.status, 'INTERNAL', `HTTP ${res.status}`);
    const { code, message, details } = parsed.data.error;
    throw new ApiError(res.status, code, message, details);
  }
  return schema.parse(data);
}

export const apiGet = <S extends z.ZodType>(path: string, schema: S) =>
  request('GET', path, schema);

export const apiPost = <S extends z.ZodType>(path: string, schema: S, body: unknown) =>
  request('POST', path, schema, body);

export const apiPatch = <S extends z.ZodType>(path: string, schema: S, body: unknown) =>
  request('PATCH', path, schema, body);
