import { farm07 } from '@saqi/shared';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeather } from '@/api/queries';
import { useLocale } from '@/i18n';
import { formatNumber, formatTimeGst } from '@/i18n/format';
import { NightRow } from './HeroSection';
import { ChevronIcon, SectionIndex } from './LandingIcons';
import {
  LANDING_BUDGET,
  landingDecisions,
  landingNightBars,
  landingPulses,
  landingSavedM3,
  landingTonightM3,
  type LandingDecisionKey,
} from './workedExample';

const RULER = ['22:00', '23', '00', '01', '02', '03', '04', '05:00'];

interface Props {
  onScenarioChange: (key: LandingDecisionKey) => void;
}

export function InstrumentsSection({ onScenarioChange }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  const fmt = (n: number, digits = 1) => formatNumber(n, locale, digits);
  const budgetPct = Math.round((LANDING_BUDGET.projectedM3 / LANDING_BUDGET.allocationM3) * 100);
  const saved = landingDecisions.filter((decision) => decision.savedVsFixedM3 > 0);
  const d1 = landingNightBars.find((bar) => bar.blockId === 'D-1');
  const f1 = landingNightBars.find((bar) => bar.blockId === 'F-1');
  const d3StaleHours = landingDecisions
    .find((decision) => decision.blockId === 'D-3')
    ?.reasons.find((reason) => reason.code === 'SENSOR_STALE')?.params['hours'];
  return (
    <section className="wrap sec" id="instruments">
      <div className="sec-head">
        <div>
          <SectionIndex number="06" label={t('landing.instruments.eyebrow')} />
          <h2 className="h2">{t('landing.instruments.title')}</h2>
        </div>
        <p className="lead">{t('landing.instruments.lead')}</p>
      </div>

      <div className="inst">
        <article className="tile span2 rv">
          <div className="tile-h">
            <span className="lbl micro">{t('landing.instruments.schedule')}</span>
            <span className="num" style={{ fontSize: 22 }}>
              <span className="cnt" data-to={landingTonightM3} data-dec="1">
                {fmt(landingTonightM3)}
              </span>
              <i>m³</i>
            </span>
          </div>
          <div className="sched" style={{ gridTemplateColumns: '48px minmax(0, 1fr)' }}>
            <span />
            <div className="ruler">
              {RULER.map((hour) => (
                <span key={hour}>{hour}</span>
              ))}
            </div>
            {landingNightBars.map((bar) => (
              <NightRow key={bar.blockId} bar={bar} codeClass="mono inst-code" trackHeight={34} />
            ))}
          </div>
          <div className="row-sb">
            {[d1, f1].map((bar) =>
              bar ? (
                <span key={bar.blockId} className="lbl mono micro" dir="ltr">
                  {`${bar.blockId} ${fmt(bar.volumeM3)} m³ · ${bar.start} → ${bar.end}`}
                </span>
              ) : null,
            )}
          </div>
        </article>

        <article className="tile span2 rv">
          <div className="tile-h">
            <span className="lbl micro">
              {t('landing.instruments.budget', { month: t('landing.instruments.october') })}
            </span>
            <span className="chip warn n-solid">{t('landing.instruments.tight')}</span>
          </div>
          <div className="num" style={{ fontSize: 48 }}>
            <span className="cnt" data-to={budgetPct} data-dec="0">
              {budgetPct}
            </span>
            <i>%</i>
          </div>
          <div
            className="meter"
            role="img"
            aria-label={t('landing.instruments.budgetLabel', { pct: String(budgetPct) })}
          >
            <span className="meter-fill bar-x" style={{ width: `${budgetPct}%` }} />
            <span className="meter-tick" style={{ insetInlineStart: `${LANDING_BUDGET.okPct}%` }} />
          </div>
          <div className="row-sb">
            <span className="lbl micro">
              <span className="mono budget-v" dir="ltr">
                {`${LANDING_BUDGET.projectedM3.toLocaleString('en-US')} / ${LANDING_BUDGET.allocationM3.toLocaleString('en-US')} m³`}
              </span>
              {` ${t('landing.instruments.projected')}`}
            </span>
            <span className="lbl micro">
              {t('landing.instruments.bands', { ok: String(LANDING_BUDGET.okPct) })}
            </span>
          </div>
        </article>

        <WeatherTile />

        <article className="tile rv">
          <div className="tile-h">
            <span className="lbl micro">{t('landing.instruments.pulses')}</span>
            <span className="chip">G-1 · G-2</span>
          </div>
          <PulseDial
            label={t('landing.instruments.pulseLabel', { times: landingPulses.times.join(', ') })}
          />{' '}
          <span className="lbl micro">
            {t('landing.instruments.pulseTimes', {
              times: landingPulses.times.join(' · '),
              minutes: String(landingPulses.minutes),
            })}
          </span>
        </article>

        <article className="tile span2 rv">
          <div className="tile-h">
            <span className="lbl micro">{t('landing.instruments.attention')}</span>
            <span className="lbl micro">3</span>
          </div>
          <nav className="att" aria-label={t('landing.instruments.attentionLabel')}>
            {d1 ? (
              <a href="#decide" onClick={() => onScenarioChange('irrigate')}>
                <span className="mono att-code">D-1</span>
                <span>
                  {`${t('decision.irrigate')} `}
                  <span className="mono" dir="ltr">{`${fmt(d1.volumeM3)} m³`}</span>
                </span>
                <span className="mono">{d1.start}</span>
                <ChevronIcon />
              </a>
            ) : null}
            {f1 ? (
              <a href="#decide" onClick={() => onScenarioChange('deficit')}>
                <span className="mono att-code">F-1</span>
                <span>
                  {`${t('decision.deficit')} `}
                  <span className="mono" dir="ltr">{`${fmt(f1.volumeM3)} m³`}</span>
                </span>
                <span className="mono">{f1.start}</span>
                <ChevronIcon />
              </a>
            ) : null}
            <a href="#tonight">
              <span className="mono att-code">D-3</span>
              <span>
                {`${t('landing.instruments.offline')} `}
                <span className="mono" dir="ltr">{`${d3StaleHours} h`}</span>
              </span>
              <span className="chip warn ember">{t('landing.instruments.stale')}</span>
              <ChevronIcon />
            </a>
          </nav>
        </article>

        <SensorTile />

        <article className="tile span2 rv">
          <div className="tile-h">
            <span className="lbl micro">{t('landing.instruments.saved')}</span>
            <span className="dot live" />
          </div>
          <div className="num" style={{ fontSize: 48 }}>
            <span className="cnt" data-to={landingSavedM3} data-dec="0">
              {landingSavedM3}
            </span>
            <i>m³</i>
          </div>
          <div
            className="stack bar-x"
            role="img"
            aria-label={t('landing.instruments.savedLabel', {
              list: saved.map((d) => `${d.blockId} ${d.savedVsFixedM3}`).join(', '),
            })}
          >
            {saved.map((decision, index) => (
              <span
                key={decision.blockId}
                className={`sw${6 - index * 2}`}
                style={{
                  width: `${Math.round((decision.savedVsFixedM3 / landingSavedM3) * 1000) / 10}%`,
                }}
              />
            ))}
          </div>
          <div className="row-sb">
            {saved.map((decision) => (
              <span key={decision.blockId} className="lbl micro">
                {`${decision.blockId} · ${decision.savedVsFixedM3}`}
              </span>
            ))}
          </div>
        </article>
      </div>

      <p className="footnote">
        <span className="dot sim" style={{ marginTop: 6 }} />
        {t('landing.instruments.footnote')}
      </p>
    </section>
  );
}

/** Live Open-Meteo conditions at the farm: the one instrument on this page that isn't sample data. */
function WeatherTile() {
  const { t } = useTranslation();
  const locale = useLocale();
  const weather = useWeather();
  const data = weather.data;
  return (
    <article className="tile rv" aria-busy={weather.isPending}>
      <div className="tile-h">
        <span className="lbl micro">{t('landing.instruments.weather')}</span>
        <span className={data && !data.stale ? 'dot live' : 'dot off'} />
      </div>
      {weather.isPending ? (
        <>
          <div className="num" style={{ fontSize: 56 }}>
            <span className="skel" style={{ width: 96 }} />
          </div>
          <span className="sr-only">{t('landing.status.loading')}</span>
        </>
      ) : weather.isError || !data ? (
        <div role="alert" className="wx-error">
          <span className="lbl micro">{t('landing.status.error')}</span>
          <button type="button" className="strip-retry" onClick={() => void weather.refetch()}>
            {t('landing.status.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="num" style={{ fontSize: 56 }}>
            {Math.round(data.current.tempC)}
            <i>°C</i>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="wx">
              <span className="lbl micro">{t('landing.instruments.humidity')}</span>
              <span className="mono wx-v">
                <span dir="ltr">{`${Math.round(data.current.humidityPct)}%`}</span>
              </span>
            </div>
            <div className="wx">
              <span className="lbl micro">{t('landing.instruments.wind')}</span>
              <span className="mono wx-v">
                <span dir="ltr">{`${Math.round(data.current.windKmh)} km/h`}</span>
              </span>
            </div>
          </div>
          <span className="lbl micro">
            {data.stale
              ? t('landing.instruments.weatherStale', {
                  time: formatTimeGst(data.fetchedAt, locale),
                })
              : t('landing.instruments.weatherUpdated', {
                  time: formatTimeGst(data.fetchedAt, locale),
                })}
          </span>
        </>
      )}
    </article>
  );
}

/** Tomorrow's greenhouse pulses on a 24-hour dial (00 at the top, clockwise). */
function PulseDial({ label }: { label: string }) {
  const tick = (time: string) => {
    const [h = 0, m = 0] = time.split(':').map(Number);
    const angle = ((h + m / 60) / 24) * 2 * Math.PI;
    const at = (r: number) =>
      [60 + r * Math.sin(angle), 60 - r * Math.cos(angle)].map((v) => v.toFixed(1));
    const [x1, y1] = at(52);
    const [x2, y2] = at(40);
    return { x1, y1, x2, y2 };
  };
  return (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      style={{ maxWidth: 150, alignSelf: 'center' }}
      role="img"
      aria-label={label}
    >
      <circle cx="60" cy="60" r="46" className="dial-trk" />
      <circle cx="60" cy="60" r="46" className="dial-ticks" />
      {farm07.pulseTimes.map((time) => (
        <line key={time} {...tick(time)} className="dial-p pop" />
      ))}
      <text x="60" y="30" className="svg-t" textAnchor="middle">
        00
      </text>
      <text x="90" y="64" className="svg-t" textAnchor="middle">
        06
      </text>
      <text x="60" y="98" className="svg-t" textAnchor="middle">
        12
      </text>
      <text x="30" y="64" className="svg-t" textAnchor="middle">
        18
      </text>
      <text x="60" y="66" className="svg-t hi" textAnchor="middle" style={{ fontSize: 16 }}>
        {`${farm07.pulseTimes.length}×`}
      </text>
    </svg>
  );
}

/** D-3's two sensors over the last day: the 60 cm probe went quiet at 12:00. */
function SensorTile() {
  const { t } = useTranslation();
  const hatch = useId().replace(/:/g, '');
  return (
    <article className="tile span2 rv">
      <div className="tile-h">
        <span className="lbl micro">{t('landing.instruments.sensors')}</span>
        <span className="chip warn ember">
          <span className="dot off" />
          {t('landing.instruments.lowConfidence')}
        </span>
      </div>
      <svg
        viewBox="0 0 300 96"
        width="100%"
        role="img"
        aria-label={t('landing.instruments.sensorLabel')}
      >
        <defs>
          <pattern
            id={hatch}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" className="st-hatch" />
          </pattern>
        </defs>
        <line x1="0" y1="20" x2="300" y2="20" className="st-grid" />
        <line x1="0" y1="50" x2="300" y2="50" className="st-grid" />
        <line x1="0" y1="80" x2="300" y2="80" className="st-grid" />
        <rect x="186" y="12" width="114" height="72" rx="4" fill={`url(#${hatch})`} />
        <polyline
          points="0,34 30,38 60,42 90,46 120,30 150,33 180,37 210,41 240,44 270,47 300,49"
          className="st-line st-30 draw"
        />
        <polyline
          points="0,52 30,54 60,57 90,59 120,49 150,51 180,53 186,54"
          className="st-line st-60 draw"
        />
        <text x="243" y="56" className="svg-t em" textAnchor="middle">
          {t('landing.instruments.sensorOffline')}
        </text>
      </svg>
      <div className="row-sb">
        <span className="lbl day-only">{t('landing.instruments.sensorSeries')}</span>
        <span className="micro night-only">{t('landing.instruments.sensorSeriesNight')}</span>
        <span className="lbl micro">{t('landing.instruments.usesFresh')}</span>
      </div>
    </article>
  );
}
