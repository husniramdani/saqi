import { describe, expect, it } from 'vitest';
import { buildManualEvent } from './manualEvent';

const base = { date: '2026-10-23', time: '06:00', volumeM3: 12, flowM3h: 12, note: '' };

describe('buildManualEvent', () => {
  it('reads the start as GST and runs as long as the block’s flow needs', () => {
    const built = buildManualEvent(base);
    expect(built).toEqual({
      ok: true,
      event: {
        startedAt: '2026-10-23T02:00:00.000Z',
        endedAt: '2026-10-23T03:00:00.000Z',
        volumeM3: 12,
      },
    });
  });

  it.each([0, -3, 501, Number.NaN])('rejects %d m³ on the volume field', (volumeM3) => {
    expect(buildManualEvent({ ...base, volumeM3 })).toEqual({ ok: false, field: 'volumeM3' });
  });

  it('keeps a trimmed note and drops an empty one', () => {
    const built = buildManualEvent({ ...base, note: '  valve 3 sticky ' });
    expect(built.ok && built.event.note).toBe('valve 3 sticky');
    expect(
      buildManualEvent(base).ok && 'note' in (buildManualEvent(base) as { event: object }).event,
    ).toBe(false);
  });

  it('rejects an impossible start time', () => {
    expect(buildManualEvent({ ...base, time: '25:99' })).toEqual({ ok: false, field: 'startedAt' });
  });
});
