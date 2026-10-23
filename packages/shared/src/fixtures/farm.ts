/**
 * Farm 07, Al Ain: a fictional farm. Every number comes from plan/03-data-model.md §1.
 * Arabic names: translations machine-assisted, review welcome.
 */
import type { Block, Farm, Sensor } from '../schemas/farm';

// Shared soil and emitter values of the four palm blocks (sandy loam, bubblers).
const palmSoil = {
  crop: 'date_palm',
  fc: 0.18,
  wp: 0.06,
  rootDepthMm: 600,
  kc: 0.95,
  et0Factor: 1.0,
  pawThreshold: 65,
  pawTarget: 90,
  priority: 2,
  sourceId: 'TSE-1',
  mode: 'night',
} as const;

const greenhouse = {
  areaHa: 0.25,
  trees: null,
  method: 'drip',
  efficiency: 0.92,
  wettedFraction: 0.6,
  fc: 0.45,
  wp: 0.15,
  rootDepthMm: 150,
  et0Factor: 0.7,
  pawThreshold: 75,
  pawTarget: 92,
  flowM3h: 12,
  priority: 1,
  sourceId: 'RO-1',
  mode: 'pulse',
} as const;

const blocks: Block[] = [
  {
    ...palmSoil,
    id: 'D-1',
    name: { en: 'Khalas palms', ar: 'نخيل خلاص' },
    variety: 'Khalas',
    areaHa: 1.2,
    trees: 120,
    method: 'bubbler',
    efficiency: 0.85,
    wettedFraction: 0.3,
    flowM3h: 30,
    fixedScheduleM3Day: 30,
    geometry: {
      points: '40,40 300,40 300,230 40,230',
      label: { x: 170, y: 135 },
      pipePath: 'M460 540 V455 H310 V240 H170 V230',
    },
  },
  {
    ...palmSoil,
    id: 'D-2',
    name: { en: 'Lulu palms', ar: 'نخيل لولو' },
    variety: 'Lulu',
    areaHa: 1.0,
    trees: 96,
    method: 'bubbler',
    efficiency: 0.85,
    wettedFraction: 0.3,
    flowM3h: 25,
    fixedScheduleM3Day: 25,
    geometry: {
      points: '320,40 580,40 580,230 320,230',
      label: { x: 450, y: 135 },
      pipePath: 'M460 540 V455 H600 V240 H450 V230',
    },
  },
  {
    ...palmSoil,
    id: 'D-3',
    name: { en: 'Fard palms', ar: 'نخيل فرض' },
    variety: 'Fard',
    areaHa: 0.9,
    trees: 80,
    method: 'bubbler',
    efficiency: 0.85,
    wettedFraction: 0.3,
    flowM3h: 24,
    fixedScheduleM3Day: 23,
    geometry: {
      points: '40,250 300,250 300,440 40,440',
      label: { x: 170, y: 345 },
      pipePath: 'M460 540 V455 H170 V440',
    },
  },
  {
    ...palmSoil,
    id: 'D-4',
    name: { en: 'Barhi palms', ar: 'نخيل برحي' },
    variety: 'Barhi',
    areaHa: 0.7,
    trees: 64,
    method: 'subsurface_drip',
    efficiency: 0.92,
    wettedFraction: 0.25,
    flowM3h: 18,
    fixedScheduleM3Day: 14,
    geometry: {
      points: '320,250 580,250 580,440 320,440',
      label: { x: 450, y: 345 },
      pipePath: 'M460 540 V455 H450 V440',
    },
  },
  {
    ...greenhouse,
    id: 'G-1',
    name: { en: 'Tomato house', ar: 'بيت الطماطم' },
    crop: 'tomato',
    variety: 'soilless (coco)',
    kc: 1.15,
    fixedScheduleM3Day: 10,
    geometry: {
      points: '620,40 960,40 960,130 620,130',
      label: { x: 790, y: 85 },
      pipePath: 'M460 540 V455 H600 V85 H620',
    },
  },
  {
    ...greenhouse,
    id: 'G-2',
    name: { en: 'Cucumber house', ar: 'بيت الخيار' },
    crop: 'cucumber',
    variety: 'soilless (coco)',
    kc: 1.0,
    fixedScheduleM3Day: 9,
    geometry: {
      points: '620,145 960,145 960,230 620,230',
      label: { x: 790, y: 187 },
      pipePath: 'M460 540 V455 H600 V187 H620',
    },
  },
  {
    id: 'F-1',
    name: { en: 'Rhodes grass', ar: 'حشيشة الرودس' },
    crop: 'fodder',
    variety: 'Rhodes grass',
    areaHa: 1.0,
    trees: null,
    method: 'sprinkler',
    efficiency: 0.75,
    wettedFraction: 1.0,
    fc: 0.16,
    wp: 0.05,
    rootDepthMm: 400,
    kc: 0.9,
    et0Factor: 1.0,
    pawThreshold: 50,
    pawTarget: 75,
    flowM3h: 45,
    priority: 3,
    sourceId: 'TSE-1',
    fixedScheduleM3Day: 90,
    mode: 'night',
    geometry: {
      points: '620,250 960,250 960,440 620,440',
      label: { x: 790, y: 345 },
      pipePath: 'M460 540 V455 H790 V440',
    },
  },
];

// Open-field blocks: 30 cm (weight 0.6) and 60 cm (weight 0.4). Greenhouses: one substrate sensor.
const sensors: Sensor[] = blocks.flatMap((b): Sensor[] =>
  b.mode === 'pulse'
    ? [{ id: `${b.id}-S`, blockId: b.id, depthCm: null, kind: 'substrate', weight: 1 }]
    : [
        { id: `${b.id}-30`, blockId: b.id, depthCm: 30, kind: 'soil', weight: 0.6 },
        { id: `${b.id}-60`, blockId: b.id, depthCm: 60, kind: 'soil', weight: 0.4 },
      ],
);

export const farm07: Farm = {
  id: 'farm-07',
  // Western digits in every locale (design.md typography rule).
  name: {
    en: 'Farm 07, Al Ain (fictional)',
    ar: 'مزرعة 07، العين (خيالية)',
  },
  lat: 24.21,
  lon: 55.74,
  timezone: 'Asia/Dubai',
  pumpCapacityM3h: 60,
  nightWindow: { start: '22:00', end: '05:00' },
  pulseTimes: ['07:00', '11:00', '15:00'],
  sources: [
    {
      id: 'W-1',
      kind: 'well',
      name: {
        en: 'Well W-1 (brackish, EC 4.8 dS/m)',
        ar: 'بئر W-1 (مياه قليلة الملوحة، EC 4.8 dS/m)',
      },
      ecDsM: 4.8,
    },
    {
      id: 'RO-1',
      kind: 'ro',
      name: { en: 'RO unit', ar: 'وحدة التناضح العكسي' },
      ecDsM: null,
    },
    {
      id: 'TSE-1',
      kind: 'tse',
      name: {
        en: 'Recycled water line (TSE)',
        ar: 'خط المياه المعالجة (TSE)',
      },
      ecDsM: null,
    },
  ],
  blocks,
  sensors,
  // Utility strip, y 470–600.
  utilities: [
    { id: 'W-1', kind: 'well', label: 'W-1', shape: 'circle', x: 120, y: 540, r: 22 },
    { id: 'RO-1', kind: 'ro', label: 'RO', shape: 'rect', x: 210, y: 520, width: 50, height: 40 },
    { id: 'T-1', kind: 'tank', label: 'T-1', shape: 'circle', x: 300, y: 540, r: 30 },
    { id: 'P', kind: 'pump', label: 'P', shape: 'rect', x: 440, y: 520, width: 40, height: 40 },
    { id: 'TSE-1', kind: 'tse', label: 'TSE', shape: 'circle', x: 900, y: 560, r: 10 },
  ],
};
