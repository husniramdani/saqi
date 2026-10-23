import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useFarm, usePlanToday } from '@/api/queries';
import { needsAttention } from '@/features/attention/risk';
import { useLocale } from '@/i18n';
import { formatTimeGst } from '@/i18n/format';
import { cx } from '@/ui';
import { LanguageSwitch } from './LanguageSwitch';
import { LogoMark } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useLastUpdated } from './useLastUpdated';

const NAV = [
  { to: '/today', key: 'today', end: true },
  { to: '/field', key: 'field', end: false },
  { to: '/making-of', key: 'makingOf', end: false },
] as const;

const pill =
  // No display value here: each pill sets its own, so `hidden sm:inline-flex` can't lose to it.
  'min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3 text-sm font-medium text-text-secondary no-underline';
const dot = 'inline-block shrink-0 rounded-full';

/** Header (logo, sections, honest data badges, language, theme) and a phone bottom bar. */
export function AppShell() {
  const { t } = useTranslation();
  const locale = useLocale();
  const farm = useFarm();
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
    <div
      className={cx(
        'flex min-h-dvh flex-col',
        isToday && 'min-[1180px]:h-dvh min-[1180px]:overflow-hidden',
      )}
    >
      <ScrollRestoration />
      <a
        href="#main"
        className="sr-only rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
      >
        {t('shell.skipToContent')}
      </a>

      <header className="shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <Link
              to="/"
              aria-label={t('shell.home')}
              className="inline-flex min-h-11 items-center gap-2.5 text-text-primary no-underline"
            >
              <LogoMark />
              <span className="text-lg font-semibold tracking-[-0.02em]">{t('shell.brand')}</span>
            </Link>
            <span className="hidden border-s border-border ps-3 text-sm font-medium whitespace-nowrap text-text-muted xl:inline">
              {farm.data?.name[locale] ?? t('shell.farm')}
            </span>
          </div>

          <nav aria-label={t('shell.nav.label')} className="hidden md:block">
            <ul className="flex gap-0.5 rounded-full bg-surface-well p-[3px]">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cx(
                        'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap no-underline',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-text-secondary hover:bg-surface hover:text-text-primary',
                      )
                    }
                  >
                    {t(`shell.nav.${item.key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <span
              className={cx(pill, 'inline-flex max-sm:border-0 max-sm:bg-transparent max-sm:px-1')}
            >
              <span
                aria-hidden="true"
                className={cx(dot, 'size-[9px] border-[1.5px] border-dashed border-accent-text')}
              />
              <span className="max-sm:sr-only">{t('shell.simulated')}</span>
            </span>
            {lastUpdated > 0 ? (
              <span className={cx(pill, 'hidden lg:inline-flex')}>
                <span aria-hidden="true" className={cx(dot, 'size-2 bg-success')} />
                <UpdatedLabel time={formatTimeGst(new Date(lastUpdated).toISOString(), locale)} />
              </span>
            ) : null}
            {attention ? (
              <Link to="/today#attention" className={cx(pill, 'hidden min-[1320px]:inline-flex')}>
                <b className="num font-semibold text-accent-text">{attention}</b>
                {t('shell.needAttention', { count: attention })}
              </Link>
            ) : null}
            <LanguageSwitch />
            <ThemeToggle />
            <span
              aria-label={t('shell.farmManager')}
              className="num hidden size-11 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground sm:inline-flex"
            >
              FM
            </span>
          </div>
        </div>
      </header>

      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className={cx(
          'focus:outline-none',
          isToday
            ? 'min-h-0 flex-1 p-3 pb-28 md:pb-3 min-[1180px]:max-w-none'
            : 'mx-auto w-full max-w-[1440px] px-4 pt-4 pb-28 sm:px-6 md:pb-16',
        )}
      >
        <Outlet />
      </main>

      <nav
        aria-label={t('shell.nav.label')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-overlay pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-3">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-14 items-center justify-center border-t-2 text-sm font-medium no-underline',
                    isActive
                      ? 'border-primary text-text-primary'
                      : 'border-transparent text-text-secondary',
                  )
                }
              >
                {t(item.key === 'makingOf' ? 'shell.nav.about' : `shell.nav.${item.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** "Updated 21:04 GST": only the time is a mono figure; the words follow the locale's font. */
function UpdatedLabel({ time }: { time: string }) {
  const { t } = useTranslation();
  const [before = '', after = ''] = t('shell.updated', { time: '\u0000' }).split('\u0000');
  return (
    <span>
      {before}
      <span className="num">{time}</span>
      {after}
    </span>
  );
}
