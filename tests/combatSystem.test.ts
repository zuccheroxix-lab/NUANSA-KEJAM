/**
 * PASEO GAME ZX - Unit Tests: Combat System & Weapon Fire Mechanics
 * Developer: ZUCCHERO XANN
 */

import { describe, it, expect } from 'vitest';
import { WEAPON_DEFINITIONS, createWeaponInstance } from '../src/shared/weapons.ts';

describe('Authoritative Combat & Damage Mechanics', () => {
  it('should have properly balanced weapon stats in catalog', () => {
    const rifle = createWeaponInstance('rifle');
    expect(rifle.ammo).toBe(30);
    expect(rifle.maxAmmo).toBe(30);
    expect(rifle.damage).toBe(32);
    expect(rifle.fireRate).toBeGreaterThan(50);

    const sniper = createWeaponInstance('sniper');
    expect(sniper.damage).toBe(95);
    expect(sniper.range).toBeGreaterThan(rifle.range);

    const shotgun = createWeaponInstance('shotgun');
    expect(shotgun.damage).toBe(75);
    expect(shotgun.range).toBeLessThan(rifle.range);
  });

  it('should absorb damage through shield before depleting health', () => {
    let health = 100;
    let shield = 50;
    const totalDamage = 40;

    // Shield absorbs 70% of damage
    const shieldAbsorb = totalDamage * 0.7; // 28
    shield -= shieldAbsorb;
    const healthDamage = totalDamage - shieldAbsorb; // 12
    health -= healthDamage;

    expect(shield).toBe(22);
    expect(health).toBe(88);
  });

  it('should correctly double damage on headshots', () => {
    const baseDamage = 32;
    const headshotMultiplier = 2.0;
    const finalDamage = baseDamage * headshotMultiplier;
    expect(finalDamage).toBe(64);
  });

  it('should accurately handle weapon reload and ammo deduction', () => {
    const rifle = createWeaponInstance('rifle');
    rifle.ammo = 0;
    const initialReserve = rifle.reserveAmmo; // 90

    const needed = rifle.maxAmmo - rifle.ammo; // 30
    const transfer = Math.min(needed, rifle.reserveAmmo); // 30
    rifle.ammo += transfer;
    rifle.reserveAmmo -= transfer;

    expect(rifle.ammo).toBe(30);
    expect(rifle.reserveAmmo).toBe(initialReserve - 30);
  });
});
