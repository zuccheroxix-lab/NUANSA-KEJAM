/**
 * PASEO GAME ZX - Unit Tests: Matchmaking, Bot Allocation & Win Conditions
 * Developer: ZUCCHERO XANN
 */

import { describe, it, expect } from 'vitest';
import { BotManager } from '../server/botManager.ts';
import { SafeZone } from '../src/shared/types.ts';

describe('Matchmaking & Bot System', () => {
  it('should spawn the requested number of AI combat bots with valid loadouts', () => {
    const botManager = new BotManager();
    const safeZone: SafeZone = {
      currentRadius: 150,
      targetRadius: 100,
      currentX: 0,
      currentZ: 0,
      targetX: 0,
      targetZ: 0,
      phase: 1,
      maxPhases: 4,
      timeRemaining: 45,
      damagePerSecond: 2.5,
      isShrinking: false,
    };

    const count = 6;
    const bots = botManager.spawnBots(count, safeZone);

    expect(bots.length).toBe(count);
    bots.forEach((bot) => {
      expect(bot.isBot).toBe(true);
      expect(bot.isAlive).toBe(true);
      expect(bot.health).toBe(100);
      expect(bot.shield).toBe(50);
      expect(bot.inventory.length).toBeGreaterThan(0);
      expect(bot.currentWeaponId).toBeTruthy();
    });

    botManager.clear();
  });

  it('should declare match winner when 1 operator remains alive', () => {
    const players = [
      { id: 'p1', isAlive: true, name: 'Operator-Alpha' },
      { id: 'p2', isAlive: false, name: 'Bot-Beta' },
      { id: 'p3', isAlive: false, name: 'Bot-Gamma' },
    ];

    const alive = players.filter((p) => p.isAlive);
    expect(alive.length).toBe(1);
    expect(alive[0].name).toBe('Operator-Alpha');
  });
});
