import type { Block, Farm, Sensor } from './schemas/farm';

/** Total available water in the root zone, mm: (FC − WP) × root depth. */
export const tawMm = (block: Pick<Block, 'fc' | 'wp' | 'rootDepthMm'>): number =>
  (block.fc - block.wp) * block.rootDepthMm;

export function blockById(farm: Farm, id: string): Block {
  const block = farm.blocks.find((b) => b.id === id);
  if (!block) throw new Error(`Unknown block ${id}`);
  return block;
}

export const sensorsForBlock = (farm: Farm, blockId: string): Sensor[] =>
  farm.sensors.filter((s) => s.blockId === blockId);

export const isNightBlock = (block: Pick<Block, 'mode'>): boolean => block.mode === 'night';
