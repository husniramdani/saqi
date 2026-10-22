import type { ApiErrorBody, ApiErrorCode } from '@saqi/shared';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError, type z } from 'zod';
import { ConflictError, NotFoundError, UpstreamError } from '../repo/types';

const validateResponses = process.env.NODE_ENV !== 'production';

/**
 * zod-validator hook: rethrow so `onError` answers with our 422 body instead of the default 400.
 */
export const throwOnInvalid = (result: { success: boolean; error?: unknown }) => {
  if (!result.success) throw result.error;
};

/** Sends JSON, checking it against the shared contract outside production. */
export function respond<S extends z.ZodType>(
  c: Context,
  schema: S,
  data: z.output<S>,
  status: ContentfulStatusCode = 200,
) {
  if (validateResponses) {
    const result = schema.safeParse(data);
    // A contract break is our bug, not the client's: surface it as a 500, not a 422.
    if (!result.success) throw new Error(`Response breaks its contract: ${result.error.message}`);
  }
  return c.json(data as object, status);
}

const body = (code: ApiErrorCode, message: string, details?: unknown): ApiErrorBody => ({
  error: details === undefined ? { code, message } : { code, message, details },
});

export function toErrorResponse(err: Error): { status: ContentfulStatusCode; body: ApiErrorBody } {
  if (err instanceof NotFoundError) return { status: 404, body: body('NOT_FOUND', err.message) };
  if (err instanceof ZodError)
    return { status: 422, body: body('VALIDATION', 'Invalid request', err.issues) };
  if (err instanceof ConflictError)
    return { status: 409, body: body('CONFLICT', err.message, err.details) };
  if (err instanceof UpstreamError) return { status: 502, body: body('UPSTREAM', err.message) };
  if (err instanceof HTTPException && err.status < 500)
    return { status: err.status, body: body('VALIDATION', err.message) };
  return { status: 500, body: body('INTERNAL', 'Internal error') };
}

export const notFoundBody = (path: string) => body('NOT_FOUND', `No route for ${path}`);
