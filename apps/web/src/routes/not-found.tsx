import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { buttonClasses, PillArrow } from '@/ui';

export function Component() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-6 pt-16">
      <span className="num text-sm text-text-muted">404</span>
      <h1 className="text-4xl font-light tracking-[-0.035em]">{t('state.notFound')}</h1>
      <Link to="/" className={buttonClasses({ variant: 'ink', arrow: true })}>
        {t('state.home')} <PillArrow variant="ink" />
      </Link>
    </div>
  );
}
