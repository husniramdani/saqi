import { useTranslation } from 'react-i18next';
import { Chip, Figure, Meter, SourceDot, TimeTrack } from '@/ui';
import { SectionIndex } from './TopSections';

const scheduleBarD1 = { from: 0, to: 181 / 420, label: 'D-1, 22:00–01:01 GST, 90.4 m³' };
const scheduleBarF1 = {
  from: 181 / 420,
  to: 388 / 420,
  label: 'F-1, 01:01–04:28 GST, 155.5 m³',
};

export function InstrumentsSection() {
  const { t } = useTranslation();
  return (
    <section className="landing-wrap landing-section" id="instruments">
      <div className="landing-section-head">
        <div>
          <SectionIndex number="06" label={t('landing.instruments.eyebrow')} />
          <h2>{t('landing.instruments.title')}</h2>
        </div>
        <p>{t('landing.instruments.lead')}</p>
      </div>
      <div className="landing-instruments">
        <article className="landing-tile landing-span-2">
          <div className="landing-row">
            <span className="landing-label">{t('today.schedule')}</span>
            <Chip>{t('landing.workedExample')}</Chip>
          </div>
          <div className="landing-instrument-total">
            <Figure value={245.9} unit="m³" precision={1} size="md" accent />
          </div>
          <div className="landing-schedule-mini landing-schedule-mini--wide">
            <span>GST</span>
            <div className="landing-ruler">
              <span>22:00</span>
              <span>23</span>
              <span>00</span>
              <span>01</span>
              <span>02</span>
              <span>03</span>
              <span>04</span>
              <span>05:00</span>
            </div>
            <span className="num">D-1</span>
            <TimeTrack hours={7} bars={[scheduleBarD1]} />
            <span className="num">F-1</span>
            <TimeTrack hours={7} bars={[scheduleBarF1]} />
          </div>
          <div className="landing-row landing-label">
            <span className="num">D-1 · 90.4 m³ · 22:00–01:01 GST</span>
            <span className="num">F-1 · 155.5 m³ · 01:01–04:28 GST</span>
          </div>
        </article>

        <article className="landing-tile landing-span-2">
          <div className="landing-row">
            <span className="landing-label">{t('landing.instruments.budget')}</span>
            <div className="landing-row">
              <Chip>{t('landing.sample')}</Chip>
              <Chip variant="warn">{t('today.budgetStatus.tight')}</Chip>
            </div>
          </div>
          <Figure value={98} unit="%" precision={0} size="xl" />
          <Meter value={0.98} mark={0.97} label={t('today.budgetMeter', { pct: 98 })} />
          <div className="landing-row landing-label">
            <span className="num">6,912 / 7,050 m³</span>
            <span>{t('today.budgetProjected')}</span>
          </div>
        </article>

        <article className="landing-tile">
          <div className="landing-row">
            <span className="landing-label">{t('today.weatherNow')}</span>
            <Chip>{t('landing.sample')}</Chip>
          </div>
          <Figure value={31} unit="°C" precision={0} size="xl" />
          <div className="landing-weather-grid">
            <span>
              <small>{t('today.humidity')}</small>
              <b className="num">38%</b>
            </span>
            <span>
              <small>{t('today.wind')}</small>
              <b className="num">14 km/h</b>
            </span>
          </div>
          <SourceDot source="live">Open-Meteo · {t('landing.workedExample')}</SourceDot>
        </article>

        <article className="landing-tile">
          <div className="landing-row">
            <span className="landing-label">{t('landing.instruments.pulses')}</span>
            <Chip>{t('landing.workedExample')}</Chip>
          </div>
          <svg viewBox="0 0 140 140" role="img" aria-label={t('landing.instruments.pulseLabel')}>
            <circle cx="70" cy="70" r="50" className="landing-ring-track" />
            {[105, 165, 225].map((angle) => (
              <line
                key={angle}
                x1="70"
                y1="13"
                x2="70"
                y2="27"
                className="landing-pulse-mark"
                transform={`rotate(${angle} 70 70)`}
              />
            ))}
            <text x="70" y="76" textAnchor="middle" className="landing-svg-value">
              3×
            </text>
          </svg>
          <span className="num landing-label">07:00 · 11:00 · 15:00 GST</span>
        </article>

        <article className="landing-tile landing-span-2">
          <div className="landing-row">
            <span className="landing-label">{t('landing.instruments.attention')}</span>
            <Chip>{t('landing.workedExample')}</Chip>
          </div>
          <nav className="landing-attention" aria-label={t('landing.instruments.attention')}>
            <a href="#decide">
              <b className="num">D-1</b>
              <span>
                {t('decision.irrigate')} · <span className="num">90.4 m³</span>
              </span>
              <span className="num">22:00 GST</span>
            </a>
            <a href="#decide">
              <b className="num">F-1</b>
              <span>
                {t('decision.deficit')} · <span className="num">155.5 m³</span>
              </span>
              <span className="num">01:01 GST</span>
            </a>
            <a href="#tonight">
              <b className="num">D-3</b>
              <span>{t('landing.instruments.offline')}</span>
              <Chip variant="warn">{t('map.stale')}</Chip>
            </a>
          </nav>
        </article>

        <article className="landing-tile landing-span-2">
          <div className="landing-row">
            <span className="landing-label">{t('landing.instruments.sensors')}</span>
            <div className="landing-row">
              <Chip>{t('landing.workedExample')}</Chip>
              <Chip variant="warn">{t('confidence.low')}</Chip>
            </div>
          </div>
          <svg viewBox="0 0 300 96" role="img" aria-label={t('landing.instruments.sensorLabel')}>
            {[20, 50, 80].map((y) => (
              <line key={y} x1="0" y1={y} x2="300" y2={y} className="landing-chart-grid" />
            ))}
            <polyline
              points="0,34 30,38 60,42 90,46 120,30 150,33 180,37 210,41 240,44 270,47 300,49"
              className="landing-sensor-line landing-sensor-line--fresh"
            />
            <polyline
              points="0,52 30,54 60,57 90,59 120,49 150,51 180,53 186,54"
              className="landing-sensor-line"
            />
            <rect x="186" y="12" width="114" height="72" rx="4" className="landing-stale-area" />
            <text
              x="243"
              y="55"
              textAnchor="middle"
              className="landing-svg-label landing-svg-label--warning"
            >
              {t('landing.instruments.sensorOffline')}
            </text>
          </svg>
          <div className="landing-row landing-label">
            <span>{t('landing.instruments.sensorSeries')}</span>
            <span>{t('landing.instruments.usesFresh')}</span>
          </div>
        </article>

        <article className="landing-tile landing-span-2">
          <div className="landing-row">
            <span className="landing-label">{t('landing.instruments.saved')}</span>
            <Chip>{t('landing.workedExample')}</Chip>
          </div>
          <Figure value={62} unit="m³" precision={0} size="xl" />
          <div
            className="landing-saved-bar"
            role="img"
            aria-label={t('landing.instruments.savedLabel')}
          >
            <span />
            <span />
            <span />
          </div>
          <div className="landing-row landing-label">
            <span>D-2 · 25 m³</span>
            <span>D-3 · 23 m³</span>
            <span>D-4 · 14 m³</span>
          </div>
        </article>
      </div>
      <p className="landing-footnote">
        <SourceDot source="sim">{t('landing.instruments.footnote')}</SourceDot>
      </p>
    </section>
  );
}
