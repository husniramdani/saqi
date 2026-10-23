import { describe, expect, it } from 'vitest';
import { scenarioDecisions } from '@/features/farm-map/scenario';
import { byRisk, needsAttention } from './risk';

describe('risk', () => {
  it('puts irrigation first, then deficit, stale sensors, and the rest driest first', () => {
    expect(byRisk(scenarioDecisions).map((d) => d.blockId)).toEqual([
      'D-1',
      'F-1',
      'D-3',
      'D-4',
      'G-1',
      'G-2',
      'D-2',
    ]);
  });

  it('matches the reference cockpit’s order on its own figures', () => {
    const paw: Record<string, number> = { 'D-4': 74, 'G-2': 88 };
    const reference = scenarioDecisions.map((d) => ({ ...d, pawNow: paw[d.blockId] ?? d.pawNow }));
    expect(byRisk(reference).map((d) => d.blockId)).toEqual([
      'D-1',
      'F-1',
      'D-3',
      'D-4',
      'G-1',
      'D-2',
      'G-2',
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
