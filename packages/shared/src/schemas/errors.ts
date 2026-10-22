import { z } from 'zod';

export const ApiErrorCodeSchema = z.enum([
  'NOT_FOUND',
  'VALIDATION',
  'UPSTREAM',
  'CONFLICT',
  'INTERNAL',
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
/** Named `ApiErrorBody` so the web's thrown `ApiError` class keeps the short name. */
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;
