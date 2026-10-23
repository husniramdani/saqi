import type { BlockDecision, Farm, ScheduleItem } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { isStale } from '@/features/farm-map/geometry';
import { useLocale } from '@/i18n';
import { formatM3, formatNumber, formatTimeGst } from '@/i18n/format';
import { byRisk } from './risk';

const DECISION_CHIP: Record<BlockDecision['decision'], string> = {
  irrigate: 'chip solid',
  deficit: 'chip solid',
  skip: 'chip ok',
  pulse: 'chip',
};

/**
 * Decision rows (design/dashboard.html `.drow`): code, name, when it gets water, the decision and
 * what it costs or saves; selected = raised with an orange edge. A skip made without a fresh
 * sensor asks for the sensor to be checked.
 */
export function DecisionList({
  farm,
  decisions,
  schedule,
  selectedId,
  onSelect,
}: {
  farm: Farm;
  decisions: BlockDecision[];
  schedule: ScheduleItem[];
  selectedId?: string | null | undefined;
  onSelect: (blockId: string) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const clock = (iso: string) => formatTimeGst(iso, locale).replace(' GST', '');

  const when = (d: BlockDecision) => {
    const items = schedule.filter((i) => i.blockId === d.blockId);
    const night = items.find((i) => i.kind === 'night');
    if (night) return `${clock(night.start)} → ${clock(night.end)}`;
    const stale = d.reasons.find((r) => r.code === 'SENSOR_STALE')?.params;
    if (stale) {
      const sensor = farm.sensors.find((s) => s.id === stale['sensorId']);
      return t('today.row.offline', {
        // Isolated (LRI…PDI) so "60 cm" keeps its order inside Arabic and Urdu sentences.
        depth:
          sensor?.depthCm === null || !sensor
            ? t('rail.substrateSensor')
            : `\u2066${sensor.depthCm} cm\u2069`,
        hours: stale['hours'],
      });
    }
    const pulses = items.filter((i) => i.kind === 'pulse');
    if (pulses.length > 0)
      return t('today.row.pulses', {
        hours: pulses.map((p) => clock(p.start).slice(0, 2)).join(' · '),
      });
    return t('today.row.none');
  };

  const cost = (d: BlockDecision) => {
    if (d.volumeM3 === 0) {
      const m3 = formatNumber(d.savedVsFixedM3, locale, 0);
      return isStale(d) ? t('today.row.skipSaves', { m3 }) : t('today.row.saves', { m3 });
    }
    const factor = d.reasons.find((r) => r.code === 'BUDGET_DEFICIT')?.params['factor'];
    const volume = formatM3(d.volumeM3, locale);
    // A figure reads left to right in every locale (LRI…PDI), like the app's `num` runs.
    return `\u2066${
      typeof factor === 'number' ? `${volume} · ${formatNumber(factor * 100, locale, 0)}%` : volume
    }\u2069`;
  };

  return (
    <ul>
      {byRisk(decisions).map((d) => {
        const check = isStale(d) && d.volumeM3 === 0;
        return (
          <li key={d.blockId}>
            <button
              type="button"
              className="drow"
              aria-pressed={d.blockId === selectedId}
              onClick={() => onSelect(d.blockId)}
            >
              <span className="code">{d.blockId}</span>
              <span className="drow-n">
                <span>{farm.blocks.find((b) => b.id === d.blockId)?.name[locale]}</span>
                <small>{when(d)}</small>
              </span>
              <span className="r">
                <span className={check ? 'chip warn' : DECISION_CHIP[d.decision]}>
                  {check ? t('today.row.checkSensor') : t(`decision.${d.decision}`)}
                </span>
                <small>{cost(d)}</small>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
