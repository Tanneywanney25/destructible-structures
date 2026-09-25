/** Central configuration: materials, strike behaviour, canvas. */

export type Material = 'wood' | 'stone' | 'glass';

export interface MaterialSpec {
  /** Matter body density. */
  density: number;
  restitution: number;
  friction: number;
  /** Hit points. */
  health: number;
  /** Impulse below this causes no damage. */
  damageThreshold: number;
  /** Damage per unit impulse beyond the threshold. */
  damageScale: number;
  fill: string;
  stroke: string;
}

export interface GameConfig {
  canvas: { width: number; height: number };
  physics: { gravityY: number };
  ground: { height: number };
  strike: {
    /** Radius of the click strike, px. */
    radius: number;
    /** Base impulse at the strike center (falls off linearly). */
    impulse: number;
    minImpulse: number;
    maxImpulse: number;
  };
  materials: Record<Material, MaterialSpec>;
}

export const defaultConfig: GameConfig = {
  canvas: { width: 1100, height: 560 },
  physics: { gravityY: 1 },
  ground: { height: 26 },
  strike: {
    radius: 130,
    impulse: 0.05,
    minImpulse: 0.01,
    maxImpulse: 0.15,
  },
  materials: {
    wood: {
      density: 0.0016,
      restitution: 0.15,
      friction: 0.55,
      health: 60,
      damageThreshold: 2.2,
      damageScale: 5,
      fill: '#a5713c',
      stroke: '#6d451f',
    },
    stone: {
      density: 0.004,
      restitution: 0.05,
      friction: 0.8,
      health: 150,
      damageThreshold: 6,
      damageScale: 2.5,
      fill: '#8f96a1',
      stroke: '#565d68',
    },
    glass: {
      density: 0.001,
      restitution: 0.05,
      friction: 0.25,
      health: 24,
      damageThreshold: 1.2,
      damageScale: 10,
      fill: '#9fd7e8',
      stroke: '#4e93aa',
    },
  },
};

export const MATERIALS: Material[] = ['wood', 'stone', 'glass'];
