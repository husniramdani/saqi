import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LanguageSwitch } from '@/app/LanguageSwitch';
import { LogoMark } from '@/app/Logo';
import { ThemeToggle } from '@/app/ThemeToggle';
import { buttonClasses, PillArrow } from '@/ui';

const NAV = ['product', 'tonight', 'decide', 'field', 'making-of'] as const;

export function LandingHeader() {
  const { t } = useTranslation();
  return (
    <header className="landing-header landing-wrap">
      <a href="#top" className="landing-logo" aria-label={t('landing.header.home')}>
        <LogoMark size={30} />
        <span className="landing-logo__name">Saqi</span>
        <span lang="ar" className="landing-logo__arabic">
          ساقي
        </span>
      </a>
      <nav aria-label={t('landing.header.navLabel')} className="landing-header__nav">
        {NAV.map((anchor) => (
          <a key={anchor} href={`#${anchor}`}>
            {t(`landing.header.nav.${anchor}`)}
          </a>
        ))}
      </nav>
      <div className="landing-header__actions">
        <LanguageSwitch />
        <ThemeToggle />
        <Link
          to="/today"
          className={`${buttonClasses({ variant: 'ink', arrow: true })} landing-header__cta`}
        >
          {t('landing.header.open')} <PillArrow variant="ink" />
        </Link>
      </div>
    </header>
  );
}
