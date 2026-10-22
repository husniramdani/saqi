import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useFarm, usePlanToday } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';
import { formatM3, formatPct } from '@/i18n/format';

export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const plan = usePlanToday();
  const farm = useFarm();
  const nameOf = (id: string) => farm.data?.blocks.find((b) => b.id === id)?.name[locale];

  return (
    <>
      <h1>{t('today.title')}</h1>
      <QueryState
        query={plan}
        isEmpty={(p) => p.decisions.length === 0}
        emptyText={t('today.empty')}
      >
        {(p) => (
          <>
            <p>
              {t('today.planned', { volume: formatM3(p.totals.tonightM3, locale) })} ·{' '}
              {t('today.saved', { volume: formatM3(p.totals.savedVsFixedM3, locale) })}
            </p>
            <table>
              <caption>{t('today.decisions', { date: p.date })}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('today.columns.block')}</th>
                  <th scope="col">{t('today.columns.decision')}</th>
                  <th scope="col">{t('today.columns.paw')}</th>
                  <th scope="col">{t('today.columns.volume')}</th>
                  <th scope="col">{t('today.columns.confidence')}</th>
                </tr>
              </thead>
              <tbody>
                {p.decisions.map((d) => (
                  <tr key={d.blockId}>
                    <th scope="row">
                      <Link to={`/blocks/${d.blockId}`}>{d.blockId}</Link> {nameOf(d.blockId)}
                    </th>
                    <td>{t(`decision.${d.decision}`)}</td>
                    <td>{d.pawNow === null ? t('state.noData') : formatPct(d.pawNow, locale)}</td>
                    <td>{formatM3(d.volumeM3, locale)}</td>
                    <td>{t(`confidence.${d.confidence}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </QueryState>
    </>
  );
}
