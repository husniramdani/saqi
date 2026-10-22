import { blockById, farm07 } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { blockPaw } from './paw';
import { NOW, pair, series } from './test-helpers';

const D1 = blockById(farm07, 'D-1');

describe('blockPaw', () => {
  it.each([
    ['both fresh and close', pair('D-1', 70, 65), 68, 'high'],
    ['fresh but 20 points apart (case 8)', pair('D-1', 80, 60), 72, 'medium'],
    ['exactly 12 points apart stays high', pair('D-1', 72, 60), 67.2, 'high'],
    ['single substrate sensor', [series('G-1-S', 80)], 80, 'high'],
  ] as const)('%s', (_label, sensors, paw, confidence) => {
    const info = blockPaw(D1, [...sensors], NOW);
    expect(info.paw).toBeCloseTo(paw, 9);
    expect(info.confidence).toBe(confidence);
    expect(info.staleSensors).toEqual([]);
  });

  it('uses only the fresh sensor when the other is stale (case 6)', () => {
    const info = blockPaw(D1, pair('D-3', 75, 40, 9), NOW);
    expect(info.paw).toBe(75);
    expect(info.confidence).toBe('low');
    expect(info.staleSensors).toEqual([{ sensorId: 'D-3-60', hours: 9 }]);
  });

  it('treats exactly 3 h old as fresh and just over as stale', () => {
    expect(blockPaw(D1, [series('a', 50, { ageHours: 3 })], NOW).paw).toBe(50);
    expect(blockPaw(D1, [series('a', 50, { ageHours: 3.01 })], NOW).paw).toBeNull();
  });

  it('returns no PAW when every sensor is stale (case 7)', () => {
    const info = blockPaw(
      D1,
      [series('a', 60, { ageHours: 5 }), series('b', 60, { ageHours: 7 })],
      NOW,
    );
    expect(info).toEqual({
      paw: null,
      confidence: 'low',
      staleSensors: [
        { sensorId: 'a', hours: 5 },
        { sensorId: 'b', hours: 7 },
      ],
    });
  });

  it('treats a sensor with no points as stale', () => {
    const empty = { ...series('a', 60), points: [] };
    expect(blockPaw(D1, [empty], NOW).paw).toBeNull();
  });

  it('returns no PAW when there are no sensors at all', () => {
    expect(blockPaw(D1, [], NOW)).toEqual({ paw: null, confidence: 'low', staleSensors: [] });
  });
});
