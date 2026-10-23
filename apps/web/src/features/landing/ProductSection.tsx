import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowIcon, SectionIndex } from './LandingIcons';
import { MiniMap } from './LandingMapArtwork';
import { landingScenarios } from './workedExample';

const CHAPTERS = ['tokens', 'water', 'reasons', 'tests', 'credits'] as const;

export function ProductSection() {
  const { t } = useTranslation();
  return (
    <section className="wrap sec" id="product">
      <div className="sec-head">
        <div>
          <SectionIndex number="03" label={t('landing.product.eyebrow')} />
          <h2 className="h2">{t('landing.product.title')}</h2>
        </div>
        <p className="lead">{t('landing.product.lead')}</p>
      </div>
      {/* Today is where the one decision is made: the feature card. The other three surfaces
          serve it and sit beside it as a list (stacked under it on narrower screens). */}
      <div className="cards4">
        <SurfaceCard index="01" card="today" to="/today" visual={<MiniMap />} feature />
        <SurfaceCard index="02" card="block" to="/blocks/D-1" visual={<MiniChart />} />
        <SurfaceCard
          index="03"
          card="field"
          to="/field"
          visual={
            <div className="mini-task">
              <span className="lbl micro mini-task-k">{t('landing.product.task.block')}</span>
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                {t('landing.product.task.title')}
              </span>
              <span className="mini-btn">{t('landing.product.task.done')}</span>
            </div>
          }
        />
        <SurfaceCard
          index="04"
          card="making"
          to="/making-of"
          visual={
            <div className="chap">
              {CHAPTERS.map((chapter, index) => (
                <div key={chapter} className={index === 1 ? 'chap-r on' : 'chap-r'}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <b />
                  <span>{t(`landing.product.chapters.${chapter}`)}</span>
                </div>
              ))}
            </div>
          }
        />
      </div>
    </section>
  );
}

interface CardProps {
  index: string;
  card: 'today' | 'block' | 'field' | 'making';
  to: string;
  visual: ReactNode;
  feature?: boolean;
}

function SurfaceCard({ index, card, to, visual, feature = false }: CardProps) {
  const { t } = useTranslation();
  return (
    <article className={feature ? 'scard scard-feature rv' : 'scard rv'}>
      <div className="scard-viz" aria-hidden="true">
        {visual}
      </div>
      <div className="scard-b">
        <span className="lbl micro">
          {`${index} · ${t(`landing.product.cards.${card}.surface`)}`}
        </span>
        {/* The way in sits with the title, so a short description never ends in an empty band. */}
        <div className="scard-main">
          <div className="scard-t">
            <h3>{t(`landing.product.cards.${card}.title`)}</h3>
            <Link className="rbtn" to={to} aria-label={t(`landing.product.cards.${card}.open`)}>
              <ArrowIcon />
            </Link>
          </div>
          <p>{t(`landing.product.cards.${card}.body`)}</p>
        </div>
      </div>
    </article>
  );
}

/** Block detail thumbnail: fourteen days of water against the target band and threshold. */
function MiniChart() {
  const { t } = useTranslation();
  const d1 = landingScenarios.irrigate.decision;
  return (
    <svg viewBox="0 0 280 150" width="100%">
      <rect x="10" y="22" width="260" height="30" className="mc-band" />
      <line x1="10" y1="52" x2="270" y2="52" className="mc-thr" />
      <polyline
        points="10,40 40,50 60,55 62,30 100,45 130,53 132,28 170,42 200,50 202,27 240,40 262,48"
        className="mc-line draw"
      />
      <circle cx="262" cy="48" r="5" className="mc-now pop" />
      <path d="M60 140 l5 -8 l5 8 z" className="mc-tri" />
      <path d="M126 140 l5 -8 l5 8 z" className="mc-tri" />
      <path d="M196 140 l5 -8 l5 8 z" className="mc-tri" />
      <text x="270" y="16" className="svg-t" textAnchor="end">
        {t('landing.product.chart.target', { value: String(d1.target) })}
      </text>
      <text x="270" y="68" className="svg-t em" textAnchor="end">
        {t('landing.product.chart.threshold', { value: String(d1.threshold) })}
      </text>
    </svg>
  );
}
