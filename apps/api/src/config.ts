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
    /** Dev: serve the `?scenario=` overrides (T20). Off unless asked for; `pnpm dev` sets it. */
    SCENARIOS: z.enum(['0', '1']).default('0'),
    /** Set by Vercel on every build and function: marks a hosted deployment. */
    VERCEL: z.string().optional(),
  })
  .refine((env) => env.DATA_SOURCE !== 'pg' || env.DATABASE_URL, {
    message: 'DATABASE_URL is required when DATA_SOURCE=pg',
    path: ['DATABASE_URL'],
  })
  // Test and dev switches stay on a developer's machine: never with a database, never on Vercel.
  .refine(
    (env) =>
      (env.DATA_SOURCE === 'memory' && !env.VERCEL) ||
      (env.WEATHER_FIXTURE === '0' && !env.NOW && env.SCENARIOS === '0'),
    {
      message: 'WEATHER_FIXTURE, NOW and SCENARIOS are for local memory mode (dev, E2E) only',
      path: ['DATA_SOURCE'],
    },
  );

export type Config = z.infer<typeof EnvSchema>;

export const loadConfig = (env: Record<string, string | undefined> = process.env): Config =>
  EnvSchema.parse(env);
