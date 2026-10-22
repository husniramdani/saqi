import { z } from 'zod';
import { IsoDateTimeSchema } from './common';

export const IrrigationEventSchema = z.object({
  id: z.string(),
  blockId: z.string(),
  startedAt: IsoDateTimeSchema,
  endedAt: IsoDateTimeSchema,
  volumeM3: z.number().nonnegative(),
  status: z.enum(['done', 'skipped']),
  source: z.enum(['auto', 'manual']),
  note: z.string().optional(),
});
export type IrrigationEvent = z.infer<typeof IrrigationEventSchema>;

/** Body of `POST /api/blocks/:id/events` (a manual "watered" log). */
export const NewIrrigationEventSchema = z
  .object({
    startedAt: IsoDateTimeSchema,
    endedAt: IsoDateTimeSchema,
    volumeM3: z.number().min(0.1).max(500),
    note: z.string().max(500).optional(),
  })
  .refine((e) => Date.parse(e.endedAt) >= Date.parse(e.startedAt), {
    message: 'endedAt must not be before startedAt',
    path: ['endedAt'],
  });
export type NewIrrigationEvent = z.infer<typeof NewIrrigationEventSchema>;
