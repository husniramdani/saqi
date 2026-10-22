import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function Component() {
  const { t } = useTranslation();
  return (
    <>
      <h1>{t('state.notFound')}</h1>
      <p>
        <Link to="/">{t('state.home')}</Link>
      </p>
    </>
  );
}
