import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LanguageSwitch } from '@/app/LanguageSwitch';
import { ThemeToggle } from '@/app/ThemeToggle';
import { ArrowIcon, LandingLogo } from './LandingIcons';

const NAV = ['product', 'tonight', 'decide', 'field', 'making-of'] as const;

export function LandingHeader() {
  const { t } = useTranslation();
  return (
    <header className="wrap nav">
      <a href="#top" className="logo" aria-label={t('landing.header.home')}>
        <LandingLogo />
      </a>
      <nav className="nav-links" aria-label={t('landing.header.navLabel')}>
        {NAV.map((anchor) => (
          <a key={anchor} href={`#${anchor}`}>
            {t(`landing.header.nav.${anchor}`)}
          </a>
        ))}
      </nav>
      <div className="nav-end">
        {/* The shared switch keeps its behaviour; `.lang` restyles it to the landing pill. */}
        <div className="lang">
          <LanguageSwitch />
        </div>
        <ThemeToggle />
        <Link className="pill sm" to="/today">
          {t('landing.header.open')}{' '}
          <span className="arr">
            <ArrowIcon />
          </span>
        </Link>
      </div>
    </header>
  );
}
