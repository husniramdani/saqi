import { LocaleSchema } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';
import { useFarm } from '@/api/queries';
import { setLocale, useLocale } from '@/i18n';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'ur', label: 'اردو' },
] as const;

// TODO(T11): freshness "Updated hh:mm GST", mobile bottom nav, Badge + SegmentedControl.
export function AppShell() {
  const { t } = useTranslation();
  const locale = useLocale();
  const farm = useFarm();

  return (
    <>
      <a href="#main">{t('shell.skipToContent')}</a>
      <header>
        <strong>{t('shell.brand')}</strong>{' '}
        {farm.data ? <span>{farm.data.name[locale]}</span> : null}
        <nav aria-label={t('shell.nav.label')}>
          <ul>
            <li>
              <NavLink to="/" end>
                {t('shell.nav.today')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/field">{t('shell.nav.field')}</NavLink>
            </li>
            <li>
              <NavLink to="/making-of">{t('shell.nav.makingOf')}</NavLink>
            </li>
          </ul>
        </nav>
        <p>{t('shell.simulated')}</p>
        <label>
          {t('shell.language')}{' '}
          <select
            value={locale}
            onChange={(e) => void setLocale(LocaleSchema.parse(e.target.value))}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value} lang={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </header>
      <main id="main">
        <Outlet />
      </main>
    </>
  );
}
