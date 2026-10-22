import { useId } from 'react';
import { useTranslation } from 'react-i18next';

const STEPS = [0, 1, 2, 3, 4, 5, 6];

/** Water scale dry → wet, the stale hatch and tonight's route. Mirrors with the page. */
export function MapLegend() {
  const { t } = useTranslation();
  const hatch = useId().replace(/:/g, '');
  return (
    <div
      role="group"
      aria-label={t('map.legendLabel')}
      className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-text-secondary"
    >
      <span className="inline-flex items-center gap-2">
        <span>{t('map.dry')}</span>
        <span className="flex gap-0.5" aria-hidden="true">
          {STEPS.map((s) => (
            <span
              key={s}
              className="h-3.5 w-5 rounded-[3px]"
              style={{ background: `var(--color-water-${s})` }}
            />
          ))}
        </span>
        <span>{t('map.wet')}</span>
      </span>
      <span className="inline-flex items-center gap-2">
        <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
          <defs>
            <pattern
              id={hatch}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--color-stale)" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="20" height="14" rx="3" fill="var(--color-surface-well)" />
          <rect width="20" height="14" rx="3" fill={`url(#${hatch})`} />
        </svg>
        {t('map.stale')}
      </span>
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-[5px] w-6 rounded-full bg-accent" />
        {t('map.route')}
      </span>
    </div>
  );
}
