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
  })
  .refine((env) => env.DATA_SOURCE !== 'pg' || env.DATABASE_URL, {
    message: 'DATABASE_URL is required when DATA_SOURCE=pg',
    path: ['DATABASE_URL'],
  });

export type Config = z.infer<typeof EnvSchema>;

export const loadConfig = (env: Record<string, string | undefined> = process.env): Config =>
  EnvSchema.parse(env);
