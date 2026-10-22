import { z } from 'zod';

export const HealthSchema = z.object({
  ok: z.boolean(),
  dataSource: z.enum(['memory', 'pg']),
  version: z.string(),
});
export type Health = z.infer<typeof HealthSchema>;
