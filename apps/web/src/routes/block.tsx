import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { useEvents, useFarm, useReadings, useRecommendation } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';
import { formatM3, formatNumber } from '@/i18n/format';
import { ReasonText } from '@/i18n/ReasonText';

export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { blockId = '' } = useParams();
  const farm = useFarm();
  const recommendation = useRecommendation(blockId);
  const readings = useReadings(blockId, 14);
  const events = useEvents(blockId, 30);
  const block = farm.data?.blocks.find((b) => b.id === blockId);

  const back = (
    <p>
      <Link to="/">← {t('block.back')}</Link>
    </p>
  );
  if (recommendation.error instanceof ApiError && recommendation.error.status === 404) {
    return (
      <>
        {back}
        <h1>{t('block.notFound')}</h1>
      </>
    );
  }

  return (
    <>
      {back}
      <h1>
        {blockId} {block?.name[locale]}
      </h1>
      <QueryState query={recommendation}>
        {(d) => (
          <section aria-labelledby="recommendation">
            <h2 id="recommendation">
              {t('block.recommendation', { decision: t(`decision.${d.decision}`) })}
            </h2>
            <p>
              {formatM3(d.volumeM3, locale)}
              {d.litresPerTree === null
                ? null
                : ` · ${t('block.litresPerTree', { litres: formatNumber(d.litresPerTree, locale, 0) })}`}
            </p>
            <h3>{t('block.why')}</h3>
            {d.reasons.length === 0 ? (
              <p>{t('block.noReasons')}</p>
            ) : (
              <ol>
                {d.reasons.map((r, i) => (
                  <li key={`${r.code}-${i}`}>
                    <ReasonText reason={r} />
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </QueryState>
      <QueryState query={readings}>
        {(series) => <p>{t('block.readings', { count: series.length })}</p>}
      </QueryState>
      <QueryState query={events}>
        {(list) => <p>{t('block.events', { count: list.length })}</p>}
      </QueryState>
    </>
  );
}
