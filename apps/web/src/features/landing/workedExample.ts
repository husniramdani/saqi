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

const clock = (iso: string) => iso.slice(11, 16);
const runsOf = (blockId: string) => landingSchedule.filter((item) => item.blockId === blockId);

/** Wall-clock window in GST, as scheduled by the engine; empty when the block is not watered. */
function windowOf(blockId: LandingScenario['blockId']): string {
  const runs = runsOf(blockId);
  const first = runs[0];
  if (!first) return '';
  if (first.kind === 'pulse') return runs.map((run) => clock(run.start)).join(' · ');
  return `${clock(first.start)} → ${clock(first.end)}`;
}

const scenario = (
  key: LandingDecisionKey,
  blockId: LandingScenario['blockId'],
  when: LandingScenario['when'],
): LandingScenario => ({
  key,
  blockId,
  when,
  decision: requiredDecision(blockId),
  window: windowOf(blockId),
  summaryKey: `landing.decision.scenarios.${key}.sub`,
});

export const landingScenarios: Record<LandingDecisionKey, LandingScenario> = {
  irrigate: scenario('irrigate', 'D-1', 'tonight'),
  skip: scenario('skip', 'D-2', 'tonight'),
  deficit: scenario('deficit', 'F-1', 'tonight'),
  pulse: scenario('pulse', 'G-1', 'tomorrow'),
};

/** Minutes after midnight of an `HH:MM` wall-clock time. */
const minuteOfDay = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};
const minutes = (iso: string) => minuteOfDay(clock(iso));
const windowStart = minuteOfDay(farm07.nightWindow.start);
const windowLength = (minuteOfDay(farm07.nightWindow.end) - windowStart + 1440) % 1440;

export interface LandingNightBar {
  blockId: string;
  start: string;
  end: string;
  volumeM3: number;
  /** Offset and width as a share of the night window, in percent. */
  offsetPct: number;
  widthPct: number;
}

/** Tonight's runs on the 22:00 → 05:00 window, for the schedule tracks. */
export const landingNightBars: LandingNightBar[] = landingSchedule
  .filter((item) => item.kind === 'night')
  .map((item) => {
    const offset = (minutes(item.start) - windowStart + 1440) % 1440;
    const length = (minutes(item.end) - minutes(item.start) + 1440) % 1440;
    return {
      blockId: item.blockId,
      start: clock(item.start),
      end: clock(item.end),
      volumeM3: item.volumeM3,
      offsetPct: Math.round((offset / windowLength) * 1000) / 10,
      widthPct: Math.round((length / windowLength) * 1000) / 10,
    };
  });

/** Night irrigation only (the greenhouse pulses run tomorrow, in daylight). */
export const landingTonightM3 =
  Math.round(landingNightBars.reduce((total, bar) => total + bar.volumeM3, 0) * 10) / 10;
export const landingSavedM3 = landingDecisions.reduce(
  (total, decision) => total + decision.savedVsFixedM3,
  0,
);

/** Greenhouse pulses tomorrow: start times and the minutes each pulse runs. */
export const landingPulses = (() => {
  const runs = runsOf('G-1');
  const first = runs[0];
  return {
    times: runs.map((run) => clock(run.start)),
    minutes: first ? (minutes(first.end) - minutes(first.start) + 1440) % 1440 : 0,
  };
})();

/** The month's water budget in the worked example (allocation and projection, m³). */
export const LANDING_BUDGET = { projectedM3: 6912, allocationM3: 7050, okPct: 97 } as const;

/** Every block decided by the engine, retained for the Making-of token-to-map scene. */
export const miniMapDecisions = (): BlockDecision[] => landingDecisions;
