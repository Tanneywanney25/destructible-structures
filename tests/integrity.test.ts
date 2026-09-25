import { describe, expect, it } from 'vitest';
import { destroyedCount, integrityPct, PeakTracker } from '../src/systems/integrity';

const block = (
  health: number,
  maxHealth: number,
  destroyed = false,
): { health: number; maxHealth: number; destroyed: boolean } => ({
  health,
  maxHealth,
  destroyed,
});

describe('integrityPct', () => {
  it('is 100% for an untouched structure', () => {
    expect(integrityPct([block(60, 60), block(150, 150)])).toBe(100);
  });

  it('reflects partial damage as surviving health over original health', () => {
    // 30/60 + 150/150 = 180 of 210 → 85.71%
    expect(integrityPct([block(30, 60), block(150, 150)])).toBeCloseTo((180 / 210) * 100, 5);
  });

  it('destroyed blocks contribute zero but stay in the denominator', () => {
    expect(integrityPct([block(0, 60, true), block(150, 150)])).toBeCloseTo((150 / 210) * 100, 5);
  });

  it('is 0% when everything is destroyed', () => {
    expect(integrityPct([block(0, 60, true), block(0, 24, true)])).toBe(0);
  });

  it('an empty structure reads 100%', () => {
    expect(integrityPct([])).toBe(100);
  });

  it('a destroyed flag overrides any residual health value', () => {
    expect(integrityPct([block(60, 60, true)])).toBe(0);
  });
});

describe('destroyedCount', () => {
  it('counts only destroyed blocks', () => {
    expect(destroyedCount([block(10, 60), block(0, 24, true), block(0, 60, true)])).toBe(2);
  });
});

describe('PeakTracker', () => {
  it('tracks the maximum impulse seen and resets', () => {
    const tracker = new PeakTracker();
    tracker.record(3);
    tracker.record(9);
    tracker.record(5);
    expect(tracker.peak).toBe(9);
    tracker.reset();
    expect(tracker.peak).toBe(0);
  });
});
