import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useFarm } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { useLocale } from '@/i18n';

// TODO(T19): the five-scene scroll story.
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const farm = useFarm();

  return (
    <>
      <header>
        <Link to="/">{t('makingOf.home')}</Link>
      </header>
      <main>
        <h1>{t('makingOf.title')}</h1>
        <p>{t('makingOf.intro')}</p>
        <QueryState query={farm}>
          {(f) => <p>{t('makingOf.farm', { name: f.name[locale], count: f.blocks.length })}</p>}
        </QueryState>
      </main>
    </>
  );
}
