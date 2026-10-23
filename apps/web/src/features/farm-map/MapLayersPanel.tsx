import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { duration, ease, gsap, useGSAP, useMotion } from '@/motion';
import { MAP_LAYER_KEYS, type MapLayerKey, type MapLayers } from './layers';

/** Knob travel inside the 38 × 22 switch (design/dashboard.html `.sw`). */
const TRAVEL = 16;

/** One full-width pressed button per map layer (design/dashboard.html `.lrow`): name, what it draws, a switch. */
export function MapLayersPanel({
  layers,
  onToggle,
}: {
  layers: MapLayers;
  onToggle: (key: MapLayerKey) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const root = useRef<HTMLUListElement>(null);
  const { reduced } = useMotion();
  const previous = useRef(layers);

  // The knob's resting side is CSS (mirrored in RTL); a change slides it there (`step`).
  // Reduced motion: it is simply there.
  useGSAP(
    () => {
      const el = root.current;
      const before = previous.current;
      previous.current = layers;
      if (!el || reduced) return;
      const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
      for (const key of MAP_LAYER_KEYS) {
        if (layers[key] === before[key]) continue;
        gsap.from(el.querySelector(`[data-knob="${key}"]`), {
          x: layers[key] ? 0 : TRAVEL * sign,
          duration: duration.step,
          ease: ease.reveal,
          clearProps: 'transform',
        });
      }
    },
    { scope: root, dependencies: [...MAP_LAYER_KEYS.map((key) => layers[key]), reduced] },
  );

  return (
    <ul ref={root} aria-label={t('mapControls.layers.title')} className="lrows">
      {MAP_LAYER_KEYS.map((key) => (
        <li key={key}>
          <button
            type="button"
            className="lrow"
            aria-pressed={layers[key]}
            aria-labelledby={`${id}-${key}`}
            aria-describedby={`${id}-${key}-hint`}
            onClick={() => onToggle(key)}
          >
            <span>
              <span id={`${id}-${key}`} className="lrow-name">
                {t(`mapControls.layers.${key}.name`)}
              </span>
              <small id={`${id}-${key}-hint`}>{t(`mapControls.layers.${key}.hint`)}</small>
            </span>
            <span className="sw" aria-hidden="true">
              <span className="sw-knob" data-knob={key} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
