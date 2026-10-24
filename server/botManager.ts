/**
 * PASEO GAME ZX - Server-Authoritative Tactical AI Bot System
 * Bots have real combat behaviors:
 * - Wandering towards safe zone
 * - Target detection (line-of-sight & distance)
 * - Firing with realistic accuracy & weapon cooldowns
 * - Taking damage and dropping loot on elimination
 * Developer: ZUCCHERO XANN
 */

import { Player, WeaponItem, SafeZone, WeaponType } from '../src/shared/types.ts';
import { createWeaponInstance } from '../src/shared/weapons.ts';

const BOT_NAMES = [
  'Viper-01',
  'Specter-ZX',
  'Ghost-Kilo',
  'Apex-Unit',
  'Reaper-7',
  'Titan-Alpha',
  'Striker-9',
  'Shadow-X',
  'Phantom-4',
  'Cyborg-Bravo',
  'Nova-Delta',
  'Echo-Trooper',
];

export class BotManager {
  private bots: Map<string, Player> = new Map();
  private botTargetIds: Map<string, string | null> = new Map();
  private botLastShootTimes: Map<string, number> = new Map();

  public spawnBots(count: number, safeZone: SafeZone): Player[] {
    const spawned: Player[] = [];
    const weaponPool: WeaponType[] = ['rifle', 'shotgun', 'smg', 'sniper'];

    for (let i = 0; i < count; i++) {
      const id = `bot_${Math.random().toString(36).substring(2, 9)}`;
      const name = BOT_NAMES[i % BOT_NAMES.length] + ` [AI]`;

      // Spawn in random ring inside initial zone
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * (safeZone.currentRadius * 0.7);
      const x = safeZone.currentX + Math.cos(angle) * dist;
      const z = safeZone.currentZ + Math.sin(angle) * dist;

      const randomWepType = weaponPool[Math.floor(Math.random() * weaponPool.length)];
      const primaryWep = createWeaponInstance(randomWepType);

      const botPlayer: Player = {
        id,
        name,
        x,
        y: 0,
        z,
        rotationY: Math.random() * Math.PI * 2,
        pitch: 0,
        health: 100,
        shield: 50,
        state: 'idle',
        currentWeaponId: primaryWep.id,
        inventory: [primaryWep],
        isBot: true,
        kills: 0,
        damageDealt: 0,
        isAlive: true,
        color: '#f43f5e', // Crimson tactical hostile indicator
      };

      this.bots.set(id, botPlayer);
      this.botTargetIds.set(id, null);
      this.botLastShootTimes.set(id, 0);
      spawned.push(botPlayer);
    }

    return spawned;
  }

  // Update bot AI ticks (every 100ms on server)
  public update(
    delta: number,
    allPlayers: Map<string, Player>,
    safeZone: SafeZone,
    onBotShoot: (bot: Player, target: Player, weapon: WeaponItem) => void
  ) {
    const now = Date.now();

    for (const [botId, bot] of this.bots.entries()) {
      if (!bot.isAlive) continue;

      // 1. Target acquisition: find closest living enemy
      let closestTarget: Player | null = null;
      let minDistance = 55; // Sight range in meters

      for (const [otherId, otherPlayer] of allPlayers.entries()) {
        if (otherId === botId || !otherPlayer.isAlive) continue;

        const dx = otherPlayer.x - bot.x;
        const dz = otherPlayer.z - bot.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < minDistance) {
          minDistance = dist;
          closestTarget = otherPlayer;
        }
      }

      this.botTargetIds.set(botId, closestTarget ? closestTarget.id : null);

      // 2. Navigation logic
      if (closestTarget) {
        // Face target
        const dx = closestTarget.x - bot.x;
        const dz = closestTarget.z - bot.z;
        bot.rotationY = Math.atan2(dx, dz);

        // Move towards target if too far, or back up if too close
        const distToTarget = Math.sqrt(dx * dx + dz * dz);
        const speed = 4.5 * delta;

        if (distToTarget > 18) {
          bot.x += Math.sin(bot.rotationY) * speed;
          bot.z += Math.cos(bot.rotationY) * speed;
          bot.state = 'running';
        } else if (distToTarget < 6) {
          bot.x -= Math.sin(bot.rotationY) * speed;
          bot.z -= Math.cos(bot.rotationY) * speed;
          bot.state = 'running';
        } else {
          // Strafe slightly while shooting
          bot.x += Math.cos(bot.rotationY) * speed * 0.4;
          bot.z -= Math.sin(bot.rotationY) * speed * 0.4;
          bot.state = 'firing';
        }

        // 3. Firing weapon logic
        const currentWep = bot.inventory.find((w) => w.id === bot.currentWeaponId) || bot.inventory[0];
        const lastShot = this.botLastShootTimes.get(botId) || 0;

        if (currentWep && now - lastShot >= currentWep.fireRate * 1.5) {
          // Bot fires with simulated accuracy
          this.botLastShootTimes.set(botId, now);
          onBotShoot(bot, closestTarget, currentWep);
        }
      } else {
        // No target: Move towards Safe Zone center
        const toCenterX = safeZone.currentX - bot.x;
        const toCenterZ = safeZone.currentZ - bot.z;
        const distToCenter = Math.sqrt(toCenterX * toCenterX + toCenterZ * toCenterZ);

        if (distToCenter > safeZone.currentRadius * 0.5) {
          bot.rotationY = Math.atan2(toCenterX, toCenterZ);
          const speed = 3.5 * delta;
          bot.x += Math.sin(bot.rotationY) * speed;
          bot.z += Math.cos(bot.rotationY) * speed;
          bot.state = 'running';
        } else {
          // Patrol slowly
          bot.rotationY += 0.05 * delta;
          bot.state = 'idle';
        }
      }
    }
  }

  public getBot(id: string): Player | undefined {
    return this.bots.get(id);
  }

  public removeBot(id: string) {
    this.bots.delete(id);
    this.botTargetIds.delete(id);
    this.botLastShootTimes.delete(id);
  }

  public clear() {
    this.bots.clear();
    this.botTargetIds.clear();
    this.botLastShootTimes.clear();
  }
}
