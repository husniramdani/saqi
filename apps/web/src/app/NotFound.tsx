import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { buttonClasses, PillArrow } from '@/ui';

/** The one 404 look: an unknown route or a block that isn't on Farm 07. Always a way back. */
export function NotFound({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex max-w-[56ch] flex-col items-start gap-6 pt-16">
      <span className="num text-sm text-accent-text">404</span>
      <h1 className="text-4xl font-light tracking-[-0.035em]">{title}</h1>
      <p className="text-lg text-text-secondary">{t('state.notFoundBody')}</p>
      <div className="flex flex-wrap gap-3">
        <Link to="/" className={buttonClasses({ variant: 'ink', arrow: true })}>
          {t('state.home')} <PillArrow variant="ink" />
        </Link>
        <Link to="/field" className={buttonClasses({ variant: 'ghost' })}>
          {t('block.openField')}
        </Link>
      </div>
    </div>
  );
}
