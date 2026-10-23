import type { BlockDecision, Farm, ScheduleItem } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { Chip, DECISION_CHIP, Figure, MoistureSwatch, StaleTag } from '@/ui';
import { isStale } from './geometry';
import { windowLabel } from './window';

const th = 'border-b border-border py-2 pe-4 text-start text-xs font-medium text-text-muted';
const td = 'border-b border-border py-2.5 pe-4 align-middle';

/** The map's full text alternative: every block with every figure (design.md, CLAUDE.md §8). */
export function BlockList({
  farm,
  decisions,
  schedule,
  onSelect,
}: {
  farm: Farm;
  decisions: BlockDecision[];
  schedule: ScheduleItem[];
  onSelect: (blockId: string) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th scope="col" className={th}>
              {t('today.columns.block')}
            </th>
            <th scope="col" className={th}>
              {t('today.columns.paw')}
            </th>
            <th scope="col" className={th}>
              {t('today.columns.decision')}
            </th>
            <th scope="col" className={th}>
              {t('today.columns.volume')}
            </th>
            <th scope="col" className={th}>
              {t('map.window')}
            </th>
            <th scope="col" className={th}>
              {t('today.columns.confidence')}
            </th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => {
            const block = farm.blocks.find((b) => b.id === d.blockId);
            const hours = d.reasons.find((r) => r.code === 'SENSOR_STALE')?.params['hours'];
            return (
              <tr key={d.blockId}>
                <th scope="row" className={`${td} text-start font-normal`}>
                  <button
                    type="button"
                    onClick={() => onSelect(d.blockId)}
                    className="inline-flex min-h-11 items-center gap-2.5 text-start text-text-primary underline decoration-border-strong underline-offset-4"
                  >
                    <span className="num font-medium">{d.blockId}</span>
                    <span>{block?.name[locale]}</span>
                  </button>
                </th>
                <td className={td}>
                  {d.pawNow === null ? (
                    <span className="text-text-secondary">{t('state.noData')}</span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <MoistureSwatch paw={d.pawNow} />
                      <Figure value={d.pawNow} unit="%" size="sm" />
                    </span>
                  )}
                </td>
                <td className={td}>
                  <Chip variant={DECISION_CHIP[d.decision]}>{t(`decision.${d.decision}`)}</Chip>
                </td>
                <td className={td}>
                  <Figure value={d.volumeM3} unit="m³" size="sm" />
                </td>
                <td className={`${td} num text-sm text-text-secondary`}>
                  {windowLabel(d.blockId, schedule, locale) ?? '–'}
                </td>
                <td className={td}>
                  {isStale(d) && typeof hours === 'number' ? (
                    <StaleTag hours={hours} />
                  ) : (
                    <span className="text-text-secondary">{t(`confidence.${d.confidence}`)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
