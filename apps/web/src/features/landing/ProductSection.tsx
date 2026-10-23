import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Arrow } from '@/ui';
import { LandingMapArtwork } from './LandingMapArtwork';
import { SectionIndex } from './TopSections';

const PRODUCTS = [
  { key: 'today', to: '/today', route: '/today' },
  { key: 'block', to: '/blocks/D-1', route: '/blocks/D-1' },
  { key: 'field', to: '/field', route: '/field' },
  { key: 'making', to: '/making-of', route: '/making-of' },
] as const;

function ProductVisual({ type }: { type: (typeof PRODUCTS)[number]['key'] }) {
  if (type === 'today') return <LandingMapArtwork variant="thumbnail" />;
  if (type === 'block') {
    return (
      <svg viewBox="0 0 280 150" aria-hidden="true">
        <rect x="10" y="22" width="260" height="30" className="landing-mini-band" />
        <line x1="10" y1="52" x2="270" y2="52" className="landing-mini-threshold" />
        <polyline
          points="10,40 40,50 60,55 62,30 100,45 130,53 132,28 170,42 200,50 202,27 240,40 262,48"
          className="landing-mini-line"
        />
        <circle cx="262" cy="48" r="5" className="landing-mini-now" />
      </svg>
    );
  }
  if (type === 'field') {
    return (
      <div className="landing-mini-task">
        <span className="landing-label">D-1 · Khalas palms</span>
        <b>Clear bubblers, row 4</b>
        <span>Mark done</span>
      </div>
    );
  }
  return (
    <div className="landing-mini-chapters">
      {['Tokens', 'Water', 'Reasons', 'Tests', 'Credits'].map((chapter, index) => (
        <span key={chapter} className={index === 1 ? 'is-active' : ''}>
          <b className="num">0{index + 1}</b>
          <i />
          {chapter}
        </span>
      ))}
    </div>
  );
}

export function ProductSection() {
  const { t } = useTranslation();
  return (
    <section className="landing-wrap landing-section" id="product">
      <div className="landing-section-head">
        <div>
          <SectionIndex number="03" label={t('landing.product.eyebrow')} />
          <h2>{t('landing.product.title')}</h2>
        </div>
        <p>{t('landing.product.lead')}</p>
      </div>
      <div className="landing-products">
        {PRODUCTS.map((product, index) => (
          <article className="landing-product-card" key={product.key}>
            <div className="landing-product-card__visual" aria-hidden="true">
              <ProductVisual type={product.key} />
            </div>
            <div className="landing-product-card__body">
              <span className="landing-label">
                0{index + 1} · {t(`landing.product.cards.${product.key}.surface`)}
              </span>
              <h3>{t(`landing.product.cards.${product.key}.title`)}</h3>
              <p>{t(`landing.product.cards.${product.key}.body`)}</p>
              <div className="landing-product-card__footer">
                <span className="num landing-label">{product.route}</span>
                <Link to={product.to} aria-label={t(`landing.product.cards.${product.key}.open`)}>
                  <Arrow size={16} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
