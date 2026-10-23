/**
 * The 8 daily task templates from plan/03-data-model.md §4.6. Dates are filled at seed time.
 * Arabic titles: translations machine-assisted, review welcome.
 */
import type { TaskTemplate } from '../schemas/tasks';

export const taskTemplates: TaskTemplate[] = [
  {
    key: 'd3-sensor',
    blockId: 'D-3',
    kind: 'inspect',
    assignee: 'rahim',
    title: {
      en: 'Check 60 cm sensor, no data since 12:00',
      ar: 'افحص حساس 60 سم، لا بيانات منذ 12:00',
    },
  },
  {
    key: 'd1-bubblers',
    blockId: 'D-1',
    kind: 'maintenance',
    assignee: 'rahim',
    title: {
      en: 'Clear bubblers, row 4',
      ar: 'نظّف الفوّارات، الصف 4',
    },
  },
  {
    key: 'd2-weevil',
    blockId: 'D-2',
    kind: 'pest',
    assignee: 'rahim',
    title: {
      en: 'Red palm weevil trap check, traps 1–6',
      ar: 'فحص مصائد سوسة النخيل الحمراء، المصائد 1–6',
    },
  },
  {
    key: 'g1-filter',
    blockId: 'G-1',
    kind: 'maintenance',
    assignee: 'imran',
    title: { en: 'Flush drip filter', ar: 'اغسل فلتر التنقيط' },
  },
  {
    key: 'g2-drain-ec',
    blockId: 'G-2',
    kind: 'record',
    assignee: 'imran',
    title: { en: 'Record drain EC', ar: 'سجّل ملوحة مياه الصرف (EC)' },
  },
  {
    key: 'f1-pressure',
    blockId: 'F-1',
    kind: 'inspect',
    assignee: 'imran',
    title: {
      en: 'Check sprinkler pressure, lateral 3',
      ar: 'افحص ضغط الرشاشات، الخط الفرعي 3',
    },
  },
  {
    key: 'farm-tank',
    blockId: null,
    kind: 'record',
    assignee: 'rahim',
    title: {
      en: 'Record tank T-1 level at 06:00',
      ar: 'سجّل منسوب الخزان T-1 الساعة 06:00',
    },
  },
  {
    key: 'd4-subsurface',
    blockId: 'D-4',
    kind: 'inspect',
    assignee: 'imran',
    title: {
      en: 'Walk subsurface line for wet spots',
      ar: 'تفقّد خط التنقيط تحت السطحي بحثاً عن بقع رطبة',
    },
  },
];
