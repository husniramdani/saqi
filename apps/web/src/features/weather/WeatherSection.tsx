import type { Weather } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatNumber, formatTimeGst, intlLocale } from '@/i18n/format';
import { cx } from '@/ui';

/** design/dashboard.html's ET₀ plot: stems on a 210 × 80 box, 30 units apart, 74 → 30–50. */
const BASE = 74;
const LOW = 50;
const HIGH = 30;

/**
 * The Water tab's forecast sections (design/dashboard.html `.sect`): ET₀ for the next seven days
 * (tomorrow drives tonight, so it carries the orange), the weather now, and where data comes from.
 */
export function WeatherSection({ weather }: { weather: Weather }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const days = weather.daily.slice(0, 7);
  const values = days.map((d) => d.et0Mm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat week sits mid-plot rather than on its floor.
  const y = (v: number) => (max > min ? LOW - ((v - min) / (max - min)) * (LOW - HIGH) : 40);
  const weekday = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    timeZone: 'UTC',
  });
  const tomorrow = days[1] ?? days[0];

  return (
    <>
      <section className="sect">
        <div className="sect-h">
          <h3 className="lbl">{t('today.et0Week')}</h3>
          <span className="chip">Open-Meteo</span>
        </div>
        {days.length === 0 ? (
          <p>{t('today.forecastEmpty')}</p>
        ) : (
          <>
            <svg
              viewBox="0 0 210 80"
              width="100%"
              role="img"
              aria-label={t('today.et0Label', {
                min: formatNumber(min, locale),
                max: formatNumber(max, locale),
                tomorrow: formatNumber(tomorrow?.et0Mm ?? 0, locale),
              })}
            >
              {days.map((d, i) => {
                const x = 15 + i * 30;
                const em = d === tomorrow;
                return (
                  <g key={d.date}>
                    <line x1={x} y1={BASE} x2={x} y2={y(d.et0Mm)} className="et-stem" />
                    <circle
                      cx={x}
                      cy={y(d.et0Mm)}
                      r={em ? 5 : 4}
                      className={cx('et-dot', em && 'em')}
                    />
                  </g>
                );
              })}
            </svg>
            <div aria-hidden="true" className="ruler">
              {days.map((d) => (
                <span key={d.date}>{weekday.format(new Date(`${d.date}T00:00:00Z`))}</span>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="sect">
        <div className="sect-h">
          <h3 className="lbl">{t('today.weatherNow')}</h3>
          <span aria-hidden="true" className={cx('dot', weather.stale ? 'off' : 'live')} />
        </div>
        <dl className="wx">
          {[
            { label: t('today.air'), value: weather.current.tempC, unit: '°C' },
            { label: t('today.humidity'), value: weather.current.humidityPct, unit: '%' },
            { label: t('today.wind'), value: weather.current.windKmh, unit: 'km/h' },
          ].map((m) => (
            <div key={m.label}>
              <dt className="lbl">{m.label}</dt>
              <dd className="num">
                {formatNumber(m.value, locale, 0)}
                <i>{m.unit}</i>
              </dd>
            </div>
          ))}
        </dl>
        {weather.stale ? (
          <p>{t('today.weatherStale', { time: formatTimeGst(weather.fetchedAt, locale) })}</p>
        ) : null}
      </section>

      <section className="sect">
        <h3 className="lbl">{t('today.sources')}</h3>
        <span className="src">
          <span aria-hidden="true" className={cx('dot', weather.stale ? 'off' : 'live')} />
          {t('today.sourceWeather')}
        </span>
        <span className="src">
          <span aria-hidden="true" className="dot sim" />
          {t('today.sourceSensors')}
        </span>
      </section>
    </>
  );
}
