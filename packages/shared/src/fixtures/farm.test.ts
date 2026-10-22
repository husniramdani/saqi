import { describe, expect, it } from 'vitest';
import { blockById, sensorsForBlock, tawMm } from '../derive';
import { FarmSchema } from '../schemas/farm';
import { TaskTemplateSchema } from '../schemas/tasks';
import { gstDate } from '../time';
import { farm07 } from './farm';
import { taskTemplates } from './tasks';

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('farm07 fixture', () => {
  it('parses with FarmSchema', () => {
    expect(() => FarmSchema.parse(farm07)).not.toThrow();
  });

  it.each([
    ['D-1', 72],
    ['F-1', 44],
    ['G-1', 45],
  ])('TAW of %s is %d mm', (id, taw) => {
    expect(tawMm(blockById(farm07, id))).toBeCloseTo(taw, 9);
  });

  it('has unique block, sensor and source ids', () => {
    expect(farm07.blocks).toHaveLength(7);
    expect(unique(farm07.blocks.map((b) => b.id))).toBe(true);
    expect(unique(farm07.sensors.map((s) => s.id))).toBe(true);
    expect(unique(farm07.sources.map((s) => s.id))).toBe(true);
  });

  it('gives every sensor an existing block and every block its sensors', () => {
    const blockIds = new Set(farm07.blocks.map((b) => b.id));
    expect(farm07.sensors.every((s) => blockIds.has(s.blockId))).toBe(true);
    expect(farm07.sensors).toHaveLength(12);
    expect(sensorsForBlock(farm07, 'D-1').map((s) => s.id)).toEqual(['D-1-30', 'D-1-60']);
    expect(sensorsForBlock(farm07, 'G-1').map((s) => s.id)).toEqual(['G-1-S']);
  });

  it('starts every pipe path at the pump', () => {
    for (const b of farm07.blocks) expect(b.geometry.pipePath.startsWith('M460 540')).toBe(true);
  });

  it('points every block at a known water source', () => {
    const sourceIds = new Set(farm07.sources.map((s) => s.id));
    expect(farm07.blocks.every((b) => sourceIds.has(b.sourceId))).toBe(true);
  });
});

describe('taskTemplates', () => {
  it('has 8 valid templates with unique keys', () => {
    expect(taskTemplates).toHaveLength(8);
    for (const t of taskTemplates) expect(() => TaskTemplateSchema.parse(t)).not.toThrow();
    expect(unique(taskTemplates.map((t) => t.key))).toBe(true);
  });
});

describe('gstDate', () => {
  it('rolls over to the next day at 20:00 UTC', () => {
    expect(gstDate('2026-10-23T19:59:00Z')).toBe('2026-10-23');
    expect(gstDate('2026-10-23T20:00:00Z')).toBe('2026-10-24');
  });
});
