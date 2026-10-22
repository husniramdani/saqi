import { ApiErrorSchema, type ApiErrorCode } from '@saqi/shared';
import type { z } from 'zod';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

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
    res = await fetch(`${BASE_URL}${path}`, init);
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
