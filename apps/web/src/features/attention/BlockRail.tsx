import type { BlockDecision, Farm, ScheduleItem } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { cx, Figure, MoistureSwatch } from '@/ui';
import { byRisk } from './risk';
import { SelectedBlockRailDetail } from './SelectedBlockRailDetail';

/**
 * Left rail (Nightfield canvas "Blocks"): every block, riskiest first, with its crop, area,
 * method and water now. The selected block opens to show why: projected PAW, each simulated
 * sensor, tonight's figures and the last 14 days.
 */
export function BlockRail({
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
    <ul className="flex flex-col">
      {byRisk(decisions).map((d) => {
        const open = d.blockId === selectedId;
        const panelId = `rail-${d.blockId}`;
        const block = farm.blocks.find((b) => b.id === d.blockId);
        return (
          <li key={d.blockId} className="border-b border-border last:border-b-0">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => onSelect(d.blockId)}
              className={cx(
                'grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto_14px] items-center gap-3 px-4 py-2.5 text-start hover:bg-surface-raised',
                open
                  ? 'bg-surface-raised shadow-[inset_3px_0_0_var(--color-accent)] rtl:shadow-[inset_-3px_0_0_var(--color-accent)]'
                  : '',
              )}
            >
              <MoistureSwatch paw={d.pawNow} size={18} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">
                  <span className="num">{d.blockId}</span> · {block?.name[locale] ?? d.blockId}
                </span>
                {block ? (
                  <span className="truncate text-xs text-text-muted">
                    {[
                      t(`block.crop.${block.crop}`),
                      t('block.area', { ha: block.areaHa }),
                      t(`block.method.${block.method}`),
                    ].join(' · ')}
                  </span>
                ) : null}
              </span>
              {d.pawNow === null ? (
                <span className="text-xs text-text-secondary">{t('state.noData')}</span>
              ) : (
                <Figure value={d.pawNow} unit="%" size="sm" accent={d.pawNow < d.threshold} />
              )}
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                aria-hidden="true"
                className={cx('text-text-muted', open ? 'rotate-180' : '')}
              >
                <path
                  d="M3.5 6L8 10.5 12.5 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {open ? (
              <SelectedBlockRailDetail
                id={panelId}
                decision={d}
                sensors={farm.sensors.filter((s) => s.blockId === d.blockId)}
                schedule={schedule}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
