import { describe, expect, it } from 'vitest';
import { scenarioDecisions } from '@/features/farm-map/scenario';
import { byRisk, needsAttention } from './risk';

describe('risk', () => {
  it('puts tonight’s water first (driest first), then stale sensors, pulses, skips', () => {
    expect(byRisk(scenarioDecisions).map((d) => d.blockId)).toEqual([
      'F-1',
      'D-1',
      'D-3',
      'G-1',
      'G-2',
      'D-4',
      'D-2',
    ]);
  });

  it('flags irrigate, deficit and low confidence as needing attention', () => {
    expect(scenarioDecisions.filter(needsAttention).map((d) => d.blockId)).toEqual([
      'D-1',
      'D-3',
      'F-1',
    ]);
  });
});
