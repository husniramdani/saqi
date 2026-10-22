import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useFarm } from '@/api/queries';
import { LogoMark } from '@/app/Logo';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';
import { textLinkClasses } from '@/ui';

// TODO(T19): the five-scene scroll story. Own minimal header, no app shell (plan/05 §0).
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const farm = useFarm();

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-16 px-4 py-6 sm:px-10">
      <header className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2.5 text-text-primary no-underline"
        >
          <LogoMark />
          <span className="text-lg font-semibold tracking-[-0.02em]">{t('shell.brand')}</span>
        </Link>
        <Link to="/" className={textLinkClasses}>
          {t('makingOf.home')}
        </Link>
      </header>
      <main className="flex flex-col gap-6">
        <span className="num text-sm text-accent-text">Read the soil.</span>
        <h1 className="text-[56px] leading-none font-light tracking-[-0.05em] sm:text-display">
          {t('makingOf.title')}
        </h1>
        <p className="max-w-[60ch] text-xl text-text-secondary">{t('makingOf.intro')}</p>
        <QueryState query={farm}>
          {(f) => (
            <p className="text-text-secondary">
              {t('makingOf.farm', { name: f.name[locale], count: f.blocks.length })}
            </p>
          )}
        </QueryState>
      </main>
    </div>
  );
}
