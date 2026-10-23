import { blockById, farm07 } from '@saqi/shared';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FALLBACK_STATS, fetchTestStats } from '@/features/test-stats/data';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { SectionIndex } from './LandingIcons';
import { LANDING_ET0_MM, landingScenarios } from './workedExample';

const SWATCHES = [0, 1, 2, 3, 4, 5, 6];

export function MakingOfSection() {
  const { t } = useTranslation();
  const locale = useLocale();
  const stats = useQuery({
    queryKey: ['test-stats'],
    queryFn: fetchTestStats,
    staleTime: Infinity,
  });
  const engineTests = stats.data?.engine ?? FALLBACK_STATS.engine;
  const d1 = landingScenarios.irrigate.decision;
  const fmt = (n: number, digits = 1) => formatNumber(n, locale, digits);
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
            <div className="swr sw">
              <span className="tk-bg" />
              <span className="tk-panel" />
              <span className="tk-accent" style={{ flex: 2 }} />
              <span className="tk-ink" style={{ flex: 2 }} />
            </div>
            {/* The token sheet as each theme defines it (design.md → @saqi/tokens). */}
            <div className="code day-only" dir="ltr">
              <b>water-4</b>
              {'   #5EA3A3   plant-available water, step 4\n'}
              <b>accent</b>
              {'    #E8762D   tonight · action · focus\n'}
              <b>tide</b>
              {'      1.6 s     expo.out — first reveal'}
            </div>
            <div className="code night-only" dir="ltr">
              <b>water-4</b>
              {'   #6FA87F   plant-available water, step 4\n'}
              <b>ember</b>
              {'     #F08A3E   tonight · action · focus\n'}
              <b>tide</b>
              {'      1.6 s     expo.out — first reveal'}
            </div>
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
              <div className="mono" style={{ fontSize: 15, lineHeight: 1.7 }} dir="ltr">
                {'ETc = '}
                <span className="acc-t ember-t">{fmt(blockById(farm07, 'D-1').kc, 2)}</span>
                {` × ${fmt(LANDING_ET0_MM)}`}
                <br />
                {`\u00a0\u00a0\u00a0\u00a0= ${fmt(d1.etcMm)} mm`}
                <br />
                {`${fmt(d1.pawNow ?? 0)}% → `}
                <span className="acc-t ember-t">{`${fmt(d1.pawProjected ?? 0)}%`}</span>
              </div>
            </div>
            <div className="jbody">
              <span className="lbl micro">{t('landing.making.chapter', { number: '02' })}</span>
              <h3>{t('landing.making.chapters.water.title')}</h3>
              <p>{t('landing.making.chapters.water.body')}</p>
            </div>
          </article>
          <article className="jcard jrow rv">
            <div className="jviz" aria-hidden="true">
              <div className="tests">
                {Array.from({ length: 14 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>
              <span className="lbl micro">
                {t('landing.making.engineTests', { count: String(engineTests) })}
              </span>
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
