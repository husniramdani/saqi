import type { BlockDecision, Farm, ScheduleItem } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useLocale } from '@/i18n';
import { captureBlock } from '@/motion';
import { buttonClasses, Chip, cx, DECISION_CHIP, Figure, MoistureSwatch, PillArrow } from '@/ui';
import { windowLabel } from '@/features/farm-map/window';
import { byRisk } from './risk';

/**
 * Left rail (Nightfield canvas "Blocks"): every block, riskiest first, with water now. The
 * selected block opens to show why: projected PAW, tonight's crop use, threshold and target.
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
  const name = (id: string) => farm.blocks.find((b) => b.id === id)?.name[locale] ?? id;

  return (
    <ul className="flex flex-col">
      {byRisk(decisions).map((d) => {
        const open = d.blockId === selectedId;
        const panelId = `rail-${d.blockId}`;
        const window = windowLabel(d.blockId, schedule, locale);
        return (
          <li key={d.blockId} className="border-b border-border last:border-b-0">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => onSelect(d.blockId)}
              className={cx(
                'grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-start',
                open
                  ? 'bg-surface-raised shadow-[inset_3px_0_0_var(--color-accent)] rtl:shadow-[inset_-3px_0_0_var(--color-accent)]'
                  : '',
              )}
            >
              <MoistureSwatch paw={d.pawNow} size={18} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">
                  <span className="num">{d.blockId}</span> · {name(d.blockId)}
                </span>
                <span className="truncate text-xs text-text-muted">
                  {t(`decision.${d.decision}`)}
                  {window ? (
                    <>
                      {' · '}
                      <span className="num">{window}</span>
                    </>
                  ) : null}
                </span>
              </span>
              {d.pawNow === null ? (
                <span className="text-xs text-text-muted">{t('state.noData')}</span>
              ) : (
                <Figure value={d.pawNow} unit="%" size="sm" />
              )}
            </button>
            {open ? (
              <div id={panelId} className="flex flex-col gap-4 bg-surface-raised px-4 pt-1 pb-4">
                <dl className="grid grid-cols-2 gap-3">
                  {[
                    [
                      t('today.projected'),
                      d.pawProjected,
                      '%',
                      d.pawProjected !== null && d.pawProjected < d.threshold,
                    ],
                    [t('today.et0Tomorrow'), d.et0Mm, 'mm', false],
                    [t('today.cropUse'), d.etcMm, 'mm', false],
                    [t('today.threshold'), d.threshold, '%', false],
                    [t('today.target'), d.target, '%', false],
                    [t('today.columns.volume'), d.volumeM3, 'm³', d.volumeM3 > 0],
                  ].map(([label, value, unit, accent]) => (
                    <div key={String(label)} className="flex flex-col gap-1">
                      <dt className="text-xs font-medium text-text-muted">{label}</dt>
                      <dd>
                        {value === null ? (
                          <span className="text-sm text-text-muted">{t('state.noData')}</span>
                        ) : (
                          <Figure
                            value={Number(value)}
                            unit={String(unit)}
                            size="sm"
                            accent={Boolean(accent)}
                          />
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center justify-between gap-3">
                  <Chip variant={DECISION_CHIP[d.decision]}>{t(`decision.${d.decision}`)}</Chip>
                  <Link
                    to={`/blocks/${d.blockId}`}
                    onClick={() => captureBlock(d.blockId)}
                    className={buttonClasses({ variant: 'ink', arrow: true })}
                  >
                    {t('today.openBlock', { code: d.blockId })} <PillArrow variant="ink" />
                  </Link>
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
