import { NewIrrigationEventSchema, type NewIrrigationEvent } from '@saqi/shared';

/**
 * A manual log from the form: start is a GST wall-clock time on the given GST date; the run lasts
 * as long as the block's flow needs for that volume. Validated with the API's own schema.
 */
export function buildManualEvent(input: {
  date: string;
  time: string;
  volumeM3: number;
  flowM3h: number;
  note: string;
}): { ok: true; event: NewIrrigationEvent } | { ok: false; field: 'volumeM3' | 'startedAt' } {
  const start = Date.parse(`${input.date}T${input.time}:00+04:00`);
  if (!Number.isFinite(start)) return { ok: false, field: 'startedAt' };
  const minutes = Number.isFinite(input.volumeM3) ? (input.volumeM3 / input.flowM3h) * 60 : 0;
  const candidate = {
    startedAt: new Date(start).toISOString(),
    endedAt: new Date(start + Math.max(1, Math.round(minutes)) * 60_000).toISOString(),
    volumeM3: input.volumeM3,
    ...(input.note.trim() ? { note: input.note.trim() } : {}),
  };
  const parsed = NewIrrigationEventSchema.safeParse(candidate);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0] === 'volumeM3' ? 'volumeM3' : 'startedAt';
    return { ok: false, field };
  }
  return { ok: true, event: parsed.data };
}
