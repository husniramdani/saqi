import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useWeather } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';
import { formatNumber, formatTimeGst } from '@/i18n/format';
import { buttonClasses, Chip, Figure, PillArrow, Skeleton, SourceDot, TimeTrack } from '@/ui';
import { LandingMapArtwork } from './LandingMapArtwork';
import { LANDING_ET0_WEEK } from './workedExample';

const nightBarD1 = { from: 0, to: 181 / 420, label: 'D-1, 22:00–01:01 GST, 90.4 m³' };
const nightBarF1 = {
  from: 181 / 420,
  to: 388 / 420,
  label: 'F-1, 01:01–04:28 GST, 155.5 m³',
};

export function HeroSection() {
  const { t } = useTranslation();
  return (
    <section id="top" className="landing-wrap">
      <div className="landing-hero">
        <div className="landing-hero__map" aria-hidden="true">
          <LandingMapArtwork variant="hero" />
        </div>
        <div className="landing-hero__kicker">
          <span>{t('landing.hero.read')}</span>
          <span>{t('landing.hero.then')}</span>
        </div>
        <p className="landing-hero__disclosure">{t('landing.hero.disclosure')}</p>
        <div className="landing-hero__main">
          <div>
            <h1>{t('landing.hero.title')}</h1>
            <p className="landing-hero__thesis">{t('landing.hero.thesis')}</p>
            <p className="landing-hero__body">{t('landing.hero.body')}</p>
            <div className="landing-hero__actions">
              <Link to="/today" className={buttonClasses({ variant: 'accent', arrow: true })}>
                {t('landing.hero.primary')} <PillArrow variant="accent" />
              </Link>
              <a className="landing-text-link" href="#decide">
                {t('landing.hero.secondary')}
              </a>
            </div>
          </div>
          <aside
            className="landing-inverse landing-hero__summary"
            aria-label={t('landing.hero.summaryLabel')}
          >
            <div className="landing-row">
              <span className="landing-label">{t('landing.hero.summaryTitle')}</span>
              <span className="num landing-label">22:00–05:00 GST</span>
            </div>
            <Figure value={245.9} unit="m³" precision={1} size="xl" accent />
            <p>{t('landing.hero.saved', { volume: '62 m³' })}</p>
            <div className="landing-schedule-mini">
              <span />
              <div className="landing-ruler">
                <span>22</span>
                <span>23</span>
                <span>00</span>
                <span>01</span>
                <span>02</span>
                <span>03</span>
                <span>04</span>
                <span>05</span>
              </div>
              <span className="num">D-1</span>
              <TimeTrack hours={7} bars={[nightBarD1]} />
              <span className="num">F-1</span>
              <TimeTrack hours={7} bars={[nightBarF1]} />
            </div>
            <div className="landing-row">
              <Chip variant="warn">
                <SourceDot source="sim">{t('shell.simulated')}</SourceDot>
              </Chip>
              <span className="landing-label">{t('landing.hero.pump')}</span>
            </div>
          </aside>
        </div>
        <p className="landing-hero__foot">{t('landing.hero.foot')}</p>
      </div>
    </section>
  );
}

export function StatusStrip() {
  const { t } = useTranslation();
  const locale = useLocale();
  const weather = useWeather();
  return (
    <section className="landing-wrap" aria-label={t('landing.status.label')}>
      <div className="landing-status">
        <span className="landing-status__tag">{t('landing.status.tag')}</span>
        <QueryState
          query={weather}
          isEmpty={(data) => data.daily.length === 0}
          emptyText={t('landing.status.empty')}
          skeleton={<Skeleton block={44} className="min-w-64" />}
        >
          {(data) => {
            const tomorrow = data.daily[1] ?? data.daily[0];
            return (
              <>
                <SourceDot source={data.stale ? 'off' : 'live'}>
                  {data.stale ? t('landing.status.stale') : t('landing.status.live')}
                </SourceDot>
                <SourceDot source="sim">{t('landing.status.simulated')}</SourceDot>
                {tomorrow ? (
                  <span className="num landing-status__item">
                    {t('landing.status.tomorrow')} {formatNumber(tomorrow.et0Mm, locale, 1)} mm
                  </span>
                ) : null}
                <span className="num landing-status__item">
                  {formatTimeGst(data.fetchedAt, locale)}
                </span>
              </>
            );
          }}
        </QueryState>
        <a href="#making-of" className="landing-status__link">
          {t('landing.status.sourceLink')}
        </a>
      </div>
    </section>
  );
}

export function AboutSection() {
  const { t } = useTranslation();
  return (
    <section className="landing-wrap landing-section" id="about">
      <div className="landing-about">
        <article className="landing-tile">
          <div className="landing-row">
            <span className="landing-label">D-1 · {t('today.waterNow')}</span>
            <Chip variant="ok">{t('confidence.high')}</Chip>
          </div>
          <svg viewBox="0 0 140 140" role="img" aria-label={t('landing.about.ringLabel')}>
            <circle cx="70" cy="70" r="48" className="landing-ring-track" />
            <circle
              cx="70"
              cy="70"
              r="48"
              className="landing-ring-value"
              pathLength="100"
              strokeDasharray="68 100"
              transform="rotate(-90 70 70)"
            />
            <line
              x1="70"
              y1="13"
              x2="70"
              y2="25"
              className="landing-ring-threshold"
              transform="rotate(234 70 70)"
            />
            <line
              x1="70"
              y1="13"
              x2="70"
              y2="25"
              className="landing-ring-target"
              transform="rotate(324 70 70)"
            />
            <text x="70" y="72" textAnchor="middle" className="landing-svg-value">
              68.0
            </text>
            <text x="70" y="92" textAnchor="middle" className="landing-svg-label">
              {t('landing.about.water')}
            </text>
          </svg>
          <div className="landing-row landing-label">
            <span>{t('landing.about.threshold')}</span>
            <span>{t('landing.about.target')}</span>
          </div>
        </article>
        <p className="landing-about__statement">{t('landing.about.statement')}</p>
        <article className="landing-tile">
          <div className="landing-row">
            <span className="landing-label">{t('landing.about.et0')}</span>
            <Chip>{t('landing.sample')}</Chip>
          </div>
          <svg viewBox="0 0 210 100" role="img" aria-label={t('landing.about.et0Label')}>
            {[20, 50, 80].map((y) => (
              <line key={y} x1="0" y1={y} x2="210" y2={y} className="landing-chart-grid" />
            ))}
            {LANDING_ET0_WEEK.map((value, index) => {
              const x = 15 + index * 30;
              const y = 88 - (value - 5.5) * 45;
              return (
                <g key={x}>
                  <line x1={x} y1="90" x2={x} y2={y} className="landing-et-stem" />
                  <circle
                    cx={x}
                    cy={y}
                    r={index === 0 ? 5 : 4}
                    className={
                      index === 0 ? 'landing-et-dot landing-et-dot--tonight' : 'landing-et-dot'
                    }
                  />
                </g>
              );
            })}
          </svg>
          <div className="landing-row">
            <Figure value={5.8} unit="mm" precision={1} size="md" />
            <span className="landing-label">{t('landing.tomorrow')}</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export function WhySection() {
  const { t } = useTranslation();
  return (
    <section className="landing-wrap" aria-labelledby="landing-why-title">
      <div className="landing-inverse landing-why">
        <div className="landing-why__copy">
          <SectionIndex number="02" label={t('landing.why.eyebrow')} />
          <h2 id="landing-why-title">{t('landing.why.title')}</h2>
          <div className="landing-facts">
            {(['imports', 'target', 'holding'] as const).map((key) => (
              <div className="landing-fact" key={key}>
                <span className="num">{t(`landing.why.facts.${key}.value`)}</span>
                <p>{t(`landing.why.facts.${key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
        <blockquote className="landing-why__quote">
          <span>{t('landing.why.job')}</span>
          <p>“{t('landing.why.quote')}”</p>
          <cite>{t('landing.why.cite')}</cite>
        </blockquote>
        <div className="landing-why__soil">
          <div className="landing-row">
            <span className="landing-label">{t('landing.why.below')}</span>
            <Chip variant="ok">{t('landing.why.fresh')}</Chip>
          </div>
          <svg viewBox="0 0 360 400" role="img" aria-label={t('landing.why.soilLabel')}>
            <rect x="0" y="60" width="360" height="340" className="landing-soil" />
            <line x1="0" y1="60" x2="360" y2="60" className="landing-soil-surface" />
            <rect x="24" y="64" width="210" height="296" rx="8" className="landing-root-zone" />
            <rect x="120" y="14" width="14" height="46" rx="3" className="landing-trunk" />
            {[
              'M127 60 C120 110 90 140 70 200',
              'M127 60 C135 120 160 160 190 230',
              'M127 60 C125 150 118 230 112 320',
              'M127 60 C110 90 70 100 40 120',
            ].map((d) => (
              <path key={d} d={d} className="landing-root" />
            ))}
            <circle cx="170" cy="210" r="6" className="landing-probe" />
            <line x1="176" y1="210" x2="236" y2="210" className="landing-probe-line" />
            <text x="240" y="205" className="landing-svg-label landing-svg-label--strong">
              30 cm
            </text>
            <text x="240" y="224" className="landing-svg-label">
              70.4% · w 0.6
            </text>
            <circle cx="150" cy="348" r="6" className="landing-probe" />
            <line x1="156" y1="348" x2="236" y2="348" className="landing-probe-line" />
            <text x="240" y="343" className="landing-svg-label landing-svg-label--strong">
              60 cm
            </text>
            <text x="240" y="362" className="landing-svg-label">
              64.4% · w 0.4
            </text>
            <text x="24" y="386" className="landing-svg-label">
              {t('landing.why.rootZone')}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

export function SectionIndex({ number, label }: { number: string; label: string }) {
  return (
    <span className="landing-index">
      <span>{number}</span>
      <i />
      <b>{label}</b>
    </span>
  );
}
