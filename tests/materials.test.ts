import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/config';
import { bodyOptionsFor, collisionImpulse, damageFor, specFor } from '../src/systems/materials';

const cfg = defaultConfig;

describe('material property application', () => {
  it('maps each material to its Matter body options', () => {
    expect(bodyOptionsFor('stone', cfg)).toEqual({
      density: cfg.materials.stone.density,
      restitution: cfg.materials.stone.restitution,
      friction: cfg.materials.stone.friction,
    });
    expect(bodyOptionsFor('glass', cfg).density).toBeLessThan(bodyOptionsFor('stone', cfg).density);
  });

  it('stone is densest, glass most fragile — config sanity', () => {
    expect(cfg.materials.stone.density).toBeGreaterThan(cfg.materials.wood.density);
    expect(cfg.materials.glass.health).toBeLessThan(cfg.materials.wood.health);
    expect(cfg.materials.glass.damageThreshold).toBeLessThan(cfg.materials.wood.damageThreshold);
    expect(cfg.materials.stone.damageThreshold).toBeGreaterThan(cfg.materials.wood.damageThreshold);
  });

  it('specFor returns the full material spec', () => {
    expect(specFor('wood', cfg).health).toBe(60);
  });
});

describe('per-material damage thresholds', () => {
  it('the same impulse chips glass, dents wood, and bounces off stone', () => {
    const impulse = 2.5;
    expect(damageFor(impulse, 'glass', cfg)).toBeGreaterThan(0);
    expect(damageFor(impulse, 'wood', cfg)).toBeGreaterThan(0);
    expect(damageFor(impulse, 'stone', cfg)).toBe(0);
  });

  it('damage is zero exactly at each threshold', () => {
    for (const m of ['wood', 'stone', 'glass'] as const) {
      expect(damageFor(cfg.materials[m].damageThreshold, m, cfg)).toBe(0);
    }
  });

  it('damage scales linearly past the threshold at the material scale', () => {
    const g = cfg.materials.glass;
    expect(damageFor(g.damageThreshold + 1, 'glass', cfg)).toBeCloseTo(g.damageScale);
    expect(damageFor(g.damageThreshold + 2, 'glass', cfg)).toBeCloseTo(2 * g.damageScale);
  });
});

describe('collisionImpulse', () => {
  it('is bounded by the lighter body and ignores static pairs', () => {
    expect(collisionImpulse(10, 3, 8)).toBe(30);
    expect(collisionImpulse(10, Infinity, 8)).toBe(80);
    expect(collisionImpulse(10, Infinity, Infinity)).toBe(0);
  });
});
