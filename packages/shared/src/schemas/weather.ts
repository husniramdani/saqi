import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema } from './common';

export const WeatherDaySchema = z.object({
  date: IsoDateSchema,
  et0Mm: z.number().nonnegative(),
  tMaxC: z.number(),
  tMinC: z.number(),
  humidityMeanPct: z.number().min(0).max(100),
  windMaxKmh: z.number().nonnegative(),
});
export type WeatherDay = z.infer<typeof WeatherDaySchema>;

export const WeatherSchema = z.object({
  fetchedAt: IsoDateTimeSchema,
  stale: z.boolean(),
  current: z.object({
    tempC: z.number(),
    humidityPct: z.number().min(0).max(100),
    windKmh: z.number().nonnegative(),
    isDay: z.boolean(),
  }),
  daily: z.array(WeatherDaySchema).min(1),
});
export type Weather = z.infer<typeof WeatherSchema>;
