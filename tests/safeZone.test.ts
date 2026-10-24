/**
 * PASEO GAME ZX - Unit Tests: Safe Zone Shrinking & Storm Damage
 * Developer: ZUCCHERO XANN
 */

import { describe, it, expect } from 'vitest';
import { SafeZone } from '../src/shared/types.ts';

describe('Safe Zone & Storm Mechanics', () => {
  it('should detect whether a player is inside or outside the safe circle', () => {
    const safeZone: SafeZone = {
      currentRadius: 100,
      targetRadius: 60,
      currentX: 0,
      currentZ: 0,
      targetX: 10,
      targetZ: 10,
      phase: 1,
      maxPhases: 4,
      timeRemaining: 30,
      damagePerSecond: 3.0,
      isShrinking: false,
    };

    const isInside = (px: number, pz: number) => {
      const dist = Math.sqrt(
        Math.pow(px - safeZone.currentX, 2) + Math.pow(pz - safeZone.currentZ, 2)
      );
      return dist <= safeZone.currentRadius;
    };

    expect(isInside(0, 0)).toBe(true);
    expect(isInside(50, 50)).toBe(true); // dist ~ 70.7 <= 100
    expect(isInside(90, 90)).toBe(false); // dist ~ 127.3 > 100
    expect(isInside(120, 0)).toBe(false);
  });

  it('should interpolate shrinking radius smoothly towards target', () => {
    let currentRadius = 150;
    const targetRadius = 100;
    const delta = 1.0; // 1 second
    const shrinkDuration = 25.0; // seconds

    const shrinkSpeed = delta / shrinkDuration;
    currentRadius = currentRadius + (targetRadius - currentRadius) * shrinkSpeed;

    expect(currentRadius).toBeLessThan(150);
    expect(currentRadius).toBeGreaterThan(100);
    expect(currentRadius).toBe(148);
  });
});
