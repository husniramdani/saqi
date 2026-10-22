import { blockById, farm07, tawMm, type Block, type ReasonCode } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { decideBlock } from './decide';
import { blockPaw } from './paw';
import { NOW, pair } from './test-helpers';
import type { BlockPawInfo } from './types';

const block = (id: string) => blockById(farm07, id);
const fresh = (paw: number): BlockPawInfo => ({ paw, confidence: 'high', staleSensors: [] });
const codes = (d: { reasons: { code: ReasonCode }[] }) => d.reasons.map((r) => r.code);
const ET0 = 5.8; // worked example, plan/04 §3

describe('decideBlock: worked example (ET₀ tomorrow 5.8 mm)', () => {
  it.each([
    // id, PAW now, decision, projected, net, gross, volume, L/tree, saved
    ['D-1', 68, 'irrigate', 60.3, 21.4, 25.1, 90.4, 750, 0],
    ['D-2', 84, 'skip', 76.3, 0, 0, 0, 0, 25],
    ['F-1', 49, 'irrigate', 37.1, 16.7, 22.2, 222.1, null, 0],
    ['G-1', 80, 'pulse', 69.6, 4.7, 5.1, 7.6, null, 0],
  ] as const)(
    '%s at PAW %d → %s',
    (id, paw, decision, pawProjected, netMm, grossMm, volumeM3, litresPerTree, savedVsFixedM3) => {
      expect(decideBlock(block(id), fresh(paw), ET0)).toMatchObject({
        blockId: id,
        decision,
        pawNow: paw,
        pawProjected,
        netMm,
        grossMm,
        volumeM3,
        litresPerTree,
        savedVsFixedM3,
        confidence: 'high',
      });
    },
  );

  it('explains an irrigate decision in the planned order (case 1)', () => {
    const d = decideBlock(block('D-1'), fresh(68), ET0);
    expect(codes(d)).toEqual([
      'PAW_NOW',
      'ET0_FORECAST',
      'PAW_PROJECTED',
      'BELOW_THRESHOLD',
      'REFILL_TO_TARGET',
    ]);
    expect(d.reasons[2]?.params).toEqual({ from: 68, to: 60.3, etcMm: 5.5 });
    expect(d.reasons[4]?.params).toEqual({ target: 90, netMm: 21.4, grossMm: 25.1 });
  });

  it('explains a skip with the water it saves (case 2)', () => {
    const d = decideBlock(block('D-2'), fresh(84), ET0);
    expect(codes(d)).toEqual([
      'PAW_NOW',
      'ET0_FORECAST',
      'PAW_PROJECTED',
      'ABOVE_THRESHOLD',
      'SAVES_VS_FIXED',
    ]);
    expect(d.reasons[4]?.params).toEqual({ m3: 25 });
  });

  it('splits greenhouse water into 3 pulses', () => {
    const d = decideBlock(block('G-1'), fresh(80), ET0);
    expect(codes(d)).toEqual(['PAW_NOW', 'ET0_FORECAST', 'PAW_PROJECTED', 'GREENHOUSE_PULSES']);
    expect(d.reasons[3]?.params).toEqual({ count: 3, m3: 2.5 });
  });
});

describe('decideBlock: edge cases (plan/04 §4)', () => {
  it('skips when projected PAW lands exactly on the threshold (case 3)', () => {
    const d1 = block('D-1');
    const drop = ((d1.kc * ET0 * d1.et0Factor) / tawMm(d1)) * 100;
    const d = decideBlock(d1, fresh(d1.pawThreshold + drop), ET0);
    expect(d.decision).toBe('skip');
    expect(d.pawProjected).toBe(65);
  });

  it('never asks for negative water when PAW is above target (case 4)', () => {
    const d = decideBlock(block('D-1'), fresh(99), ET0);
    expect(d).toMatchObject({ decision: 'skip', volumeM3: 0, netMm: 0, grossMm: 0 });
  });

  it('adds a refill to greenhouse pulses below threshold (case 5)', () => {
    const d = decideBlock(block('G-1'), fresh(70), ET0);
    expect(d.decision).toBe('pulse');
    expect(codes(d)).toContain('REFILL_TO_TARGET');
    // ETc 4.67 mm + refill (92 − 70)% of 45 mm = 9.9 mm → 14.57 mm net.
    expect(d.netMm).toBe(14.6);
    const pulse = d.reasons.find((r) => r.code === 'GREENHOUSE_PULSES');
    expect(pulse?.params.m3).toBeCloseTo(d.volumeM3 / 3, 1);
  });

  it('decides on the fresh sensor and flags the stale one (case 6)', () => {
    const d = decideBlock(block('D-3'), blockPaw(block('D-3'), pair('D-3', 75, 40, 9), NOW), ET0);
    expect(d).toMatchObject({ decision: 'skip', pawNow: 75, confidence: 'low' });
    expect(d.reasons.at(-1)).toEqual({
      code: 'SENSOR_STALE',
      params: { sensorId: 'D-3-60', hours: 9 },
    });
  });

  it('skips with low confidence when every sensor is stale (case 7)', () => {
    const info: BlockPawInfo = {
      paw: null,
      confidence: 'low',
      staleSensors: [
        { sensorId: 'D-1-30', hours: 6 },
        { sensorId: 'D-1-60', hours: 6 },
      ],
    };
    const d = decideBlock(block('D-1'), info, ET0);
    expect(d).toMatchObject({ decision: 'skip', volumeM3: 0, pawNow: null, confidence: 'low' });
    expect(codes(d)).toEqual(['SENSOR_STALE', 'SENSOR_STALE', 'LOW_CONFIDENCE']);
  });

  it('carries medium confidence through when sensors disagree (case 8)', () => {
    const d = decideBlock(block('D-1'), blockPaw(block('D-1'), pair('D-1', 80, 60), NOW), ET0);
    expect(d.confidence).toBe('medium');
  });

  it('is deterministic: same input, deep-equal output (case 13)', () => {
    const run = () => decideBlock(block('F-1'), fresh(49), ET0);
    expect(run()).toEqual(run());
  });

  it.each(farm07.blocks.filter((b) => b.mode === 'night').map((b) => [b.id, b] as [string, Block]))(
    'handles ET₀ = 0 without dividing by zero: %s skips (case 14)',
    (_id, b) => {
      const d = decideBlock(b, fresh(b.pawThreshold + 5), 0);
      expect(d.decision).toBe('skip');
      expect(d.etcMm).toBe(0);
      expect(d.reasons).toContainEqual({ code: 'ET0_FORECAST', params: { mm: 0 } });
      expect(Number.isFinite(d.volumeM3)).toBe(true);
    },
  );
});
