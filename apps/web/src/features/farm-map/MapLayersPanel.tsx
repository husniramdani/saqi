import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { SwitchTrack } from '@/ui';
import { MAP_LAYER_KEYS, type MapLayerKey, type MapLayers } from './layers';

/** One full-width pressed button per map layer: its name, what it draws, and a switch. */
export function MapLayersPanel({
  layers,
  onToggle,
}: {
  layers: MapLayers;
  onToggle: (key: MapLayerKey) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <ul aria-label={t('mapControls.layers.title')} className="flex flex-col gap-1">
      {MAP_LAYER_KEYS.map((key) => (
        <li key={key}>
          <button
            type="button"
            aria-pressed={layers[key]}
            aria-labelledby={`${id}-${key}`}
            aria-describedby={`${id}-${key}-hint`}
            onClick={() => onToggle(key)}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start hover:bg-surface-well"
          >
            <span className="flex min-w-0 flex-col">
              <span id={`${id}-${key}`} className="text-sm font-medium text-text-primary">
                {t(`mapControls.layers.${key}.name`)}
              </span>
              <span id={`${id}-${key}-hint`} className="text-xs text-text-secondary">
                {t(`mapControls.layers.${key}.hint`)}
              </span>
            </span>
            <SwitchTrack on={layers[key]} />
          </button>
        </li>
      ))}
    </ul>
  );
}
