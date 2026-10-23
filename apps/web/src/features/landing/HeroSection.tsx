import { farm07 } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { ArrowIcon } from './LandingIcons';
import { HeroMap } from './LandingMapArtwork';
import { landingNightBars, landingSavedM3, landingTonightM3 } from './workedExample';

const TOPO = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
  const y = (base: number, step: number) => base + i * step;
  return `M-20 ${y(120, 40)} C 120 ${y(70, 38)}, 240 ${y(160, 44)}, 380 ${y(110, 42)} S 640 ${y(30, 36)}, 920 ${y(60, 40)}`;
});

/** Hours on the night ruler: 22, 23, 00 … 05. */
export const NIGHT_HOURS = ['22', '23', '00', '01', '02', '03', '04', '05'];

export function HeroSection() {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <section id="top" className="wrap">
      <div className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <svg className="hero-topo" viewBox="0 0 900 600" aria-hidden="true">
          {TOPO.map((d) => (
            <path key={d} className="topo" d={d} />
          ))}
        </svg>
        <div className="hero-stage" aria-hidden="true">
          <div className="hero-tilt">
            <div className="hero-map-in">
              <HeroMap />
            </div>
          </div>
        </div>
        <div className="hero-scrim" aria-hidden="true" />

        <div className="hero-top">
          <span className="acc-m ember-m hero-fade">{t('landing.hero.read')}</span>
          <div className="hero-top-end">
            <span className="acc-m ember-m hero-fade">{t('landing.hero.then')}</span>
            <span className="hero-credit micro hero-fade">
              {t('landing.hero.credit')}
              <br />
              <span dir="ltr">24.21 N · 55.74 E · GST</span>
            </span>
          </div>
        </div>

        <div className="hero-main">
          <div>
            <h1 className="hl">
              <span className="hl-line">
                <span>{t('landing.hero.title.line1')}</span>
              </span>{' '}
              <span className="hl-line">
                <span>{t('landing.hero.title.line2')}</span>
              </span>{' '}
              <span className="hl-line">
                <span>{t('landing.hero.title.line3')}</span>
              </span>
            </h1>
            <p className="hero-sub hero-fade">{t('landing.hero.sub')}</p>
            <p className="hero-body hero-fade">{t('landing.hero.body')}</p>
            <div className="hero-ctas hero-fade">
              <Link className="pill accent ember" to="/today">
                {t('landing.hero.primary')}{' '}
                <span className="arr">
                  <ArrowIcon />
                </span>
              </Link>
              <a className="tlink" href="#decide">
                {t('landing.hero.secondary')}
              </a>
            </div>
          </div>

          <aside className="hero-card inv" aria-label={t('landing.hero.summaryLabel')}>
            <div className="row-sb">
              <span className="lbl micro">{t('landing.hero.summaryTitle')}</span>
              <span className="lbl mono micro" dir="ltr">
                {`${farm07.nightWindow.start} → ${farm07.nightWindow.end} GST`}
              </span>
            </div>
            <div className="num" style={{ fontSize: 52 }}>
              <span className="cnt" data-to={landingTonightM3} data-dec="1">
                {formatNumber(landingTonightM3, locale, 1)}
              </span>
              <i>m³</i>
            </div>
            <p className="hc-saved">
              <span className="mono acc-t ember-t" dir="ltr">{`${landingSavedM3} m³`}</span>
              {` ${t('landing.hero.saved')}`}
            </p>
            <div className="sched">
              <span />
              <div className="ruler">
                {NIGHT_HOURS.map((hour) => (
                  <span key={hour}>{hour}</span>
                ))}
              </div>
              {landingNightBars.map((bar) => (
                <NightRow key={bar.blockId} bar={bar} codeClass="mono hc-code micro" />
              ))}
            </div>
            <div className="row-sb" style={{ paddingTop: 4 }}>
              <span className="chip warn">
                <span className="dot sim" />
                {t('landing.simulated')}
              </span>
              <span className="lbl micro">
                {t('landing.hero.pump', { rate: String(farm07.pumpCapacityM3h) })}
              </span>
            </div>
          </aside>
        </div>

        <p className="acc-m ember-m hero-foot hero-fade">{t('landing.hero.foot')}</p>
      </div>
    </section>
  );
}

interface NightRowProps {
  bar: (typeof landingNightBars)[number];
  codeClass: string;
  trackHeight?: number;
}

/** One block's run on the night track: code, then its bar on the 22:00 → 05:00 window. */
export function NightRow({ bar, codeClass, trackHeight }: NightRowProps) {
  return (
    <>
      <span className={codeClass}>{bar.blockId}</span>
      <div className="trk" style={trackHeight ? { height: trackHeight } : undefined}>
        <span
          className="bar bar-x"
          style={{ insetInlineStart: `${bar.offsetPct}%`, width: `${bar.widthPct}%` }}
        />
      </div>
    </>
  );
}
