import Matter from 'matter-js';
import type { GameConfig, Material } from '../config';
import { bodyOptionsFor, collisionImpulse, damageFor, specFor } from '../systems/materials';
import { PeakTracker, type BlockHealth } from '../systems/integrity';
import type { Structure } from '../systems/structures';

export interface Block extends BlockHealth {
  body: Matter.Body;
  material: Material;
  w: number;
  h: number;
}

/** Matter world: one structure at a time, click strikes, collision damage. */
export class SmashWorld {
  readonly engine: Matter.Engine;
  blocks: Block[] = [];
  readonly peak = new PeakTracker();
  structureName = '';

  private readonly bodyToBlock = new Map<Matter.Body, Block>();
  private pendingDamage = new Map<Matter.Body, number>();

  constructor(private readonly cfg: GameConfig) {
    this.engine = Matter.Engine.create();
    this.engine.gravity.y = cfg.physics.gravityY;

    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        const relSpeed = Math.hypot(
          bodyA.velocity.x - bodyB.velocity.x,
          bodyA.velocity.y - bodyB.velocity.y,
        );
        const impulse = collisionImpulse(
          relSpeed,
          bodyA.isStatic ? Infinity : bodyA.mass,
          bodyB.isStatic ? Infinity : bodyB.mass,
        );
        if (impulse <= 0) continue;
        this.peak.record(impulse);
        for (const body of [bodyA, bodyB]) {
          if (this.bodyToBlock.has(body)) {
            this.pendingDamage.set(body, (this.pendingDamage.get(body) ?? 0) + impulse);
          }
        }
      }
    });
  }

  load(structure: Structure): void {
    Matter.Composite.clear(this.engine.world, false);
    this.blocks = [];
    this.bodyToBlock.clear();
    this.pendingDamage.clear();
    this.peak.reset();
    this.structureName = structure.name;

    const { width, height } = this.cfg.canvas;
    Matter.Composite.add(
      this.engine.world,
      Matter.Bodies.rectangle(width / 2, height - this.cfg.ground.height / 2, width, this.cfg.ground.height, {
        isStatic: true,
      }),
    );

    for (const spec of structure.blocks) {
      const body = Matter.Bodies.rectangle(
        spec.x,
        spec.y,
        spec.w,
        spec.h,
        bodyOptionsFor(spec.material, this.cfg),
      );
      const block: Block = {
        body,
        material: spec.material,
        w: spec.w,
        h: spec.h,
        health: specFor(spec.material, this.cfg).health,
        maxHealth: specFor(spec.material, this.cfg).health,
        destroyed: false,
      };
      this.blocks.push(block);
      this.bodyToBlock.set(body, block);
      Matter.Composite.add(this.engine.world, body);
    }
  }

  /** Radial click strike: impulse falls off linearly to the radius edge. */
  strike(x: number, y: number, impulseScale: number): void {
    const { radius } = this.cfg.strike;
    for (const block of this.blocks) {
      if (block.destroyed) continue;
      const dx = block.body.position.x - x;
      const dy = block.body.position.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius || dist === 0) continue;
      const falloff = 1 - dist / radius;
      const magnitude = impulseScale * falloff;
      // Halve the raw shove so blocks tumble rather than launch into orbit.
      Matter.Body.applyForce(block.body, { x, y }, {
        x: (dx / dist) * magnitude * 0.5,
        y: (dy / dist) * magnitude * 0.5,
      });
      // The strike itself also damages: treat it as an impulse event. The 60×
      // conversion one-shots glass at default power, dents wood, and leaves
      // stone standing until the slider goes up.
      const strikeImpulse = magnitude * 60;
      this.peak.record(strikeImpulse);
      this.pendingDamage.set(
        block.body,
        (this.pendingDamage.get(block.body) ?? 0) + strikeImpulse,
      );
    }
  }

  step(dtMs: number): void {
    Matter.Engine.update(this.engine, dtMs);
    if (this.pendingDamage.size === 0) return;
    for (const block of this.blocks) {
      const impulse = this.pendingDamage.get(block.body);
      if (impulse === undefined || block.destroyed) continue;
      const damage = damageFor(impulse, block.material, this.cfg);
      if (damage <= 0) continue;
      block.health = Math.max(0, block.health - damage);
      if (block.health === 0) {
        block.destroyed = true;
        Matter.Composite.remove(this.engine.world, block.body);
      }
    }
    this.pendingDamage.clear();
  }
}
