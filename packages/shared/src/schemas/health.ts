import { z } from 'zod';
import { IsoDateTimeSchema } from './common';

export const HealthSchema = z.object({
  ok: z.boolean(),
  dataSource: z.enum(['memory', 'pg']),
  version: z.string(),
  /** The hour the simulated history ends on, before time-shifting. */
  seedAnchor: IsoDateTimeSchema,
});
export type Health = z.infer<typeof HealthSchema>;
