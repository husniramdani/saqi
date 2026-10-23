import { blockById, farm07, gstDate, type Weather } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useWeather } from '@/api/queries';
import { useLocale } from '@/i18n';
import { formatNumber, formatTimeGst } from '@/i18n/format';
import { SectionIndex } from './LandingIcons';
import { LANDING_ET0_WEEK, landingScenarios } from './workedExample';

/** The forecast day after the one Open-Meteo was fetched on (GST). */
export function tomorrowOf(weather: Weather) {
  const today = gstDate(weather.fetchedAt);
  return weather.daily.find((day) => day.date > today);
}

export function StatusStrip() {
  const { t } = useTranslation();
  const locale = useLocale();
  const weather = useWeather();
  const data = weather.data;
  const tomorrow = data ? tomorrowOf(data) : undefined;
  return (
    <section className="wrap" aria-label={t('landing.status.label')}>
      <div className="strip" aria-busy={weather.isPending}>
        <span className="strip-tag">{t('landing.status.tag')}</span>
        {weather.isPending ? (
          <span className="strip-item">
            <span className="strip-skel" />
            <span className="sr-only">{t('landing.status.loading')}</span>
          </span>
        ) : weather.isError ? (
          <span className="strip-item" role="alert">
            <span className="dot off" />
            {t('landing.status.error')}
            <button type="button" className="strip-retry" onClick={() => void weather.refetch()}>
              {t('landing.status.retry')}
            </button>
          </span>
        ) : (
          <span className="strip-item">
            <span className={data?.stale ? 'dot off' : 'dot live'} />
            {data?.stale ? t('landing.status.stale') : t('landing.status.live')}
          </span>
        )}
        <span className="strip-item">
          <span className="dot sim" />
          {t('landing.status.simulated')}
        </span>
        {data ? (
          <>
            <span className="strip-item mono">
              {tomorrow
                ? t('landing.status.tomorrow', { mm: formatNumber(tomorrow.et0Mm, locale, 1) })
                : t('landing.status.empty')}
            </span>
            <span className="strip-item mono">
              {t('landing.status.updated', { time: formatTimeGst(data.fetchedAt, locale) })}
            </span>
          </>
        ) : null}
        <a className="strip-link" href="#making-of">
          {t('landing.status.sourceLink')}
        </a>
      </div>
    </section>
  );
}

const RING = 2 * Math.PI * 44;

export function AboutSection() {
  const { t } = useTranslation();
  const locale = useLocale();
  const d1 = landingScenarios.irrigate.decision;
  const paw = d1.pawNow ?? 0;
  const arc = Math.round((RING * paw) / 100);
  const max = Math.max(...LANDING_ET0_WEEK);
  const min = Math.min(...LANDING_ET0_WEEK);
  const [tomorrow] = LANDING_ET0_WEEK;
  return (
    <section className="wrap sec" id="about">
      <div className="about">
        <div className="tile rv">
          <div className="tile-h">
            <span className="lbl micro">{t('landing.about.waterNow')}</span>
            <span className="chip ok mint">{t(`confidence.${d1.confidence}`)}</span>
          </div>
          <svg
            viewBox="0 0 120 120"
            width="100%"
            style={{ maxWidth: 168, alignSelf: 'center' }}
            role="img"
            aria-label={t('landing.about.ringLabel', {
              paw: formatNumber(paw, locale, 1),
              threshold: String(d1.threshold),
              target: String(d1.target),
            })}
          >
            <circle cx="60" cy="60" r="44" className="rg-trk" />
            <circle
              cx="60"
              cy="60"
              r="44"
              className="rg-v ring-draw"
              strokeDasharray={`${arc} ${Math.round(RING)}`}
              data-len={arc}
              transform="rotate(-90 60 60)"
            />
            <line
              x1="60"
              y1="10"
              x2="60"
              y2="22"
              className="rg-tick"
              transform={`rotate(${d1.threshold * 3.6} 60 60)`}
            />
            <line
              x1="60"
              y1="10"
              x2="60"
              y2="22"
              className="rg-tick t"
              transform={`rotate(${d1.target * 3.6} 60 60)`}
            />
            <text x="60" y="62" className="svg-t hi" textAnchor="middle" style={{ fontSize: 22 }}>
              {formatNumber(paw, locale, 1)}
            </text>
            <text x="60" y="80" className="svg-t day-only" textAnchor="middle">
              {t('landing.about.pctWater')}
            </text>
            <text x="60" y="80" className="svg-t night-only" textAnchor="middle">
              % PAW
            </text>
          </svg>
          <div className="row-sb">
            <span className="lbl micro">
              <span className="acc-t ember-t">▮</span>
              {` ${t('landing.about.threshold', { value: String(d1.threshold) })}`}
            </span>
            <span className="lbl micro">
              {`▮ ${t('landing.about.target', { value: String(d1.target) })}`}
            </span>
          </div>
        </div>

        <p className="statement rv">
          {`${t('landing.about.statement.before')} `}
          <em>{t('landing.about.statement.em')}</em>
          {` ${t('landing.about.statement.after')} `}
          <span>{t('landing.about.statement.muted')}</span>
        </p>

        <div className="tile rv">
          <div className="tile-h">
            <span className="lbl micro">{t('landing.about.et0')}</span>
            <span className="chip">{t('landing.sample')}</span>
          </div>
          <svg
            viewBox="0 0 210 100"
            width="100%"
            role="img"
            aria-label={t('landing.about.et0Label', {
              min: formatNumber(min, locale, 1),
              max: formatNumber(max, locale, 1),
              tomorrow: formatNumber(tomorrow, locale, 1),
            })}
          >
            <line x1="0" y1="10" x2="210" y2="10" className="st-grid" />
            <line x1="0" y1="50" x2="210" y2="50" className="st-grid" />
            <line x1="0" y1="90" x2="210" y2="90" className="st-grid" />
            {LANDING_ET0_WEEK.map((mm, index) => {
              const x = 15 + index * 30;
              const y = Math.round(290 - mm * 40);
              return (
                <g key={x}>
                  <line x1={x} y1="90" x2={x} y2={y} className="et-stem draw" />
                  <circle
                    cx={x}
                    cy={y}
                    r={index === 0 ? 5 : 4}
                    className={index === 0 ? 'et-dot em pop' : 'et-dot pop'}
                  />
                </g>
              );
            })}
          </svg>
          <div className="row-sb">
            <span className="num" style={{ fontSize: 30 }}>
              {formatNumber(tomorrow, locale, 1)}
              <i>mm</i>
            </span>
            <span className="lbl micro">{t('landing.tomorrow')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** D-1's two sensors in the worked example; weighted 0.6 / 0.4 they give its 68.0 % PAW. */
const D1_SENSORS = { 30: 70.4, 60: 64.4 } as const;
const FACTS = [
  ['imports', '~90%'],
  ['target', '50%'],
  ['holding', '60–70%'],
] as const;

export function WhySection() {
  const { t } = useTranslation();
  const d1 = landingScenarios.irrigate.decision;
  const weight = (depth: number) =>
    farm07.sensors.find((sensor) => sensor.blockId === 'D-1' && sensor.depthCm === depth)?.weight ??
    0;
  const rootMm = blockById(farm07, 'D-1').rootDepthMm;
  return (
    <section className="wrap" aria-labelledby="why-h">
      <div className="band inv rv">
        <div className="band-a">
          <SectionIndex number="02" label={t('landing.why.eyebrow')} />
          <h2 id="why-h" className="h2" style={{ fontSize: 'clamp(32px, 3.6vw, 52px)' }}>
            {t('landing.why.title')}
          </h2>
          <div className="facts">
            {FACTS.map(([fact, value]) => (
              <div key={fact} className="fact">
                <span className="num">{value}</span>
                <p>{t(`landing.why.facts.${fact}`)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="accent-card ember-card">
          <span className="k micro">{t('landing.why.job')}</span>
          <blockquote>{t('landing.why.quote')}</blockquote>
          <cite>{t('landing.why.cite')}</cite>
        </div>
        <div className="band-viz">
          <div className="row-sb">
            <span className="lbl micro">{t('landing.why.below')}</span>
            <span className="chip ok mint">{t('landing.why.fresh')}</span>
          </div>
          <svg
            viewBox="0 0 360 400"
            width="100%"
            role="img"
            aria-label={t('landing.why.soilLabel', {
              root: String(rootMm),
              s30: String(D1_SENSORS[30]),
              s60: String(D1_SENSORS[60]),
              paw: String(d1.pawNow ?? 0),
              threshold: String(d1.threshold),
            })}
          >
            <SoilSection
              surface={t('landing.why.surface')}
              rootZone={t('landing.why.rootZone', { mm: String(rootMm) })}
              w30={weight(30)}
              w60={weight(60)}
              paw={d1.pawNow ?? 0}
              threshold={d1.threshold}
              target={d1.target}
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

interface SoilProps {
  surface: string;
  rootZone: string;
  w30: number;
  w60: number;
  paw: number;
  threshold: number;
  target: number;
}

function SoilSection({ surface, rootZone, w30, w60, paw, threshold, target }: SoilProps) {
  const id = 'landing-soil-dots';
  // Gauge: 0–100 % on y 180 → 80.
  const level = (pct: number) => 180 - pct;
  return (
    <>
      <defs>
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="1" className="soil-dot" />
          <circle cx="10" cy="11" r="0.8" className="soil-dot" />
        </pattern>
      </defs>
      <text x="16" y="46" className="svg-t soil-surface">
        {surface}
      </text>
      <rect x="0" y="60" width="360" height="340" className="soil-body" />
      <rect x="0" y="60" width="360" height="340" fill={`url(#${id})`} />
      <line x1="0" y1="60" x2="360" y2="60" className="soil-surf" />
      <rect x="120" y="14" width="14" height="46" rx="3" className="trunk" />
      <rect x="24" y="64" width="210" height="296" rx="8" className="root-zone" />
      <path d="M127 60 C 120 110, 90 140, 70 200" className="root draw" />
      <path d="M127 60 C 135 120, 160 160, 190 230" className="root draw" />
      <path d="M127 60 C 125 150, 118 230, 112 320" className="root draw" />
      <path d="M127 60 C 110 90, 70 100, 40 120" className="root draw" />
      <circle cx="170" cy="210" r="6" className="probe pop" />
      <line x1="176" y1="210" x2="236" y2="210" className="lead-l" />
      <text x="240" y="206" className="svg-t hi">
        30 cm
      </text>
      <text x="240" y="222" className="svg-t soil-val">
        {`${D1_SENSORS[30]}%`}
        <tspan className="soil-w">{` · w ${w30}`}</tspan>
      </text>
      <circle cx="150" cy="348" r="6" className="probe pop" />
      <line x1="156" y1="348" x2="236" y2="348" className="lead-l" />
      <text x="240" y="344" className="svg-t hi">
        60 cm
      </text>
      <text x="240" y="360" className="svg-t soil-val">
        {`${D1_SENSORS[60]}%`}
        <tspan className="soil-w">{` · w ${w60}`}</tspan>
      </text>
      <text x="36" y="384" className="svg-t">
        {rootZone}
      </text>
      <rect x="322" y="80" width="22" height="100" rx="4" className="gauge-o" />
      <rect
        x="324"
        y={level(paw) + 2}
        width="18"
        height={paw - 4}
        rx="2"
        className="gauge-f bar-y"
      />
      <line x1="316" y1={level(threshold)} x2="350" y2={level(threshold)} className="g-thr" />
      <line x1="316" y1={level(target)} x2="350" y2={level(target)} className="g-tgt" />
      <text x="310" y={level(target) + 4} className="svg-t" textAnchor="end">
        {target}
      </text>
      <text x="310" y={level(threshold) + 4} className="svg-t em" textAnchor="end">
        {threshold}
      </text>
      <text x="333" y="74" className="svg-t hi" textAnchor="middle">
        {`${paw}%`}
      </text>
    </>
  );
}
