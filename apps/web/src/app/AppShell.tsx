import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { usePlanToday } from '@/api/queries';
import { needsAttention } from '@/features/attention/risk';
import { useLocale } from '@/i18n';
import { formatTimeGst } from '@/i18n/format';
import { cx } from '@/ui';
import { LanguageSwitch } from './LanguageSwitch';
import { LogoMark } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useLastUpdated } from './useLastUpdated';
import './shell.css';

/**
 * The bar's sections. Blocks, Schedule and Budget are places on Today (the rail, tonight's
 * schedule card, the Water tab), so only Today and Field can be the current page.
 */
const SECTIONS = [
  { to: '/today', key: 'today', page: true },
  { to: '/today#blocks', key: 'blocks', page: false },
  { to: '/today#schedule', key: 'schedule', page: false },
  { to: '/today#budget', key: 'budget', page: false },
  { to: '/field', key: 'field', page: true },
] as const;

/** The phone and tablet bar, where the section tabs don't fit. */
const BOTTOM_NAV = [
  { to: '/today', key: 'today' },
  { to: '/field', key: 'field' },
  { to: '/making-of', key: 'about' },
] as const;

/** Header (logo, sections, honest data badges, language, theme) and a phone bottom bar. */
export function AppShell() {
  const { t } = useTranslation();
  const locale = useLocale();
  const plan = usePlanToday();
  const lastUpdated = useLastUpdated();
  const main = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const shownPath = useRef(pathname);
  const isToday = pathname === '/today';

  // Route changes move focus to the new page's <h1> (its name is read out), or to <main> while
  // the page is still loading. Compared with the last path (not a first-render flag, which
  // StrictMode's double effect defeats); ScrollRestoration owns the scroll, so never scroll.
  useEffect(() => {
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    const h1 = main.current?.querySelector('h1');
    if (h1) h1.tabIndex = -1;
    (h1 ?? main.current)?.focus({ preventScroll: true });
  }, [pathname]);

  const attention = plan.data?.decisions.filter(needsAttention).length;

  return (
    <div className={cx('sq-app', isToday && 'is-cockpit')}>
      <ScrollRestoration />
      <a
        href="#main"
        className="sr-only rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
      >
        {t('shell.skipToContent')}
      </a>

      <header className="top" data-shell-top>
        {/* Named by its visible text (brand + farm), so the label matches what's shown. */}
        <Link to="/" className="logo">
          <LogoMark />
          <span className="logo-name">{t('shell.brand')}</span>
          <span className="lbl">{t('shell.farm')}</span>
        </Link>

        <nav className="tabs" aria-label={t('shell.nav.label')}>
          {SECTIONS.map((s) =>
            s.page ? (
              <NavLink key={s.key} to={s.to} end>
                {t(`shell.nav.${s.key}`)}
              </NavLink>
            ) : (
              <Link key={s.key} to={s.to}>
                {t(`shell.nav.${s.key}`)}
              </Link>
            ),
          )}
        </nav>

        <div className="top-end">
          <span className="tb-pill simb">
            <span aria-hidden="true" className="dot sim" />
            <span className="max-[640px]:sr-only">{t('shell.simulated')}</span>
          </span>
          {lastUpdated > 0 ? (
            <span className="tb-pill fresh">
              <span aria-hidden="true" className="dot live" />
              <UpdatedLabel time={formatTimeGst(new Date(lastUpdated).toISOString(), locale)} />
            </span>
          ) : null}
          {attention ? (
            <Link to="/today#attention" className="tb-pill">
              <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 11V7a4 4 0 0 1 8 0v4l1.2 1.5H2.8zM6.5 14h3" className="ic" />
              </svg>
              <b>{attention}</b>{' '}
              <span className="max-[640px]:sr-only">
                {t('shell.needAttention', { count: attention })}
              </span>
            </Link>
          ) : null}
          <LanguageSwitch />
          <ThemeToggle />
          <span role="img" aria-label={t('shell.farmManager')} className="avatar">
            FM
          </span>
        </div>
      </header>

      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className={cx(
          'focus:outline-none',
          isToday
            ? 'flex min-h-0 flex-1 flex-col'
            : 'mx-auto w-full max-w-[1440px] px-2 pt-2 pb-6 sm:px-4 md:pb-16',
        )}
      >
        <Outlet />
      </main>

      <nav
        aria-label={t('shell.nav.label')}
        className="sq-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-overlay pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-3">
          {BOTTOM_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                className={({ isActive }) =>
                  cx(
                    'flex min-h-14 items-center justify-center border-t-2 text-sm font-medium no-underline',
                    isActive
                      ? 'border-primary text-text-primary'
                      : 'border-transparent text-text-secondary',
                  )
                }
              >
                {t(`shell.nav.${item.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** "Updated 21:04 GST" in the reference's mono; the time stays a figure in every locale. */
function UpdatedLabel({ time }: { time: string }) {
  const { t } = useTranslation();
  const [before = '', after = ''] = t('shell.updated', { time: '\u0000' }).split('\u0000');
  return (
    <span className="m">
      {before}
      <bdi>{time}</bdi>
      {after}
    </span>
  );
}
