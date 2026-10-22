import { blockById, farm07, type BlockDecision, type ReasonCode } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { decideBlock } from './decide';
import { schedule } from './schedule';
import type { BlockPawInfo } from './types';

const DATE = '2026-10-23';
const fresh = (paw: number): BlockPawInfo => ({ paw, confidence: 'high', staleSensors: [] });
const decide = (id: string, paw: number, patch: Partial<BlockDecision> = {}) => ({
  ...decideBlock(blockById(farm07, id), fresh(paw), 5.8),
  ...patch,
});
const lastCode = (d: BlockDecision | undefined): ReasonCode | undefined => d?.reasons.at(-1)?.code;

describe('schedule: night window 22:00 → 05:00 GST, pump 60 m³/h', () => {
  it('runs blocks in parallel when their flows fit the pump together (case 11)', () => {
    const { items } = schedule([decide('D-1', 60), decide('D-2', 50)], farm07, DATE);
    expect(items.map((i) => [i.blockId, i.start])).toEqual([
      ['D-2', '2026-10-23T22:00:00+04:00'], // driest projected PAW first within a priority
      ['D-1', '2026-10-23T22:00:00+04:00'],
    ]);
  });

  it('queues a block until the pump has room (30 + 45 > 60)', () => {
    const { items, decisions } = schedule(
      [decide('F-1', 49, { decision: 'deficit', volumeM3: 155.5 }), decide('D-1', 68)],
      farm07,
      DATE,
    );
    expect(items).toEqual([
      {
        blockId: 'D-1',
        kind: 'night',
        start: '2026-10-23T22:00:00+04:00',
        end: '2026-10-24T01:01:00+04:00',
        volumeM3: 90.4,
      },
      {
        blockId: 'F-1',
        kind: 'night',
        start: '2026-10-24T01:01:00+04:00',
        end: '2026-10-24T04:28:00+04:00',
        volumeM3: 155.5,
      },
    ]);
    expect(decisions.find((d) => d.blockId === 'D-1')?.reasons.at(-1)).toEqual({
      code: 'WINDOW_ASSIGNED',
      params: { start: '22:00', end: '01:01' },
    });
  });

  it('cuts the last run to fit the window (case 12)', () => {
    const { items, decisions } = schedule([decide('F-1', 20, { volumeM3: 500 })], farm07, DATE);
    // 7 h × 45 m³/h = 315 m³ fits; 185 m³ is cut.
    expect(items[0]).toMatchObject({ volumeM3: 315, end: '2026-10-24T05:00:00+04:00' });
    expect(decisions[0]?.volumeM3).toBe(315);
    expect(decisions[0]?.reasons.at(-1)).toEqual({
      code: 'WINDOW_OVERFLOW',
      params: { cutM3: 185 },
    });
  });

  it('drops a run that finds no room at all, with the whole volume reported as cut', () => {
    const fullNight = decide('D-1', 20, { volumeM3: 210 }); // 7 h at 30 m³/h
    const { items, decisions } = schedule(
      [fullNight, decide('F-1', 20, { volumeM3: 100 })],
      farm07,
      DATE,
    );
    expect(items.map((i) => i.blockId)).toEqual(['D-1']);
    const f1 = decisions.find((d) => d.blockId === 'F-1');
    expect(f1?.volumeM3).toBe(0);
    expect(f1?.reasons.at(-1)).toEqual({ code: 'WINDOW_OVERFLOW', params: { cutM3: 100 } });
  });

  it('runs a block alone when its flow exceeds the pump', () => {
    const smallPump = { ...farm07, pumpCapacityM3h: 20 };
    const { items } = schedule([decide('D-1', 60), decide('D-2', 60)], smallPump, DATE);
    expect(items[1]?.start).toBe(items[0]?.end);
  });

  it('places greenhouse pulses tomorrow at the farm pulse times', () => {
    const { items } = schedule([decide('G-1', 80)], farm07, DATE);
    expect(items).toEqual(
      ['07:00', '11:00', '15:00'].map((t, i) => ({
        blockId: 'G-1',
        kind: 'pulse',
        start: `2026-10-24T${t}:00+04:00`,
        end: `2026-10-24T${['07:13', '11:13', '15:13'][i]}:00+04:00`,
        volumeM3: 2.5,
      })),
    );
  });

  it('leaves skips unscheduled and untouched', () => {
    const skip = decide('D-2', 84);
    const out = schedule([skip], farm07, DATE);
    expect(out.items).toEqual([]);
    expect(out.decisions).toEqual([skip]);
    expect(lastCode(out.decisions[0])).toBe('SAVES_VS_FIXED');
  });
});
