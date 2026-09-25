import type { GameConfig, Material, MaterialSpec } from '../config';

export interface BodyOptions {
  density: number;
  restitution: number;
  friction: number;
}

/** Matter body options for a material. */
export function bodyOptionsFor(material: Material, cfg: GameConfig): BodyOptions {
  const spec = cfg.materials[material];
  return {
    density: spec.density,
    restitution: spec.restitution,
    friction: spec.friction,
  };
}

export function specFor(material: Material, cfg: GameConfig): MaterialSpec {
  return cfg.materials[material];
}

/**
 * Material-aware damage: nothing under the material's threshold, then linear
 * in the excess at the material's scale. Glass chips where stone shrugs.
 */
export function damageFor(impulse: number, material: Material, cfg: GameConfig): number {
  const spec = cfg.materials[material];
  return Math.max(0, impulse - spec.damageThreshold) * spec.damageScale;
}

/** Impulse proxy shared with the collision handler. */
export function collisionImpulse(relativeSpeed: number, massA: number, massB: number): number {
  const effectiveMass = Math.min(massA, massB);
  if (!Number.isFinite(effectiveMass)) return 0;
  return relativeSpeed * effectiveMass;
}
