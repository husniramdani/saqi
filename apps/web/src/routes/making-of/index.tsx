import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LanguageSwitch } from '@/app/LanguageSwitch';
import { LogoMark } from '@/app/Logo';
import { usePageTitle } from '@/app/usePageTitle';
import { useLocale } from '@/i18n';
import { formatNumber } from '@/i18n/format';
import { getFlip, loadMapPlugins, loadStoryPlugins, useGSAP, useMotion } from '@/motion';
import { FALLBACK_STATS, fetchTestStats } from './data';
import { AuthorScene, DesignScene, ReasonsScene, TestsScene, WaterScene } from './scenes';
import { buildStory } from './storyMotion';

/** `/making-of`: how Saqi is built, in five scenes. Own minimal header, no app shell (plan/05 §0). */
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  usePageTitle(t('makingOf.title'));
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-10">
      <header className="flex min-h-14 items-center justify-between gap-4 py-2">
        <Link
          to="/"
          aria-label={t('shell.home')}
          className="inline-flex min-h-11 items-center gap-2.5 text-text-primary no-underline"
        >
          <LogoMark />
          <span className="text-lg font-semibold tracking-[-0.02em]">{t('shell.brand')}</span>
        </Link>
        <LanguageSwitch />
      </header>
      {/* Keyed by locale: a language switch reverts every split and pin before React swaps text. */}
      <Story key={locale} />
    </div>
  );
}

function Story() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { forceReduced } = useMotion();
  const root = useRef<HTMLElement>(null);
  const stats = useQuery({
    queryKey: ['test-stats'],
    queryFn: fetchTestStats,
    staleTime: Infinity,
  });
  const shown = stats.data ?? FALLBACK_STATS;

  useGSAP(
    () => {
      // The OS preference is handled inside buildStory's matchMedia; the kitchen toggle here.
      if (forceReduced) return undefined;
      let revert: (() => void) | undefined;
      let cancelled = false;
      // Measure after the fonts settle, or every pin and line split is off by the swap.
      void Promise.all([loadStoryPlugins(), loadMapPlugins(), document.fonts?.ready]).then(
        ([plugins]) => {
          const Flip = getFlip();
          if (cancelled || !root.current || !Flip) return;
          revert = buildStory(root.current, { ...plugins, Flip }, (v, digits) =>
            formatNumber(v, locale, digits),
          );
        },
      );
      return () => {
        cancelled = true;
        revert?.();
      };
    },
    // revertOnUpdate: without it a dependency change (the stats arriving) stacks a second build.
    { dependencies: [forceReduced, stats.data], revertOnUpdate: true },
  );

  return (
    <main ref={root} className="group">
      <div className="flex flex-col gap-6 py-16 md:py-24">
        <h1 className="text-[56px] leading-none font-light tracking-[-0.05em] sm:text-display">
          {t('makingOf.title')}
        </h1>
        <p className="max-w-[56ch] text-xl text-text-secondary">{t('makingOf.intro')}</p>
      </div>
      <DesignScene />
      <WaterScene />
      <ReasonsScene />
      <TestsScene stats={shown} />
      <AuthorScene />
    </main>
  );
}
