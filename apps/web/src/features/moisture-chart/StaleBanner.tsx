import type { SensorSeries } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatTimeGst } from '@/i18n/format';
import { Chip } from '@/ui';

/** "60 cm sensor offline since 12:00 GST…": stale sensors say so beside their chart. */
export function StaleBanner({ series }: { series: SensorSeries[] }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const stale = series.filter((s) => s.stale);
  if (stale.length === 0) return null;
  const depth = (s: SensorSeries) =>
    s.depthCm === null ? t('block.chart.substrate') : `${s.depthCm} cm`;
  const fresh = series.find((s) => !s.stale);
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-md bg-warning-soft p-3 text-sm text-text-primary"
    >
      <Chip variant="warn">{t('map.stale')}</Chip>
      <p className="pt-0.5">
        {fresh
          ? stale
              .map((s) =>
                t('block.staleBanner', {
                  sensor: depth(s),
                  since: formatTimeGst(s.lastAt, locale),
                  fresh: depth(fresh),
                }),
              )
              .join(' ')
          : t('block.allStale')}
      </p>
    </div>
  );
}
