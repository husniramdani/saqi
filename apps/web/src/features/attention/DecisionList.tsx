import type { BlockDecision, Farm, ScheduleItem } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatM3 } from '@/i18n/format';
import { Chip, cx, DECISION_CHIP, StaleTag } from '@/ui';
import { windowLabel } from '@/features/farm-map/window';
import { byRisk } from './risk';

/** Decision rows (Nightfield "Decision row"): code, name, window, chip and volume; selected = raised + orange edge. */
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
  selectedId?: string | undefined;
  onSelect: (blockId: string) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <ul className="flex flex-col gap-1">
      {byRisk(decisions).map((d) => {
        const on = d.blockId === selectedId;
        const hours = d.reasons.find((r) => r.code === 'SENSOR_STALE')?.params['hours'];
        const window = windowLabel(d.blockId, schedule, locale);
        return (
          <li key={d.blockId}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(d.blockId)}
              className={cx(
                'grid min-h-14 w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-3 py-2.5 text-start',
                on
                  ? 'bg-surface-raised shadow-[inset_3px_0_0_var(--color-accent)] rtl:shadow-[inset_-3px_0_0_var(--color-accent)]'
                  : 'hover:bg-surface-raised',
              )}
            >
              <span className="num text-sm font-medium">{d.blockId}</span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">
                  {farm.blocks.find((b) => b.id === d.blockId)?.name[locale]}
                </span>
                <span className="num truncate text-xs text-text-secondary">{window ?? '–'}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <Chip variant={DECISION_CHIP[d.decision]}>{t(`decision.${d.decision}`)}</Chip>
                {typeof hours === 'number' ? (
                  <StaleTag hours={hours} />
                ) : (
                  <span className="num text-xs text-text-secondary">
                    {formatM3(d.volumeM3, locale)}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
