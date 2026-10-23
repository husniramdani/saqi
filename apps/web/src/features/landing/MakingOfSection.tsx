import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { SectionIndex } from './LandingIcons';
import { landingScenarios } from './workedExample';

const SWATCHES = [0, 1, 2, 3, 4, 5, 6];
const CHECKS = ['maths', 'server', 'screens'] as const;

export function MakingOfSection() {
  const { t } = useTranslation();
  const locale = useLocale();
  const d1 = landingScenarios.irrigate.decision;
  const fmt = (n: number) => formatNumber(n, locale, 1);
  return (
    <section className="wrap" id="making-of" style={{ paddingBottom: 'clamp(72px, 9vw, 128px)' }}>
      <div className="sec-head">
        <div>
          <SectionIndex number="08" label={t('landing.making.eyebrow')} />
          <h2 className="h2">{t('landing.making.title')}</h2>
        </div>
        <p className="lead">{t('landing.making.lead')}</p>
      </div>
      <div className="jgrid">
        <article className="jcard rv">
          <div className="jviz" aria-hidden="true" style={{ minHeight: 280 }}>
            <div className="swr sw">
              {SWATCHES.map((step) => (
                <span key={step} className={`sw${step}`} />
              ))}
            </div>
            <div className="scale-ends">
              <span>{t('landing.making.dry')}</span>
              <span>{t('landing.making.wet')}</span>
            </div>
            <p className="jnote">{t('landing.making.scaleNote')}</p>
            <div className="swr sw">
              <span className="tk-bg" />
              <span className="tk-panel" />
              <span className="tk-accent" style={{ flex: 2 }} />
              <span className="tk-ink" style={{ flex: 2 }} />
            </div>
            <p className="jnote">{t('landing.making.accentNote')}</p>
          </div>
          <div className="jbody">
            <span className="lbl micro">{t('landing.making.chapter', { number: '01' })}</span>
            <h3>{t('landing.making.chapters.tokens.title')}</h3>
            <p>{t('landing.making.chapters.tokens.body')}</p>
          </div>
        </article>
        <div className="jstack">
          <article className="jcard jrow rv">
            <div className="jviz" aria-hidden="true">
              <span className="lbl micro">{t('landing.making.d1Tomorrow')}</span>
              <div className="jlines">
                <p>{t('landing.making.d1Uses', { mm: fmt(d1.etcMm) })}</p>
                <p>
                  {t('landing.making.d1Soil', {
                    now: fmt(d1.pawNow ?? 0),
                    next: fmt(d1.pawProjected ?? 0),
                  })}
                </p>
                <p className="acc-t ember-t">
                  {t('landing.making.d1Tonight', { volume: fmt(d1.volumeM3) })}
                </p>
              </div>
            </div>
            <div className="jbody">
              <span className="lbl micro">{t('landing.making.chapter', { number: '02' })}</span>
              <h3>{t('landing.making.chapters.water.title')}</h3>
              <p>
                {t('landing.making.chapters.water.body', {
                  now: fmt(d1.pawNow ?? 0),
                  volume: fmt(d1.volumeM3),
                })}
              </p>
            </div>
          </article>
          <article className="jcard jrow rv">
            <div className="jviz" aria-hidden="true">
              <ul className="checks">
                {CHECKS.map((key) => (
                  <li key={key}>
                    <span className="tick">
                      <svg width="14" height="14" viewBox="0 0 16 16">
                        <path d="M3.5 8.5l3 3 6-7" />
                      </svg>
                    </span>
                    <span>{t(`landing.making.checks.${key}`)}</span>
                  </li>
                ))}
              </ul>
              <span className="jnote">{t('landing.making.checksNote')}</span>
            </div>
            <div className="jbody">
              <span className="lbl micro">{t('landing.making.chapter', { number: '03' })}</span>
              <h3>{t('landing.making.chapters.tests.title')}</h3>
              <p>{t('landing.making.chapters.tests.body')}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
