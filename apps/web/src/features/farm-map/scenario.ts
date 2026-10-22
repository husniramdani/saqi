import type { BlockDecision, Reason, ScheduleItem } from '@saqi/shared';

// The demo night (plan/03 §4) as the API would send it: for the kitchen page and tests.
// Not used by the app, which reads /api/plan/today.

const decision = (
  blockId: string,
  kind: BlockDecision['decision'],
  pawNow: number | null,
  volumeM3: number,
  extra: Partial<BlockDecision> = {},
): BlockDecision => ({
  blockId,
  decision: kind,
  pawNow,
  pawProjected: pawNow === null ? null : pawNow - 8,
  threshold: 65,
  target: 90,
  et0Mm: 5.8,
  etcMm: 5.5,
  netMm: 0,
  grossMm: 0,
  volumeM3,
  litresPerTree: null,
  savedVsFixedM3: 0,
  confidence: 'high',
  reasons: [],
  ...extra,
});

const stale: Reason = { code: 'SENSOR_STALE', params: { sensorId: 'D-3-60', hours: 9 } };

export const scenarioDecisions: BlockDecision[] = [
  decision('D-1', 'irrigate', 68, 90.4),
  decision('D-2', 'skip', 84, 0),
  decision('D-3', 'skip', 75, 0, { confidence: 'low', reasons: [stale] }),
  decision('D-4', 'skip', 77, 0),
  decision('G-1', 'pulse', 80, 7.6),
  decision('G-2', 'pulse', 83, 6.6),
  decision('F-1', 'deficit', 49, 155.5),
];

export const scenarioSchedule: ScheduleItem[] = [
  {
    blockId: 'D-1',
    kind: 'night',
    start: '2026-10-23T18:00:00.000Z',
    end: '2026-10-23T21:01:00.000Z',
    volumeM3: 90.4,
  },
  {
    blockId: 'F-1',
    kind: 'night',
    start: '2026-10-23T21:01:00.000Z',
    end: '2026-10-24T00:28:00.000Z',
    volumeM3: 155.5,
  },
  ...['03', '07', '11'].map((h) => ({
    blockId: 'G-1',
    kind: 'pulse' as const,
    start: `2026-10-24T${h}:00:00.000Z`,
    end: `2026-10-24T${h}:13:00.000Z`,
    volumeM3: 2.5,
  })),
];
