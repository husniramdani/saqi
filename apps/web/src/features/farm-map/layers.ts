/** The map's switchable layers, in the order the Layers panel lists them. */
export type MapLayerKey = 'paw' | 'flow' | 'stale' | 'texture' | 'pipes' | 'labels' | 'utilities';

export type MapLayers = Record<MapLayerKey, boolean>;

export const MAP_LAYER_KEYS: readonly MapLayerKey[] = [
  'paw',
  'flow',
  'stale',
  'texture',
  'pipes',
  'labels',
  'utilities',
];

/** Everything on: the map as every caller drew it before layers existed. */
export const DEFAULT_MAP_LAYERS: Readonly<MapLayers> = Object.freeze({
  paw: true,
  flow: true,
  stale: true,
  texture: true,
  pipes: true,
  labels: true,
  utilities: true,
});
