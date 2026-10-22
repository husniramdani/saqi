import type { BlockDecision } from '@saqi/shared';

/** Needs a person tonight: water goes out, or the engine decided without a fresh sensor. */
export const needsAttention = (d: BlockDecision) =>
  d.decision === 'irrigate' || d.decision === 'deficit' || d.confidence === 'low';

const rank = (d: BlockDecision) =>
  d.decision === 'irrigate' || d.decision === 'deficit'
    ? 0
    : d.confidence === 'low'
      ? 1
      : d.decision === 'pulse'
        ? 2
        : 3;

/** Riskiest first: tonight's water, then unreliable sensors, then pulses, then skips; drier first within each. */
export const byRisk = (decisions: BlockDecision[]) =>
  [...decisions].sort(
    (a, b) =>
      rank(a) - rank(b) || (a.pawProjected ?? a.pawNow ?? 0) - (b.pawProjected ?? b.pawNow ?? 0),
  );
