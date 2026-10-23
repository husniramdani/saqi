import { farm07 } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import {
  blockRect,
  isStale,
  nextInOrder,
  placeTooltip,
  readingOrder,
  scheduledTonight,
  tagFontSize,
  utilityLabelSize,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  zoomViewBox,
} from './geometry';
import { scenarioDecisions, scenarioSchedule } from './scenario';

const blocks = farm07.blocks.map((b) => ({ id: b.id, rect: blockRect(b.geometry.points) }));

describe('farm map geometry', () => {
  it('reads a block rectangle from its polygon points', () => {
    expect(blockRect('40,40 300,40 300,230 40,230')).toEqual({
      x: 40,
      y: 40,
      width: 260,
      height: 190,
    });
  });

  it.each([
    [1, 22], // full width: the canvas size
    [0.343, 36.44], // 375 px phone: grows so codes stay ≥ 12.5 px on screen
    [0.2, 40], // capped to fit G-2, the shortest block
  ])('tag font at scale %d is %d units', (scale, units) => {
    expect(tagFontSize(scale)).toBeCloseTo(units, 1);
    expect(Math.min(units, 40) * scale >= 8).toBe(true);
  });

  it.each([
    [1, 17],
    [0.64, 18.75],
    [0.5, 24],
  ])('utility labels at scale %d are %d units: never under 12 px on screen', (scale, units) => {
    expect(utilityLabelSize(scale)).toBeCloseTo(units, 5);
  });

  it('drops utility labels where 12 px would make the strip collide (a phone-sized map)', () => {
    expect(utilityLabelSize(0.33)).toBeNull();
  });

  it('walks blocks in reading order, mirrored within rows for RTL', () => {
    expect(readingOrder(blocks, false)).toEqual(['D-1', 'D-2', 'G-1', 'G-2', 'D-3', 'D-4', 'F-1']);
    expect(readingOrder(blocks, true)).toEqual(['G-1', 'D-2', 'D-1', 'G-2', 'F-1', 'D-4', 'D-3']);
    expect(nextInOrder(['a', 'b', 'c'], 'c', 1)).toBe('a');
    expect(nextInOrder(['a', 'b', 'c'], 'a', -1)).toBe('c');
  });

  it('knows which blocks are stale and which pipes carry water tonight', () => {
    expect(scenarioDecisions.filter(isStale).map((d) => d.blockId)).toEqual(['D-3']);
    expect([...scheduledTonight(scenarioSchedule)]).toEqual(['D-1', 'F-1']);
  });

  it.each([
    [1, '0 0 1000 620'], // the whole farm
    [1.5, '166.67 103.33 666.67 413.33'],
    [2, '250 155 500 310'], // a quarter of it, still centred on (500, 310)
    [0.5, '0 0 1000 620'], // clamped up to 1×
    [3, '250 155 500 310'], // clamped down to 2×
    [Number.NaN, '0 0 1000 620'],
  ])('zoom %d shows viewBox %s', (zoom, viewBox) => {
    expect(zoomViewBox(zoom)).toBe(viewBox);
  });

  it('keeps every zoom step centred on the farm', () => {
    for (let zoom = ZOOM_MIN; zoom <= ZOOM_MAX; zoom += ZOOM_STEP) {
      const [x = 0, y = 0, w = 0, h = 0] = zoomViewBox(zoom).split(' ').map(Number);
      expect(x + w / 2).toBeCloseTo(500, 1);
      expect(y + h / 2).toBeCloseTo(310, 1);
      expect(w / h).toBeCloseTo(1000 / 620, 2);
    }
  });

  const card = { width: 240, height: 100 };
  const phone = { width: 328, height: 216 };
  it.each([
    {
      when: 'there is room above the block',
      block: { left: 100, top: 150, right: 220, bottom: 200, labelX: 160 },
      bounds: { width: 600, height: 400 },
      expected: { left: 40, top: 42, side: 'above' },
    },
    {
      when: 'a top-row block on a phone has no room above',
      block: { left: 20, top: 29, right: 100, bottom: 72, labelX: 60 },
      bounds: phone,
      expected: { left: 8, top: 80, side: 'below' },
    },
    {
      when: 'neither side fits and below is roomier (slides up over the block)',
      block: { left: 260, top: 78, right: 320, bottom: 124, labelX: 300 },
      bounds: phone,
      expected: { left: 80, top: 108, side: 'below' },
    },
    {
      when: 'neither side fits and above is roomier (stops at the top edge)',
      block: { left: 100, top: 100, right: 200, bottom: 190, labelX: 150 },
      bounds: phone,
      expected: { left: 30, top: 8, side: 'above' },
    },
  ])('places the block card inside the map when $when', ({ block, bounds, expected }) => {
    const at = placeTooltip(block, card, bounds);
    expect(at).toEqual(expected);
    expect(at.left).toBeGreaterThanOrEqual(8);
    expect(at.left + card.width).toBeLessThanOrEqual(bounds.width - 8);
    expect(at.top).toBeGreaterThanOrEqual(8);
    expect(at.top + card.height).toBeLessThanOrEqual(bounds.height - 8);
  });

  it('pins a card wider than the map to the start edge rather than off it', () => {
    const block = { left: 0, top: 120, right: 100, bottom: 160, labelX: 300 };
    expect(placeTooltip(block, { width: 400, height: 60 }, phone).left).toBe(8);
  });
});
