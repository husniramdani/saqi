import type { Weather } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatNumber, formatTimeGst, intlLocale } from '@/i18n/format';
import { Chip, Figure, SourceDot } from '@/ui';

const W = 280;
const H = 72;

/** ET₀ for the next seven days (tomorrow drives tonight, so it carries the orange) and weather now. */
export function WeatherSection({ weather }: { weather: Weather }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const days = weather.daily.slice(0, 7);
  const max = Math.max(...days.map((d) => d.et0Mm), 1);
  const slot = W / days.length;
  const weekday = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    timeZone: 'UTC',
  });
  const values = days.map((d) => d.et0Mm);
  const tomorrow = days[1] ?? days[0];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-medium text-text-muted">{t('today.et0Week')}</h3>
          <Chip>Open-Meteo</Chip>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H + 18}`}
          className="block h-auto w-full"
          role="img"
          aria-label={t('today.et0Label', {
            min: formatNumber(Math.min(...values), locale),
            max: formatNumber(Math.max(...values), locale),
            tomorrow: formatNumber(tomorrow?.et0Mm ?? 0, locale),
          })}
        >
          {days.map((d, i) => {
            const h = (d.et0Mm / max) * (H - 18);
            const isTomorrow = i === 1;
            return (
              <g key={d.date}>
                <rect
                  x={i * slot + slot * 0.2}
                  y={H - h}
                  width={slot * 0.6}
                  height={h}
                  rx={3}
                  fill={isTomorrow ? 'var(--color-accent)' : 'var(--color-border-strong)'}
                />
                {isTomorrow ? (
                  <text
                    x={i * slot + slot / 2}
                    y={H - h - 6}
                    textAnchor="middle"
                    fontSize={11}
                    className="font-mono"
                    fill="var(--color-accent-text)"
                  >
                    {formatNumber(d.et0Mm, locale)}
                  </text>
                ) : null}
                <text
                  x={i * slot + slot / 2}
                  y={H + 14}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-text-muted)"
                >
                  {weekday.format(new Date(`${d.date}T00:00:00Z`))}
                </text>
              </g>
            );
          })}
        </svg>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-medium text-text-muted">{t('today.weatherNow')}</h3>
        <dl className="grid grid-cols-3 gap-2">
          {[
            [t('today.air'), weather.current.tempC, '°C'],
            [t('today.humidity'), weather.current.humidityPct, '%'],
            [t('today.wind'), weather.current.windKmh, 'km/h'],
          ].map(([label, value, unit]) => (
            <div key={String(label)} className="flex flex-col gap-1.5">
              <dt className="text-xs font-medium text-text-muted">{label}</dt>
              <dd>
                <Figure value={Number(value)} unit={String(unit)} precision={0} size="md" />
              </dd>
            </div>
          ))}
        </dl>
        {weather.stale ? (
          <p className="text-sm text-warning">
            {t('today.weatherStale', { time: formatTimeGst(weather.fetchedAt, locale) })}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2.5">
        <h3 className="text-xs font-medium text-text-muted">{t('today.sources')}</h3>
        <SourceDot source={weather.stale ? 'off' : 'live'}>{t('today.sourceWeather')}</SourceDot>
        <SourceDot source="sim">{t('today.sourceSensors')}</SourceDot>
      </section>
    </div>
  );
}
