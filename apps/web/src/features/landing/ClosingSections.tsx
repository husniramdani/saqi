import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LogoMark } from '@/app/Logo';
import { buttonClasses, PillArrow } from '@/ui';

const REPOSITORY = 'https://github.com/husniramdani/saqi';
const LINKEDIN = 'https://linkedin.com/in/husniramdani';
const STYLEBASE = 'https://stylebase.dev';

export function LandingCta() {
  const { t } = useTranslation();
  return (
    <section className="landing-wrap" aria-labelledby="landing-cta-title">
      <div className="landing-inverse landing-cta">
        <div className="landing-row">
          <span className="num">22:00 GST</span>
          <span className="landing-label">{t('landing.cta.window')}</span>
          <span className="num">05:00 GST</span>
        </div>
        <h2 id="landing-cta-title">
          {t('landing.cta.title')}
          <span>{t('landing.cta.emphasis')}</span>
        </h2>
        <div className="landing-cta__actions">
          <Link to="/today" className={buttonClasses({ variant: 'accent', arrow: true })}>
            {t('landing.cta.open')} <PillArrow variant="accent" />
          </Link>
          <a href={REPOSITORY} target="_blank" rel="noreferrer" className="landing-text-link">
            {t('landing.cta.source')}
          </a>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const { t } = useTranslation();
  return (
    <footer className="landing-wrap">
      <div className="landing-footer">
        <div className="landing-footer__intro">
          <a href="#top" className="landing-logo" aria-label={t('landing.footer.backToTop')}>
            <LogoMark size={30} />
            <span className="landing-logo__name">Saqi</span>
            <span lang="ar" className="landing-logo__arabic">
              ساقي
            </span>
          </a>
          <p>{t('landing.footer.disclosure')}</p>
        </div>
        <FooterGroup
          title={t('landing.footer.product')}
          links={[
            { label: t('shell.nav.today'), href: '/today' },
            { label: t('landing.product.cards.block.title'), href: '/blocks/D-1' },
            { label: t('landing.product.cards.field.title'), href: '/field' },
            { label: t('shell.nav.makingOf'), href: '/making-of' },
          ]}
        />
        <div>
          <h3>{t('landing.footer.data')}</h3>
          <ul>
            <li>{t('landing.footer.weather')}</li>
            <li>{t('landing.footer.sensors')}</li>
            <li>{t('landing.footer.farm')}</li>
          </ul>
        </div>
        <div>
          <h3>{t('landing.footer.builtBy')}</h3>
          <ul>
            <li>
              <a href={REPOSITORY} target="_blank" rel="noreferrer">
                Husni Ramdani · GitHub
              </a>
            </li>
            <li>
              <a href={LINKEDIN} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={STYLEBASE} target="_blank" rel="noreferrer">
                Stylebase
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="landing-footer__bottom">
        <span className="num">24.21 N · 55.74 E</span>
        <span>{t('landing.footer.gst')}</span>
        <span>© 2026 Saqi</span>
      </div>
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link to={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
