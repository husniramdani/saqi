import { applyBudget, decideBlock } from '@saqi/engine';
import { blockById, farm07, type BlockDecision } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import {
  d1Formula,
  LANDING_ET0_MM,
  landingDecisions,
  landingScenarios,
  landingSchedule,
  storyDecisions,
} from './workedExample';

const fresh = (paw: number) => ({ paw, confidence: 'high' as const, staleSensors: [] });
const decide = (blockId: string, paw: number): BlockDecision => {
  const decision = decideBlock(blockById(farm07, blockId), fresh(paw), LANDING_ET0_MM);
  if (blockId !== 'F-1') return decision;
  return (
    applyBudget(
      [decision],
      farm07,
      { month: '2026-10', allocationM3: 1, usedM3: 0, daysInMonth: 31, dayOfMonth: 23 },
      LANDING_ET0_MM,
    ).decisions[0] ?? decision
  );
};

describe('landing worked example', () => {
  it.each([
    ['D-1', 68, 'irrigate', 90.4],
    ['D-2', 84, 'skip', 0],
    ['F-1', 49, 'deficit', 155.5],
    ['G-1', 80, 'pulse', 7.6],
  ] as const)('%s is recalculated by the engine', (blockId, paw, decision, volumeM3) => {
    expect(decide(blockId, paw)).toMatchObject({ blockId, decision, volumeM3 });
  });

  it('keeps the reference totals and both greenhouse pulse schedules', () => {
    const tonight = landingSchedule
      .filter((item) => item.kind === 'night')
      .reduce((total, item) => total + item.volumeM3, 0);
    const saved = landingDecisions.reduce((total, decision) => total + decision.savedVsFixedM3, 0);
    expect(tonight).toBeCloseTo(245.9, 1);
    expect(saved).toBe(62);
    expect(
      landingSchedule.filter((item) => item.kind === 'pulse').map((item) => item.blockId),
    ).toEqual(['G-1', 'G-1', 'G-1', 'G-2', 'G-2', 'G-2']);
  });

  it('backs every displayed map row with a real Farm 07 block', () => {
    const farmIds = new Set(farm07.blocks.map((block) => block.id));
    expect(landingDecisions).toHaveLength(farm07.blocks.length);
    expect(landingDecisions.every((decision) => farmIds.has(decision.blockId))).toBe(true);
    expect(Object.values(landingScenarios).every((scenario) => farmIds.has(scenario.blockId))).toBe(
      true,
    );
  });
});

describe('making-of worked example', () => {
  it('builds the D-1 sum from the engine, ending at 90.4 m³', () => {
    const { target, projected, taw, efficiency, area, wetted, volume } = d1Formula;
    expect(volume).toBe(90.4);
    // The terms on screen multiply out to the engine's answer.
    const shown = ((((target - projected) / 100) * taw) / efficiency) * area * 10 * wetted;
    expect(Math.round(shown * 10) / 10).toBe(volume);
  });

  it('has the engine decide Irrigate D-1, Skip D-2 and Deficit F-1', () => {
    expect(storyDecisions().map((d) => [d.blockId, d.decision, d.volumeM3])).toEqual([
      ['D-1', 'irrigate', 90.4],
      ['D-2', 'skip', 0],
      ['F-1', 'deficit', 155.5],
    ]);
  });
});
