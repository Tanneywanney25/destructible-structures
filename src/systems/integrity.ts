/** Structure-wide integrity metrics for the dashboard. */

export interface BlockHealth {
  health: number;
  maxHealth: number;
  destroyed: boolean;
}

/**
 * Integrity % = surviving health over total original health of the structure.
 * Destroyed blocks contribute zero current health but keep their max in the
 * denominator, so integrity falls monotonically toward 0.
 */
export function integrityPct(blocks: readonly BlockHealth[]): number {
  const total = blocks.reduce((sum, b) => sum + b.maxHealth, 0);
  if (total <= 0) return 100;
  const current = blocks.reduce((sum, b) => sum + (b.destroyed ? 0 : b.health), 0);
  return (current / total) * 100;
}

export function destroyedCount(blocks: readonly BlockHealth[]): number {
  return blocks.reduce((n, b) => n + (b.destroyed ? 1 : 0), 0);
}

/** Running peak-impulse tracker. */
export class PeakTracker {
  private peakValue = 0;

  record(impulse: number): void {
    if (impulse > this.peakValue) this.peakValue = impulse;
  }

  get peak(): number {
    return this.peakValue;
  }

  reset(): void {
    this.peakValue = 0;
  }
}
