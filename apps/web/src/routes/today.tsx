import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useFarm, usePlanToday } from '@/api/queries';
import { PageHeader } from '@/app/PageHeader';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';
import { formatDateGst } from '@/i18n/format';
import { Chip, DECISION_CHIP, Figure, MoistureSwatch, Panel, Skeleton, Stat } from '@/ui';

const th = 'border-b border-border py-2 pe-4 text-start text-xs font-medium text-text-muted';
const td = 'border-b border-border py-3 pe-4 align-middle';

// TODO(T12/T13): the farm map and schedule cockpit; this table becomes the map's list view.
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const plan = usePlanToday();
  const farm = useFarm();
  const nameOf = (id: string) => farm.data?.blocks.find((b) => b.id === id)?.name[locale];

  return (
    <QueryState
      query={plan}
      isEmpty={(p) => p.decisions.length === 0}
      emptyText={t('today.empty')}
      skeleton={
        <div className="flex flex-col gap-6 pt-6">
          <Skeleton block={56} inline="40%" />
          <Skeleton block={360} />
        </div>
      }
    >
      {(p) => (
        <>
          <PageHeader title={t('today.title', { date: formatDateGst(p.date, locale) })}>
            <Stat
              label={t('today.plannedTonight')}
              value={p.totals.tonightM3}
              unit="m³"
              size="lg"
              accent
            />
            <Stat
              label={t('today.savedVsFixed')}
              value={p.totals.savedVsFixedM3}
              unit="m³"
              precision={0}
              size="lg"
            />
          </PageHeader>
          <Panel title={t('today.decisions', { date: formatDateGst(p.date, locale) })}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className={th}>
                      {t('today.columns.block')}
                    </th>
                    <th scope="col" className={th}>
                      {t('today.columns.decision')}
                    </th>
                    <th scope="col" className={th}>
                      {t('today.columns.paw')}
                    </th>
                    <th scope="col" className={th}>
                      {t('today.columns.volume')}
                    </th>
                    <th scope="col" className={th}>
                      {t('today.columns.confidence')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {p.decisions.map((d) => (
                    <tr key={d.blockId}>
                      <th scope="row" className={`${td} text-start font-normal`}>
                        <Link
                          to={`/blocks/${d.blockId}`}
                          className="inline-flex min-h-11 items-center gap-2.5 text-text-primary"
                        >
                          <span className="num font-medium">{d.blockId}</span>
                          <span>{nameOf(d.blockId)}</span>
                        </Link>
                      </th>
                      <td className={td}>
                        <Chip variant={DECISION_CHIP[d.decision]}>
                          {t(`decision.${d.decision}`)}
                        </Chip>
                      </td>
                      <td className={td}>
                        {d.pawNow === null ? (
                          <span className="text-text-muted">{t('state.noData')}</span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <MoistureSwatch paw={d.pawNow} />
                            <Figure value={d.pawNow} unit="%" size="sm" />
                          </span>
                        )}
                      </td>
                      <td className={td}>
                        <Figure value={d.volumeM3} unit="m³" size="sm" />
                      </td>
                      <td className={td}>
                        {d.confidence === 'low' ? (
                          <Chip variant="warn">{t(`confidence.${d.confidence}`)}</Chip>
                        ) : (
                          <span className="text-text-secondary">
                            {t(`confidence.${d.confidence}`)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </QueryState>
  );
}
