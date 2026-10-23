import type { BlockDecision } from '@saqi/shared';

/** Needs a person tonight: water goes out, or the engine decided without a fresh sensor. */
export const needsAttention = (d: BlockDecision) =>
  d.decision === 'irrigate' || d.decision === 'deficit' || d.confidence === 'low';

const rank = (d: BlockDecision) =>
  d.decision === 'irrigate' ? 0 : d.decision === 'deficit' ? 1 : d.confidence === 'low' ? 2 : 3;

/**
 * Riskiest first (design/dashboard.html: D-1, F-1, D-3, D-4, G-1, D-2, G-2): full irrigation,
 * then budget-cut deficit runs, then decisions made without a fresh sensor, then everything
 * else; within each, the driest water now first (no reading sorts last).
 */
export const byRisk = (decisions: BlockDecision[]) =>
  [...decisions].sort(
    (a, b) => rank(a) - rank(b) || (a.pawNow ?? Infinity) - (b.pawNow ?? Infinity),
  );
