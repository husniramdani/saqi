import { applyBudget, decideBlock, schedule } from '@saqi/engine';
import { blockById, farm07, tawMm, type BlockDecision, type ScheduleItem } from '@saqi/shared';

export type LandingDecisionKey = 'irrigate' | 'skip' | 'deficit' | 'pulse';

export interface LandingScenario {
  key: LandingDecisionKey;
  blockId: 'D-1' | 'D-2' | 'F-1' | 'G-1';
  when: 'tonight' | 'tomorrow';
  decision: BlockDecision;
  window: string;
  summaryKey: string;
}

export const LANDING_ET0_WEEK = [5.8, 6.0, 6.2, 5.9, 6.3, 6.1, 5.7] as const;
export const LANDING_ET0_MM = LANDING_ET0_WEEK[0];

const fresh = (paw: number) => ({ paw, confidence: 'high' as const, staleSensors: [] });
const d1Block = blockById(farm07, 'D-1');

/** Water-balance terms shared by Landing and the Making-of story. */
export const d1Formula = (() => {
  const taw = tawMm(d1Block);
  const etc = d1Block.kc * LANDING_ET0_MM * d1Block.et0Factor;
  const projected = 68 - (etc / taw) * 100;
  return {
    target: d1Block.pawTarget,
    projected,
    taw,
    efficiency: d1Block.efficiency,
    area: d1Block.areaHa,
    wetted: d1Block.wettedFraction,
    volume: decideBlock(d1Block, fresh(68), LANDING_ET0_MM).volumeM3,
  };
})();

/** The three decisions narrated by the Making-of route. */
export function storyDecisions(): BlockDecision[] {
  const d1 = decideBlock(d1Block, fresh(68), LANDING_ET0_MM);
  const d2 = decideBlock(blockById(farm07, 'D-2'), fresh(84), LANDING_ET0_MM);
  const f1 = applyBudget(
    [decideBlock(blockById(farm07, 'F-1'), fresh(49), LANDING_ET0_MM)],
    farm07,
    { month: '2026-10', allocationM3: 1, usedM3: 0, daysInMonth: 31, dayOfMonth: 23 },
    LANDING_ET0_MM,
  ).decisions[0];
  return f1 ? [d1, d2, f1] : [d1, d2];
}

const narrated = new Map(storyDecisions().map((decision) => [decision.blockId, decision]));
const d3 = decideBlock(
  blockById(farm07, 'D-3'),
  {
    paw: 75.2,
    confidence: 'low',
    staleSensors: [{ sensorId: 'D-3-60', hours: 9 }],
  },
  LANDING_ET0_MM,
);
const rawDecisions: BlockDecision[] = farm07.blocks.map((block) => {
  const existing = narrated.get(block.id);
  if (existing) return existing;
  if (block.id === 'D-3') return d3;
  const paw = block.id === 'D-4' ? 74 : block.id === 'G-1' ? 80 : 88;
  return decideBlock(block, fresh(paw), LANDING_ET0_MM);
});

const scheduled = schedule(rawDecisions, farm07, '2026-10-23');
export const landingDecisions = scheduled.decisions;
export const landingSchedule: ScheduleItem[] = scheduled.items;

const byId = new Map(landingDecisions.map((decision) => [decision.blockId, decision]));
function requiredDecision(blockId: LandingScenario['blockId']): BlockDecision {
  const decision = byId.get(blockId);
  if (!decision) throw new Error(`Farm 07 worked example is missing ${blockId}`);
  return decision;
}

export const landingScenarios: Record<LandingDecisionKey, LandingScenario> = {
  irrigate: {
    key: 'irrigate',
    blockId: 'D-1',
    when: 'tonight',
    decision: requiredDecision('D-1'),
    window: '22:00–01:01 GST',
    summaryKey: 'landing.decision.scenarios.irrigate.summary',
  },
  skip: {
    key: 'skip',
    blockId: 'D-2',
    when: 'tonight',
    decision: requiredDecision('D-2'),
    window: 'No irrigation',
    summaryKey: 'landing.decision.scenarios.skip.summary',
  },
  deficit: {
    key: 'deficit',
    blockId: 'F-1',
    when: 'tonight',
    decision: requiredDecision('F-1'),
    window: '01:01–04:28 GST',
    summaryKey: 'landing.decision.scenarios.deficit.summary',
  },
  pulse: {
    key: 'pulse',
    blockId: 'G-1',
    when: 'tomorrow',
    decision: requiredDecision('G-1'),
    window: '07:00 · 11:00 · 15:00 GST',
    summaryKey: 'landing.decision.scenarios.pulse.summary',
  },
};

/** Every block decided by the engine, retained for the Making-of token-to-map scene. */
export const miniMapDecisions = (): BlockDecision[] => landingDecisions;
