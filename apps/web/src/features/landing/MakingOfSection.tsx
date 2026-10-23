import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { FALLBACK_STATS, fetchTestStats } from '@/features/test-stats/data';
import { textLinkClasses } from '@/ui';
import { SectionIndex } from './TopSections';

export function MakingOfSection() {
  const { t } = useTranslation();
  const stats = useQuery({
    queryKey: ['test-stats'],
    queryFn: fetchTestStats,
    staleTime: Infinity,
  });
  const count = stats.data?.engine ?? FALLBACK_STATS.engine;
  return (
    <section className="landing-wrap landing-section" id="making-of">
      <div className="landing-section-head">
        <div>
          <SectionIndex number="08" label={t('landing.making.eyebrow')} />
          <h2>{t('landing.making.title')}</h2>
        </div>
        <p>{t('landing.making.lead')}</p>
      </div>
      <div className="landing-making">
        <article className="landing-making-card landing-making-card--large">
          <div className="landing-making-card__visual" aria-hidden="true">
            <div className="landing-token-row">
              {Array.from({ length: 7 }, (_, index) => (
                <i key={index} style={{ background: `var(--color-water-${index})` }} />
              ))}
            </div>
            <code>
              water-4 · plant-available water{`\n`}accent · tonight · action · focus{`\n`}tide ·
              first reveal
            </code>
          </div>
          <Chapter
            number="01"
            title={t('landing.making.chapters.tokens.title')}
            body={t('landing.making.chapters.tokens.body')}
          />
        </article>
        <div className="landing-making__stack">
          <article className="landing-making-card landing-making-card--row">
            <div className="landing-making-card__visual" aria-hidden="true">
              <span className="landing-label">D-1 · {t('landing.tomorrow')}</span>
              <code>
                ETc = 0.95 × 5.8{`\n`} = 5.5 mm{`\n`}68.0% → 60.3%
              </code>
            </div>
            <Chapter
              number="02"
              title={t('landing.making.chapters.water.title')}
              body={t('landing.making.chapters.water.body')}
            />
          </article>
          <article className="landing-making-card landing-making-card--row">
            <div className="landing-making-card__visual" aria-hidden="true">
              <div className="landing-test-grid">
                {Array.from({ length: 14 }, (_, index) => (
                  <i key={index} />
                ))}
              </div>
              <span className="landing-label">{t('landing.making.engineTests', { count })}</span>
            </div>
            <Chapter
              number="03"
              title={t('landing.making.chapters.tests.title')}
              body={t('landing.making.chapters.tests.body')}
            />
          </article>
        </div>
      </div>
      <Link to="/making-of" className={`${textLinkClasses} landing-making__link`}>
        {t('landing.making.open')}
      </Link>
    </section>
  );
}

function Chapter({ number, title, body }: { number: string; title: string; body: string }) {
  const { t } = useTranslation();
  return (
    <div className="landing-making-card__body">
      <span className="landing-label">{t('landing.making.chapter', { number })}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
