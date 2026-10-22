import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { useEvents, useFarm, useReadings, useRecommendation } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';
import { ReasonText } from '@/i18n/ReasonText';
import {
  Arrow,
  Chip,
  DECISION_CHIP,
  EmptyState,
  Figure,
  MoistureSwatch,
  Panel,
  textLinkClasses,
} from '@/ui';

// TODO(T14): moisture chart, events table, tasks and the manual irrigation log.
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
    <Link to="/" className={`${textLinkClasses} gap-2`}>
      <span className="-scale-x-100 rtl:scale-x-100">
        <Arrow size={14} />
      </span>
      {t('block.back')}
    </Link>
  );

  if (recommendation.error instanceof ApiError && recommendation.error.status === 404) {
    return (
      <div className="flex flex-col items-start gap-6 pt-6">
        {back}
        <EmptyState title={t('block.notFound')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-6">
      {back}
      <div className="flex flex-wrap items-center gap-4">
        <MoistureSwatch paw={recommendation.data?.pawNow ?? null} size={28} />
        <h1 className="flex items-baseline gap-3 text-3xl font-light tracking-[-0.035em] sm:text-4xl">
          <span className="num font-normal">{blockId}</span>
          <span>{block?.name[locale]}</span>
        </h1>
      </div>
      {block ? (
        <p className="text-text-secondary">
          {block.variety} · <span className="num">{block.areaHa} ha</span>
          {block.trees ? <> · {t('block.trees', { count: block.trees })}</> : null}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <QueryState query={recommendation}>
          {(d) => (
            <Panel
              title={t('block.recommendation', { decision: t(`decision.${d.decision}`) })}
              actions={
                <Chip variant={DECISION_CHIP[d.decision]}>{t(`decision.${d.decision}`)}</Chip>
              }
            >
              <div className="flex flex-wrap items-end gap-6 pb-5">
                <Figure value={d.volumeM3} unit="m³" size="lg" accent={d.volumeM3 > 0} />
                {d.litresPerTree === null ? null : (
                  <Figure value={d.litresPerTree} unit="L/tree" precision={0} size="md" />
                )}
              </div>
              <h3 className="pb-2 text-xs font-medium text-text-muted">{t('block.why')}</h3>
              {d.reasons.length === 0 ? (
                <p className="text-text-secondary">{t('block.noReasons')}</p>
              ) : (
                <ol className="flex flex-col">
                  {d.reasons.map((r, i) => (
                    <li
                      key={`${r.code}-${i}`}
                      data-reason
                      className="border-t border-border py-2.5"
                    >
                      <ReasonText reason={r} />
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          )}
        </QueryState>
        <Panel title={t('block.sensorSeries')}>
          <dl className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <dt className="text-xs font-medium text-text-muted">{t('block.sensorSeries')}</dt>
              <dd className="num text-2xl">{readings.data?.length ?? '–'}</dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="text-xs font-medium text-text-muted">{t('block.irrigationEvents')}</dt>
              <dd className="num text-2xl">{events.data?.length ?? '–'}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
