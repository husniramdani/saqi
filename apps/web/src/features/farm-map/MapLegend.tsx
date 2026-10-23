import { useTranslation } from 'react-i18next';

const STEPS = [0, 1, 2, 3, 4, 5, 6];

/** The map's water scale, dry → wet (design/dashboard.html `.legend`). Mirrors with the page. */
export function MapLegend() {
  const { t } = useTranslation();
  return (
    <div role="img" aria-label={t('mapControls.legend')} className="glass legend">
      <span aria-hidden="true" className="lbl">
        {t('map.dry')}
      </span>
      {STEPS.map((s) => (
        <span
          key={s}
          aria-hidden="true"
          className="s"
          style={{ background: `var(--color-water-${s})` }}
        />
      ))}
      <span aria-hidden="true" className="lbl">
        {t('map.wet')}
      </span>
    </div>
  );
}
