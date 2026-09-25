import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseStructure } from '../src/systems/structures';

function loadFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(new URL(`../public/structures/${name}.json`, import.meta.url), 'utf-8'),
  );
}

describe('shipped structures (scripts/gen_structures.py output)', () => {
  it('all three parse with the expected block counts', () => {
    expect(parseStructure(loadFixture('tower')).blocks).toHaveLength(12);
    expect(parseStructure(loadFixture('bridge')).blocks).toHaveLength(9);
    expect(parseStructure(loadFixture('wall')).blocks).toHaveLength(20);
  });

  it('the watchtower mixes all three materials with stone at the base', () => {
    const tower = parseStructure(loadFixture('tower'));
    const materials = new Set(tower.blocks.map((b) => b.material));
    expect(materials).toEqual(new Set(['wood', 'stone', 'glass']));
    const lowest = tower.blocks.reduce((a, b) => (b.y > a.y ? b : a));
    expect(lowest.material).toBe('stone');
  });

  it('beam runs merge into single wide blocks', () => {
    const bridge = parseStructure(loadFixture('bridge'));
    const deck = bridge.blocks.find((b) => b.w > 300);
    expect(deck).toBeDefined();
    expect(deck!.material).toBe('wood');
    expect(deck!.w).toBeCloseTo(9 * 40); // "wwwwwwwww" at cell 40
  });
});

describe('parseStructure validation', () => {
  const valid = {
    name: 'T',
    blocks: [{ material: 'wood', x: 0, y: 0, w: 10, h: 10 }],
  };

  it('accepts a valid structure', () => {
    expect(parseStructure(valid).name).toBe('T');
  });

  it('rejects missing name, empty blocks, unknown materials, bad dims', () => {
    expect(() => parseStructure({ ...valid, name: '' })).toThrow(/name/);
    expect(() => parseStructure({ ...valid, blocks: [] })).toThrow(/block/);
    expect(() =>
      parseStructure({ name: 'x', blocks: [{ material: 'adamantium', x: 0, y: 0, w: 5, h: 5 }] }),
    ).toThrow(/index 0/);
    expect(() =>
      parseStructure({ name: 'x', blocks: [{ material: 'wood', x: 0, y: 0, w: -5, h: 5 }] }),
    ).toThrow(/index 0/);
  });

  it('rejects non-objects', () => {
    expect(() => parseStructure(undefined)).toThrow();
  });
});
