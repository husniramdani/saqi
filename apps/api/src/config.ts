import { z } from 'zod';

export const VERSION = '0.1.0';

const EnvSchema = z
  .object({
    DATA_SOURCE: z.enum(['memory', 'pg']).default('memory'),
    DATABASE_URL: z.string().min(1).optional(),
    FARM_LAT: z.coerce.number().min(-90).max(90).default(24.21),
    FARM_LON: z.coerce.number().min(-180).max(180).default(55.74),
    WEATHER_TTL_SECONDS: z.coerce.number().int().positive().default(1800),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    PORT: z.coerce.number().int().positive().default(8787),
    /** E2E: serve the recorded worked-example forecast instead of calling Open-Meteo. */
    WEATHER_FIXTURE: z.enum(['0', '1']).default('0'),
    /** E2E: freeze the API clock (ISO instant), so it agrees with the browser's frozen clock. */
    NOW: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((env) => env.DATA_SOURCE !== 'pg' || env.DATABASE_URL, {
    message: 'DATABASE_URL is required when DATA_SOURCE=pg',
    path: ['DATABASE_URL'],
  })
  // Test switches never reach a real database deployment.
  .refine((env) => env.DATA_SOURCE === 'memory' || (env.WEATHER_FIXTURE === '0' && !env.NOW), {
    message: 'WEATHER_FIXTURE and NOW are for memory mode (E2E) only',
    path: ['DATA_SOURCE'],
  });

export type Config = z.infer<typeof EnvSchema>;

export const loadConfig = (env: Record<string, string | undefined> = process.env): Config =>
  EnvSchema.parse(env);
