import { z } from 'zod';

/** Written by `scripts/test-stats.ts` in CI. */
export const TestStatsSchema = z.object({
  engine: z.number().int().nonnegative(),
  api: z.number().int().nonnegative(),
  web: z.number().int().nonnegative(),
  e2e: z.number().int().nonnegative(),
  durationSec: z.number().nonnegative().nullable(),
});
export type TestStats = z.infer<typeof TestStatsSchema>;

export const FALLBACK_STATS: TestStats = {
  engine: 56,
  api: 100,
  web: 154,
  e2e: 23,
  durationSec: null,
};

export async function fetchTestStats(): Promise<TestStats> {
  try {
    const response = await fetch('/test-stats.json');
    const parsed = TestStatsSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : FALLBACK_STATS;
  } catch {
    return FALLBACK_STATS;
  }
}
