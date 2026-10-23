import { applyBudget, decideBlock } from '@saqi/engine';
import { blockById, farm07, tawMm, type BlockDecision } from '@saqi/shared';
import { z } from 'zod';
import designMd from '../../../../../design.md?raw';

/**
 * Everything the story shows comes from the real thing: the design.md lines, the engine's
 * worked example (plan/04 §3, ET₀ tomorrow 5.8 mm) and the test counts CI writes.
 */

// --- Scene 1: the design.md colour block -----------------------------------------------

export interface CodeLine {
  text: string;
  /** The hex value when the line is a colour token. */
  hex?: string;
  /** Water-scale tokens fly out of the code into the palette, then onto the map. */
  water?: boolean;
}

/** `colors:`, the first eight tokens, an ellipsis, then the water scale and `stale` (18 lines). */
export function colourExcerpt(source = designMd): CodeLine[] {
  const lines = source.split('\n');
  const start = lines.findIndex((l) => l.startsWith('colors:'));
  if (start === -1) return [];
  const tokens = lines.slice(start + 1).filter((l) => /^ {2}[\w-]+: '#[0-9A-Fa-f]{6,8}'/.test(l));
  const water = tokens.filter((l) => /^ {2}water-\d:/.test(l));
  const stale = tokens.find((l) => l.startsWith('  stale:'));
  const toLine = (text: string): CodeLine => {
    const hex = /'(#[0-9A-Fa-f]{6})/.exec(text)?.[1];
    return { text, ...(hex ? { hex } : {}), ...(/water-\d/.test(text) ? { water: true } : {}) };
  };
  return [
    { text: lines[start] ?? 'colors:' },
    ...tokens.slice(0, 8).map(toLine),
    { text: '  # …' },
    ...water.map(toLine),
    ...(stale ? [toLine(stale)] : []),
  ];
}

// --- Scenes 2 and 3: the engine's worked example ----------------------------------------

export const ET0_MM = 5.8;
const fresh = (paw: number) => ({ paw, confidence: 'high' as const, staleSensors: [] });

const d1Block = blockById(farm07, 'D-1');
const D1_PAW = 68;

/** The water-balance terms for D-1, unrounded inside like the engine; rounded only to show. */
export const d1Formula = (() => {
  const taw = tawMm(d1Block);
  const etc = d1Block.kc * ET0_MM * d1Block.et0Factor;
  const projected = D1_PAW - (etc / taw) * 100;
  return {
    target: d1Block.pawTarget,
    projected,
    taw,
    efficiency: d1Block.efficiency,
    area: d1Block.areaHa,
    wetted: d1Block.wettedFraction,
    volume: decideBlock(d1Block, fresh(D1_PAW), ET0_MM).volumeM3,
  };
})();

/** Irrigate D-1, Skip D-2, Deficit F-1, as the engine decides them. */
export function storyDecisions(): BlockDecision[] {
  const d1 = decideBlock(d1Block, fresh(D1_PAW), ET0_MM);
  const d2 = decideBlock(blockById(farm07, 'D-2'), fresh(84), ET0_MM);
  // A month heading over its allocation: the budget guard puts F-1 (priority 3) on deficit.
  const f1 = applyBudget(
    [decideBlock(blockById(farm07, 'F-1'), fresh(49), ET0_MM)],
    farm07,
    { month: '2026-10', allocationM3: 1, usedM3: 0, daysInMonth: 31, dayOfMonth: 23 },
    ET0_MM,
  ).decisions[0];
  return f1 ? [d1, d2, f1] : [d1, d2];
}

/**
 * The miniature map in scene 1: every block decided by the engine. D-1, D-2, F-1 and G-1 use
 * the worked example's PAW; D-3, D-4 and G-2 have none there, so they get plausible skips.
 */
const MINI_MAP_PAW: Record<string, number> = {
  'D-1': 68,
  'D-2': 84,
  'D-3': 76,
  'D-4': 81,
  'F-1': 49,
  'G-1': 80,
  'G-2': 78,
};
export const miniMapDecisions = (): BlockDecision[] =>
  farm07.blocks.map((b) => decideBlock(b, fresh(MINI_MAP_PAW[b.id] ?? 70), ET0_MM));

// --- Scene 4: test counts ---------------------------------------------------------------

/** Written by `scripts/test-stats.ts` in CI (T22). */
export const TestStatsSchema = z.object({
  engine: z.number().int().nonnegative(),
  api: z.number().int().nonnegative(),
  web: z.number().int().nonnegative(),
  e2e: z.number().int().nonnegative(),
  durationSec: z.number().nonnegative().nullable(),
});
export type TestStats = z.infer<typeof TestStatsSchema>;

// ponytail: counted by hand on 2026-10-23 (T19); CI replaces it via public/test-stats.json (T22).
export const FALLBACK_STATS: TestStats = {
  engine: 56,
  api: 86,
  web: 151,
  e2e: 0,
  durationSec: null,
};

export async function fetchTestStats(): Promise<TestStats> {
  try {
    const res = await fetch('/test-stats.json');
    // Missing file: the dev server answers with index.html, which fails the schema below.
    const parsed = TestStatsSchema.safeParse(await res.json());
    return parsed.success ? parsed.data : FALLBACK_STATS;
  } catch {
    return FALLBACK_STATS;
  }
}
