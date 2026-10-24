/**
 * PASEO GAME ZX - Authoritative Weapon Catalog
 * Developer: ZUCCHERO XANN
 */

import { WeaponItem, WeaponType } from './types.ts';

export const WEAPON_DEFINITIONS: Record<WeaponType, Omit<WeaponItem, 'id'>> = {
  rifle: {
    name: 'ZX-300 Assault Carbine',
    type: 'rifle',
    ammo: 30,
    maxAmmo: 30,
    reserveAmmo: 90,
    damage: 32, // Headshot = 64
    fireRate: 120, // ms between shots (~8.3 rounds/sec)
    reloadTime: 1800, // ms
    range: 120,
    spread: 0.025,
    recoil: 0.03,
    color: '#06b6d4', // Cyan tactical
  },
  shotgun: {
    name: 'ZX-Breaker Scattergun',
    type: 'shotgun',
    ammo: 8,
    maxAmmo: 8,
    reserveAmmo: 32,
    damage: 75, // Up close devastating
    fireRate: 750, // ms between shots
    reloadTime: 2400, // ms
    range: 45,
    spread: 0.08,
    recoil: 0.08,
    color: '#f97316', // Orange heavy
  },
  sniper: {
    name: 'ZX-99 Rail-Lance',
    type: 'sniper',
    ammo: 5,
    maxAmmo: 5,
    reserveAmmo: 20,
    damage: 95, // Headshot = 190 (one-shot kill)
    fireRate: 1300, // ms between shots
    reloadTime: 2800, // ms
    range: 250,
    spread: 0.005,
    recoil: 0.12,
    color: '#a855f7', // Purple rail
  },
  smg: {
    name: 'ZX-Viper Rapid SMG',
    type: 'smg',
    ammo: 35,
    maxAmmo: 35,
    reserveAmmo: 140,
    damage: 22, // High DPS close-mid
    fireRate: 85, // ms between shots (~11.7 rounds/sec)
    reloadTime: 1500, // ms
    range: 75,
    spread: 0.045,
    recoil: 0.025,
    color: '#22c55e', // Neon green
  },
};

export function createWeaponInstance(type: WeaponType, customId?: string): WeaponItem {
  const base = WEAPON_DEFINITIONS[type];
  return {
    ...base,
    id: customId || `wep_${type}_${Math.random().toString(36).substring(2, 7)}`,
  };
}
