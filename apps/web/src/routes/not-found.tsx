import { useTranslation } from 'react-i18next';
import { NotFound } from '@/app/NotFound';
import { usePageTitle } from '@/app/usePageTitle';

export function Component() {
  const { t } = useTranslation();
  usePageTitle(t('state.notFound'));
  return <NotFound title={t('state.notFound')} />;
}
