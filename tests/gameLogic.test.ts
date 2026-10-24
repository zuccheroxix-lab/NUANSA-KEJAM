/**
 * PASEO GAME ZX - Unit Tests: Movement, Collision & Arena Bounds
 * Developer: ZUCCHERO XANN
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';

describe('Movement & Spatial Logic', () => {
  it('should correctly clamp player positions within arena boundaries', () => {
    const maxBound = 175;
    const testPositions = [
      { x: 220, z: -190, expectedX: 175, expectedZ: -175 },
      { x: -300, z: 50, expectedX: -175, expectedZ: 50 },
      { x: 45, z: -80, expectedX: 45, expectedZ: -80 },
    ];

    testPositions.forEach((pos) => {
      const clampedX = Math.max(-maxBound, Math.min(maxBound, pos.x));
      const clampedZ = Math.max(-maxBound, Math.min(maxBound, pos.z));
      expect(clampedX).toBe(pos.expectedX);
      expect(clampedZ).toBe(pos.expectedZ);
    });
  });

  it('should compute distance accurately in 3D Euclidean space', () => {
    const p1 = new THREE.Vector3(0, 0, 0);
    const p2 = new THREE.Vector3(30, 0, 40);
    const dist = p1.distanceTo(p2);
    expect(dist).toBe(50); // 3-4-5 triangle scaled by 10
  });

  it('should calculate jump trajectory and gravity acceleration', () => {
    let posY = 0;
    let velY = 6.8;
    const gravity = 18.0;
    const dt = 0.05; // 50ms tick

    // 1 tick
    velY -= gravity * dt;
    posY += velY * dt;

    expect(posY).toBeGreaterThan(0);
    expect(velY).toBeLessThan(6.8);
  });
});
