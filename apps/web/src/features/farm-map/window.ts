import type { Locale, ScheduleItem } from '@saqi/shared';
import { formatTimeGst, formatTimeRangeGst } from '@/i18n/format';

/** When a block gets water: "22:00 → 01:03 GST" tonight, or its pulse times tomorrow. */
export function windowLabel(
  blockId: string,
  schedule: ScheduleItem[],
  locale: Locale,
): string | null {
  const items = schedule.filter((i) => i.blockId === blockId);
  const night = items.find((i) => i.kind === 'night');
  if (night) return formatTimeRangeGst(night.start, night.end, locale);
  const pulses = items.filter((i) => i.kind === 'pulse');
  if (pulses.length === 0) return null;
  return `${pulses.map((p) => formatTimeGst(p.start, locale).replace(' GST', '')).join(' · ')} GST`;
}
