import { z } from 'zod';
import { IsoDateTimeSchema } from './common';

export const SensorPointSchema = z.object({
  t: IsoDateTimeSchema,
  paw: z.number().min(0).max(100),
});
export type SensorPoint = z.infer<typeof SensorPointSchema>;

export const SensorSeriesSchema = z.object({
  sensorId: z.string(),
  depthCm: z.number().int().positive().nullable(),
  stale: z.boolean(),
  lastAt: IsoDateTimeSchema,
  points: z.array(SensorPointSchema),
});
export type SensorSeries = z.infer<typeof SensorSeriesSchema>;
