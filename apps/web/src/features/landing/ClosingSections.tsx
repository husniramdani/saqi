import { farm07 } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowIcon, LandingLogo } from './LandingIcons';

const GITHUB = 'https://github.com/husniramdani';

export function LandingCta() {
  const { t } = useTranslation();
  return (
    <section className="wrap" aria-labelledby="cta-h">
      <div className="cta inv">
        <div className="cta-glow" aria-hidden="true" />
        <div className="row-sb">
          <span className="acc-m ember-m">{farm07.nightWindow.start}</span>
          <span className="lbl micro">{t('landing.cta.window')}</span>
          <span className="acc-m ember-m">{farm07.nightWindow.end}</span>
        </div>
        <h2 id="cta-h" className="cta-hl">
          {t('landing.cta.title')}
          <br />
          <span>{t('landing.cta.emphasis')}</span>
        </h2>
        <div className="cta-actions">
          <Link className="pill accent ember" to="/today">
            {t('landing.cta.open')}{' '}
            <span className="arr">
              <ArrowIcon />
            </span>
          </Link>
          <a className="tlink" href={GITHUB}>
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
    <footer className="wrap">
      <div className="foot">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: '34ch' }}>
          <a href="#top" className="logo" aria-label={t('landing.footer.backToTop')}>
            <LandingLogo />
          </a>
          <p className="foot-about">{t('landing.footer.disclosure')}</p>
        </div>
        <div>
          <h4>{t('landing.footer.product')}</h4>
          <ul>
            <li>
              <Link to="/today">{t('landing.product.cards.today.title')}</Link>
            </li>
            <li>
              <Link to="/blocks/D-1">{t('landing.product.cards.block.title')}</Link>
            </li>
            <li>
              <Link to="/field">{t('landing.product.cards.field.title')}</Link>
            </li>
            <li>
              <Link to="/making-of">{t('landing.product.cards.making.title')}</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>{t('landing.footer.data')}</h4>
          <ul>
            <li>
              <span>{t('landing.footer.weather')}</span>
            </li>
            <li>
              <span>{t('landing.footer.sensors')}</span>
            </li>
            <li>
              <span>{t('landing.footer.farm')}</span>
            </li>
          </ul>
        </div>
        <div>
          <h4>{t('landing.footer.builtBy')}</h4>
          <ul>
            <li>
              <a href={GITHUB}>{t('landing.footer.github')}</a>
            </li>
            <li>
              <a href="https://linkedin.com/in/husniramdani">LinkedIn</a>
            </li>
            <li>
              <a href="https://stylebase.dev">Stylebase</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="foot-b">
        <span className="micro" dir="ltr">
          {`${farm07.lat.toFixed(2)} N · ${farm07.lon.toFixed(2)} E`}
        </span>
        <span className="micro">{t('landing.footer.gst')}</span>
        <span className="micro">© 2026 Saqi</span>
      </div>
    </footer>
  );
}
