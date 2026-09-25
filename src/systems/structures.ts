/** Structure file parsing (emitted by scripts/gen_structures.py). */

import type { Material } from '../config';
import { MATERIALS } from '../config';

export interface StructureBlock {
  material: Material;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Structure {
  name: string;
  blocks: StructureBlock[];
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function parseStructure(data: unknown): Structure {
  if (typeof data !== 'object' || data === null) throw new Error('structure: expected object');
  const s = data as Partial<Structure>;
  if (typeof s.name !== 'string' || s.name.length === 0) throw new Error('structure: missing name');
  if (!Array.isArray(s.blocks) || s.blocks.length === 0) {
    throw new Error('structure: needs at least one block');
  }
  s.blocks.forEach((b, i) => {
    if (
      !MATERIALS.includes(b.material as Material) ||
      !isFiniteNumber(b.x) ||
      !isFiniteNumber(b.y) ||
      !isFiniteNumber(b.w) ||
      !isFiniteNumber(b.h) ||
      b.w <= 0 ||
      b.h <= 0
    ) {
      throw new Error(`structure: invalid block at index ${i}`);
    }
  });
  return { name: s.name, blocks: s.blocks as StructureBlock[] };
}
