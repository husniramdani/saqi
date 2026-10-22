import { tawMm, type Block, type BlockDecision, type Reason } from '@saqi/shared';
import { round1, round10 } from './round';
import type { BlockPawInfo } from './types';

export const PULSES_PER_DAY = 3;
// Tolerate float noise so "projected exactly at threshold" stays a skip (≥ is safe).
const EPSILON = 1e-9;

/** 1 mm over 1 ha is 10 m³; only the wetted share of the block gets water. */
const toM3 = (grossMm: number, block: Block) => grossMm * block.areaHa * 10 * block.wettedFraction;

/**
 * One block's decision before the budget guard and scheduling (plan/04 §2, §2.2).
 * Reasons are codes + rounded numbers; the web renders them per locale.
 */
export function decideBlock(block: Block, pawInfo: BlockPawInfo, et0Mm: number): BlockDecision {
  const taw = tawMm(block);
  const etcMm = block.kc * et0Mm * block.et0Factor;
  const { paw } = pawInfo;

  const staleReasons: Reason[] = pawInfo.staleSensors.map((s) => ({
    code: 'SENSOR_STALE',
    params: { sensorId: s.sensorId, hours: s.hours },
  }));
  const base = {
    blockId: block.id,
    threshold: block.pawThreshold,
    target: block.pawTarget,
    et0Mm: round1(et0Mm),
    etcMm: round1(etcMm),
    confidence: pawInfo.confidence,
  };

  if (paw === null) {
    return {
      ...base,
      decision: 'skip',
      pawNow: null,
      pawProjected: null,
      netMm: 0,
      grossMm: 0,
      volumeM3: 0,
      litresPerTree: block.trees === null ? null : 0,
      savedVsFixedM3: 0,
      reasons: [...staleReasons, { code: 'LOW_CONFIDENCE', params: {} }],
    };
  }

  const projected = paw - (etcMm / taw) * 100;
  const head: Reason[] = [
    { code: 'PAW_NOW', params: { paw: round1(paw) } },
    { code: 'ET0_FORECAST', params: { mm: round1(et0Mm) } },
    {
      code: 'PAW_PROJECTED',
      params: { from: round1(paw), to: round1(projected), etcMm: round1(etcMm) },
    },
  ];
  const refill = (from: number) => (Math.max(0, block.pawTarget - from) / 100) * taw;
  const result = (
    decision: BlockDecision['decision'],
    netMm: number,
    savedVsFixedM3: number,
    reasons: Reason[],
  ): BlockDecision => {
    const grossMm = netMm / block.efficiency;
    const volume = toM3(grossMm, block);
    return {
      ...base,
      decision,
      pawNow: round1(paw),
      pawProjected: round1(projected),
      netMm: round1(netMm),
      grossMm: round1(grossMm),
      volumeM3: round1(volume),
      litresPerTree: block.trees === null ? null : round10((volume * 1000) / block.trees),
      savedVsFixedM3: round1(savedVsFixedM3),
      reasons: [...head, ...reasons, ...staleReasons],
    };
  };

  if (block.mode === 'pulse') {
    // Replace tomorrow's crop use, plus a refill if the substrate is already below threshold.
    const refillMm = paw < block.pawThreshold ? refill(paw) : 0;
    const netMm = etcMm + refillMm;
    const pulseM3 = toM3(netMm / block.efficiency, block) / PULSES_PER_DAY;
    const refillReason: Reason[] =
      refillMm > 0
        ? [
            {
              code: 'REFILL_TO_TARGET',
              params: {
                target: block.pawTarget,
                netMm: round1(refillMm),
                grossMm: round1(refillMm / block.efficiency),
              },
            },
          ]
        : [];
    return result('pulse', netMm, 0, [
      ...refillReason,
      { code: 'GREENHOUSE_PULSES', params: { count: PULSES_PER_DAY, m3: round1(pulseM3) } },
    ]);
  }

  if (projected < block.pawThreshold - EPSILON) {
    const netMm = refill(projected);
    return result('irrigate', netMm, 0, [
      { code: 'BELOW_THRESHOLD', params: { threshold: block.pawThreshold } },
      {
        code: 'REFILL_TO_TARGET',
        params: {
          target: block.pawTarget,
          netMm: round1(netMm),
          grossMm: round1(netMm / block.efficiency),
        },
      },
    ]);
  }

  return result('skip', 0, block.fixedScheduleM3Day, [
    { code: 'ABOVE_THRESHOLD', params: { threshold: block.pawThreshold } },
    { code: 'SAVES_VS_FIXED', params: { m3: round1(block.fixedScheduleM3Day) } },
  ]);
}
