import {
  blockById,
  type BlockDecision,
  type Farm,
  type Reason,
  type ScheduleItem,
} from '@saqi/shared';
import { round1, round10 } from './round';
import { addDays, gstHhmm, gstMs, HOUR_MS, toGstIso } from './time';

interface Run {
  start: number;
  end: number;
  flow: number;
}

/** Summed flow of runs active at instant `at` (end-exclusive). */
const loadAt = (runs: Run[], at: number) =>
  runs.reduce((sum, r) => (r.start <= at && at < r.end ? sum + r.flow : sum), 0);

/**
 * Earliest start ≥ `from` where this run fits under the pump capacity for its whole duration.
 * Load only changes when a run starts, so checking the start and every later run start inside
 * the interval is exact. Candidates are the window start and each placed run's end; the last
 * end always fits, so the search terminates.
 */
function earliestStart(runs: Run[], from: number, durMs: number, flow: number, capacity: number) {
  const candidates = [from, ...runs.map((r) => r.end)]
    .filter((t) => t >= from)
    .sort((a, b) => a - b);
  for (const t of candidates) {
    const checkpoints = [t, ...runs.map((r) => r.start).filter((s) => s > t && s < t + durMs)];
    // A block whose flow alone exceeds the pump still runs, just never alongside another.
    if (checkpoints.every((x) => loadAt(runs, x) === 0 || loadAt(runs, x) + flow <= capacity))
      return t;
  }
  return Math.max(from, ...runs.map((r) => r.end));
}

const isNightRun = (d: BlockDecision) =>
  (d.decision === 'irrigate' || d.decision === 'deficit') && d.volumeM3 > 0;

/**
 * Tonight's night-window runs plus tomorrow's greenhouse pulses (plan/04 §2.4).
 * Greedy list scheduling: priority first (1 = protect first), then the driest projected PAW.
 * Returns the items and the decisions with WINDOW_* reasons added; nothing is mutated.
 */
export function schedule(
  decisions: BlockDecision[],
  farm: Farm,
  date: string,
): { items: ScheduleItem[]; decisions: BlockDecision[] } {
  const windowStart = gstMs(date, farm.nightWindow.start);
  const sameDayEnd = gstMs(date, farm.nightWindow.end);
  const windowEnd =
    sameDayEnd > windowStart ? sameDayEnd : gstMs(addDays(date, 1), farm.nightWindow.end);

  const queue = decisions
    .filter(isNightRun)
    .sort(
      (a, b) =>
        blockById(farm, a.blockId).priority - blockById(farm, b.blockId).priority ||
        (a.pawProjected ?? 0) - (b.pawProjected ?? 0),
    );

  const runs: Run[] = [];
  const items: ScheduleItem[] = [];
  const updated = new Map<string, BlockDecision>();

  for (const d of queue) {
    const block = blockById(farm, d.blockId);
    const durMs = (d.volumeM3 / block.flowM3h) * HOUR_MS;
    const start = earliestStart(runs, windowStart, durMs, block.flowM3h, farm.pumpCapacityM3h);
    const overflow = start + durMs > windowEnd;
    const end = overflow ? Math.max(start, windowEnd) : start + durMs;
    const volumeM3 = overflow ? round1(((end - start) / HOUR_MS) * block.flowM3h) : d.volumeM3;

    const reason: Reason = overflow
      ? { code: 'WINDOW_OVERFLOW', params: { cutM3: round1(d.volumeM3 - volumeM3) } }
      : { code: 'WINDOW_ASSIGNED', params: { start: gstHhmm(start), end: gstHhmm(end) } };
    updated.set(d.blockId, {
      ...d,
      volumeM3,
      litresPerTree:
        overflow && block.trees !== null
          ? round10((volumeM3 * 1000) / block.trees)
          : d.litresPerTree,
      reasons: [...d.reasons, reason],
    });

    if (volumeM3 > 0) {
      runs.push({ start, end, flow: block.flowM3h });
      items.push({
        blockId: d.blockId,
        kind: 'night',
        start: toGstIso(start),
        end: toGstIso(end),
        volumeM3,
      });
    }
  }

  // Greenhouse pulses tomorrow at fixed times; they don't compete with the night window.
  const tomorrow = addDays(date, 1);
  for (const d of decisions) {
    if (d.decision !== 'pulse' || d.volumeM3 <= 0) continue;
    const block = blockById(farm, d.blockId);
    const pulseM3 = d.volumeM3 / farm.pulseTimes.length;
    for (const time of farm.pulseTimes) {
      const start = gstMs(tomorrow, time);
      items.push({
        blockId: d.blockId,
        kind: 'pulse',
        start: toGstIso(start),
        end: toGstIso(start + (pulseM3 / block.flowM3h) * HOUR_MS),
        volumeM3: round1(pulseM3),
      });
    }
  }

  return { items, decisions: decisions.map((d) => updated.get(d.blockId) ?? d) };
}
