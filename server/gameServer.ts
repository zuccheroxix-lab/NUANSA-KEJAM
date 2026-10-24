/**
 * PASEO GAME ZX - Server-Authoritative Battle Royale Engine
 * Developer: ZUCCHERO XANN
 * Repository: NUANSA-KEJAM-GAME-ZX
 */

import { Server, Socket } from 'socket.io';
import {
  Player,
  LootItem,
  SafeZone,
  MatchState,
  ServerGameStatePacket,
  ClientInputPacket,
  ShootRequestPacket,
  DamageEvent,
  RoomListItem,
  WeaponItem,
  WeaponType,
} from '../src/shared/types.ts';
import { createWeaponInstance } from '../src/shared/weapons.ts';
import { BotManager } from './botManager.ts';

interface Room {
  id: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  matchState: MatchState;
  players: Map<string, Player>;
  sockets: Map<string, Socket>;
  safeZone: SafeZone;
  loot: LootItem[];
  recentDamageEvents: DamageEvent[];
  botManager: BotManager;
  gameLoopTimer: NodeJS.Timeout | null;
  lastTickTime: number;
  zoneTimer: number;
}

export class GameServer {
  private io: Server;
  private rooms: Map<string, Room> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      let currentRoomId: string | null = null;
      let playerId: string = socket.id;

      // 1. Get room list
      socket.on('room:list', () => {
        const list: RoomListItem[] = Array.from(this.rooms.values()).map((r) => ({
          id: r.id,
          name: r.name,
          playerCount: r.players.size,
          maxPlayers: r.maxPlayers,
          status: r.matchState.status,
        }));
        socket.emit('room:list_response', list);
      });

      // 2. Create Room
      socket.on('room:create', (data: { roomName?: string; playerName?: string }) => {
        const roomId = `room_${Math.random().toString(36).substring(2, 8)}`;
        const rName = data?.roomName || `Sector ZX-${Math.floor(Math.random() * 900 + 100)}`;
        const pName = data?.playerName || `Operator-${socket.id.substring(0, 4)}`;

        const room = this.createRoom(roomId, rName, socket.id);
        this.joinRoom(room, socket, pName);
        currentRoomId = roomId;
      });

      // 3. Quick Match / Join Room
      socket.on('room:join', (data: { roomId?: string; playerName?: string }) => {
        const pName = data?.playerName || `Operator-${socket.id.substring(0, 4)}`;

        let targetRoom: Room | undefined;
        if (data?.roomId && this.rooms.has(data.roomId)) {
          targetRoom = this.rooms.get(data.roomId);
        } else {
          // Find first waiting room or create one
          for (const r of this.rooms.values()) {
            if (r.matchState.status === 'waiting' && r.players.size < r.maxPlayers) {
              targetRoom = r;
              break;
            }
          }
        }

        if (!targetRoom) {
          const roomId = `room_${Math.random().toString(36).substring(2, 8)}`;
          targetRoom = this.createRoom(roomId, `Sector ZX-${Math.floor(Math.random() * 900 + 100)}`, socket.id);
        }

        this.joinRoom(targetRoom, socket, pName);
        currentRoomId = targetRoom.id;
      });

      // 4. Force Start Match (Host or Auto)
      socket.on('match:start_request', (data: { botCount?: number }) => {
        if (!currentRoomId) return;
        const room = this.rooms.get(currentRoomId);
        if (!room) return;

        const botCount = typeof data?.botCount === 'number' ? Math.max(0, Math.min(15, data.botCount)) : 8;
        this.startMatch(room, botCount);
      });

      // 5. Client movement and rotation input packet
      socket.on('player:input', (packet: ClientInputPacket) => {
        if (!currentRoomId) return;
        const room = this.rooms.get(currentRoomId);
        if (!room || room.matchState.status !== 'in_progress') return;

        const player = room.players.get(playerId);
        if (!player || !player.isAlive) return;

        // Authoritative position validation (clamp to arena bounds)
        const maxBound = 175;
        player.x = Math.max(-maxBound, Math.min(maxBound, packet.x));
        player.y = Math.max(0, Math.min(15, packet.y));
        player.z = Math.max(-maxBound, Math.min(maxBound, packet.z));
        player.rotationY = packet.rotationY;
        player.pitch = packet.pitch;
        player.state = packet.state;
      });

      // 6. Weapon Shoot Intent
      socket.on('player:shoot', (shootPacket: ShootRequestPacket) => {
        if (!currentRoomId) return;
        const room = this.rooms.get(currentRoomId);
        if (!room || room.matchState.status !== 'in_progress') return;

        const shooter = room.players.get(playerId);
        if (!shooter || !shooter.isAlive) return;

        this.handlePlayerShoot(room, shooter, shootPacket);
      });

      // 7. Weapon Reload Intent
      socket.on('player:reload', () => {
        if (!currentRoomId) return;
        const room = this.rooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.get(playerId);
        if (!player || !player.isAlive) return;

        const wep = player.inventory.find((w) => w.id === player.currentWeaponId);
        if (!wep || wep.ammo >= wep.maxAmmo || wep.reserveAmmo <= 0) return;

        player.isReloading = true;
        player.lastReloadStartTime = Date.now();

        setTimeout(() => {
          if (!player || !player.isAlive) return;
          const needed = wep.maxAmmo - wep.ammo;
          const transfer = Math.min(needed, wep.reserveAmmo);
          wep.ammo += transfer;
          wep.reserveAmmo -= transfer;
          player.isReloading = false;
        }, wep.reloadTime);
      });

      // 8. Loot Pickup Intent
      socket.on('player:loot_pickup', (data: { lootId: string }) => {
        if (!currentRoomId) return;
        const room = this.rooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.get(playerId);
        if (!player || !player.isAlive) return;

        this.handleLootPickup(room, player, data.lootId);
      });

      // 9. Switch Weapon Slot
      socket.on('player:switch_weapon', (data: { slotIndex: number }) => {
        if (!currentRoomId) return;
        const room = this.rooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.get(playerId);
        if (!player || !player.isAlive) return;

        if (data.slotIndex >= 0 && data.slotIndex < player.inventory.length) {
          player.currentWeaponId = player.inventory[data.slotIndex].id;
        }
      });

      // 10. Disconnect
      socket.on('disconnect', () => {
        if (currentRoomId && this.rooms.has(currentRoomId)) {
          const room = this.rooms.get(currentRoomId)!;
          this.leaveRoom(room, socket.id);
        }
      });
    });
  }

  // Create room instance
  private createRoom(id: string, name: string, hostId: string): Room {
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

    const room: Room = {
      id,
      name,
      hostId,
      maxPlayers: 16,
      matchState: {
        status: 'waiting',
        matchId: id,
        totalPlayers: 0,
        aliveCount: 0,
        countdownSeconds: 10,
        matchTimeSeconds: 0,
      },
      players: new Map(),
      sockets: new Map(),
      safeZone,
      loot: this.generateMapLoot(),
      recentDamageEvents: [],
      botManager: new BotManager(),
      gameLoopTimer: null,
      lastTickTime: Date.now(),
      zoneTimer: 45,
    };

    this.rooms.set(id, room);
    return room;
  }

  // Join room
  private joinRoom(room: Room, socket: Socket, playerName: string) {
    socket.join(room.id);
    room.sockets.set(socket.id, socket);

    // Initial loadout: Primary Assault Rifle + Secondary SMG
    const rifle = createWeaponInstance('rifle');
    const smg = createWeaponInstance('smg');

    // Spawn player in circular perimeter formation
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 45 + Math.random() * 35;
    const spawnX = Math.cos(angle) * spawnDist;
    const spawnZ = Math.sin(angle) * spawnDist;

    const playerColors = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
    const assignedColor = playerColors[room.players.size % playerColors.length];

    const player: Player = {
      id: socket.id,
      name: playerName,
      x: spawnX,
      y: 0,
      z: spawnZ,
      rotationY: angle + Math.PI,
      pitch: 0,
      health: 100,
      shield: 50,
      state: 'idle',
      currentWeaponId: rifle.id,
      inventory: [rifle, smg],
      isBot: false,
      kills: 0,
      damageDealt: 0,
      isAlive: true,
      color: assignedColor,
    };

    room.players.set(socket.id, player);
    room.matchState.totalPlayers = room.players.size;
    room.matchState.aliveCount = room.players.size;

    socket.emit('room:joined', {
      roomId: room.id,
      roomName: room.name,
      playerId: socket.id,
      player,
    });

    // Notify room of roster update
    this.broadcastRoster(room);
  }

  // Leave room
  private leaveRoom(room: Room, playerId: string) {
    room.players.delete(playerId);
    room.sockets.delete(playerId);
    room.matchState.totalPlayers = room.players.size;

    if (room.players.size === 0) {
      if (room.gameLoopTimer) clearInterval(room.gameLoopTimer);
      room.botManager.clear();
      this.rooms.delete(room.id);
      return;
    }

    this.broadcastRoster(room);
  }

  // Start the battle royale match
  public startMatch(room: Room, botCount: number = 8) {
    if (room.matchState.status === 'in_progress') return;

    room.matchState.status = 'in_progress';
    room.matchState.matchTimeSeconds = 0;

    // Spawn AI combat bots
    const bots = room.botManager.spawnBots(botCount, room.safeZone);
    bots.forEach((bot) => {
      room.players.set(bot.id, bot);
    });

    room.matchState.totalPlayers = room.players.size;
    room.matchState.aliveCount = room.players.size;

    // Notify all clients in room
    this.io.to(room.id).emit('match:started', {
      totalPlayers: room.matchState.totalPlayers,
      safeZone: room.safeZone,
    });

    // Start 20 Hz authoritative server loop
    room.lastTickTime = Date.now();
    if (room.gameLoopTimer) clearInterval(room.gameLoopTimer);

    room.gameLoopTimer = setInterval(() => {
      this.tickRoom(room);
    }, 50); // 20 FPS tick
  }

  // Authoritative Room Tick (runs at 20Hz)
  private tickRoom(room: Room) {
    const now = Date.now();
    const delta = (now - room.lastTickTime) / 1000;
    room.lastTickTime = now;

    if (room.matchState.status !== 'in_progress') return;

    room.matchState.matchTimeSeconds += delta;

    // 1. Safe Zone Logic & Timer
    this.updateSafeZone(room, delta);

    // 2. Out-of-zone damage ticks (every 1 second)
    this.applySafeZoneDamage(room, delta);

    // 3. AI Bot Behavior Updates
    room.botManager.update(delta, room.players, room.safeZone, (bot, target, weapon) => {
      this.handleBotShoot(room, bot, target, weapon);
    });

    // 4. Check Match Win Conditions
    this.checkWinCondition(room);

    // 5. Build and broadcast authoritative state packet
    const packet: ServerGameStatePacket = {
      timestamp: now,
      matchState: room.matchState,
      players: Object.fromEntries(room.players.entries()),
      safeZone: room.safeZone,
      loot: room.loot,
      recentDamageEvents: [...room.recentDamageEvents],
    };

    room.recentDamageEvents = []; // Flush flushed damage events
    this.io.to(room.id).emit('game:state', packet);
  }

  // Update Safe Zone circle radius and phase
  private updateSafeZone(room: Room, delta: number) {
    const zone = room.safeZone;
    zone.timeRemaining -= delta;

    if (zone.timeRemaining <= 0) {
      if (!zone.isShrinking) {
        // Transition to shrinking state
        zone.isShrinking = true;
        zone.timeRemaining = 25; // 25 seconds to shrink to target
      } else {
        // Shrinking completed: transition to next phase
        zone.isShrinking = false;
        zone.currentRadius = zone.targetRadius;
        zone.currentX = zone.targetX;
        zone.currentZ = zone.targetZ;

        if (zone.phase < zone.maxPhases) {
          zone.phase += 1;
          zone.timeRemaining = 35; // Wait period before next shrink
          zone.damagePerSecond += 2.0;

          // Next target radius and center (random point within current zone)
          zone.targetRadius = Math.max(8, zone.currentRadius * 0.55);
          const angle = Math.random() * Math.PI * 2;
          const maxShift = (zone.currentRadius - zone.targetRadius) * 0.6;
          zone.targetX = zone.currentX + Math.cos(angle) * maxShift;
          zone.targetZ = zone.currentZ + Math.sin(angle) * maxShift;
        } else {
          // Final endgame zone
          zone.timeRemaining = 999;
        }
      }
    } else if (zone.isShrinking) {
      // Smoothly interpolate radius and center towards target
      const shrinkSpeed = delta / 25;
      zone.currentRadius = zone.currentRadius + (zone.targetRadius - zone.currentRadius) * shrinkSpeed;
      zone.currentX = zone.currentX + (zone.targetX - zone.currentX) * shrinkSpeed;
      zone.currentZ = zone.currentZ + (zone.targetZ - zone.currentZ) * shrinkSpeed;
    }
  }

  // Apply storm / safe zone damage to players outside radius
  private applySafeZoneDamage(room: Room, delta: number) {
    const zone = room.safeZone;

    for (const player of room.players.values()) {
      if (!player.isAlive) continue;

      const dx = player.x - zone.currentX;
      const dz = player.z - zone.currentZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > zone.currentRadius) {
        const damage = zone.damagePerSecond * delta;
        player.health -= damage;

        if (player.health <= 0) {
          player.health = 0;
          this.eliminatePlayer(room, player, null, 'The Storm', false);
        }
      }
    }
  }

  // Authoritative player shoot handling
  private handlePlayerShoot(room: Room, shooter: Player, packet: ShootRequestPacket) {
    const wep = shooter.inventory.find((w) => w.id === shooter.currentWeaponId);
    if (!wep) return;

    const now = Date.now();
    // Rate limit check
    if (shooter.lastShootTime && now - shooter.lastShootTime < wep.fireRate * 0.8) {
      return;
    }
    if (wep.ammo <= 0 || shooter.isReloading) {
      return;
    }

    shooter.lastShootTime = now;
    wep.ammo -= 1;

    // Check hit on target player if provided
    if (packet.targetPlayerId && room.players.has(packet.targetPlayerId)) {
      const victim = room.players.get(packet.targetPlayerId)!;
      if (!victim.isAlive) return;

      // Distance validation
      const dx = victim.x - shooter.x;
      const dz = victim.z - shooter.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= wep.range) {
        const isHeadshot = packet.isHeadshot || false;
        const multiplier = isHeadshot ? 2.0 : 1.0;
        const baseDamage = wep.damage * multiplier;

        this.applyCombatDamage(room, shooter, victim, baseDamage, wep.name, isHeadshot);
      }
    }
  }

  // Bot shooting logic
  private handleBotShoot(room: Room, bot: Player, target: Player, wep: WeaponItem) {
    if (!target.isAlive || !bot.isAlive) return;

    // Bot accuracy check: 65% hit chance
    const hit = Math.random() < 0.65;
    if (hit) {
      const isHeadshot = Math.random() < 0.15; // 15% headshot chance
      const baseDamage = wep.damage * (isHeadshot ? 2.0 : 1.0);
      this.applyCombatDamage(room, bot, target, baseDamage, wep.name, isHeadshot);
    }
  }

  // Combat damage calculation (Shield absorption + Health)
  private applyCombatDamage(
    room: Room,
    attacker: Player,
    victim: Player,
    totalDamage: number,
    weaponName: string,
    isHeadshot: boolean
  ) {
    attacker.damageDealt += totalDamage;

    let shieldDamage = 0;
    let healthDamage = 0;

    if (victim.shield > 0) {
      // 70% absorbed by shield
      const shieldAbsorb = totalDamage * 0.7;
      if (victim.shield >= shieldAbsorb) {
        victim.shield -= shieldAbsorb;
        shieldDamage = shieldAbsorb;
        healthDamage = totalDamage - shieldAbsorb;
        victim.health -= healthDamage;
      } else {
        shieldDamage = victim.shield;
        const remainder = totalDamage - victim.shield;
        victim.shield = 0;
        healthDamage = remainder;
        victim.health -= healthDamage;
      }
    } else {
      healthDamage = totalDamage;
      victim.health -= healthDamage;
    }

    const isEliminated = victim.health <= 0;
    if (isEliminated) {
      victim.health = 0;
      this.eliminatePlayer(room, victim, attacker, weaponName, isHeadshot);
    }

    const event: DamageEvent = {
      victimId: victim.id,
      attackerId: attacker.id,
      damage: totalDamage,
      shieldDamage,
      healthDamage,
      remainingHealth: Math.max(0, victim.health),
      remainingShield: Math.max(0, victim.shield),
      isEliminated,
      isHeadshot,
      weaponName,
    };

    room.recentDamageEvents.push(event);
  }

  // Player elimination
  private eliminatePlayer(
    room: Room,
    victim: Player,
    killer: Player | null,
    weaponName: string,
    isHeadshot: boolean
  ) {
    victim.isAlive = false;
    victim.state = 'dead';

    if (killer) {
      killer.kills += 1;
    }

    // Recalculate alive count
    const alivePlayers = Array.from(room.players.values()).filter((p) => p.isAlive);
    room.matchState.aliveCount = alivePlayers.length;

    // Drop loot at victim's death coordinates
    victim.inventory.forEach((w) => {
      room.loot.push({
        id: `loot_drop_${Math.random().toString(36).substring(2, 7)}`,
        type: 'weapon',
        name: w.name,
        weaponType: w.type,
        x: victim.x + (Math.random() - 0.5) * 2,
        y: 0.3,
        z: victim.z + (Math.random() - 0.5) * 2,
        color: w.color,
        pickedUp: false,
      });
    });

    // Also drop medkit / shield canister
    room.loot.push({
      id: `loot_drop_med_${Math.random().toString(36).substring(2, 7)}`,
      type: Math.random() > 0.5 ? 'shield' : 'medkit',
      name: Math.random() > 0.5 ? 'Shield Cell (+50)' : 'Tactical Medkit (+50 HP)',
      x: victim.x + (Math.random() - 0.5) * 2,
      y: 0.3,
      z: victim.z + (Math.random() - 0.5) * 2,
      color: '#10b981',
      pickedUp: false,
    });

    // Broadcast kill feed
    this.io.to(room.id).emit('game:killfeed', {
      id: `kf_${Date.now()}`,
      killerId: killer ? killer.id : 'storm',
      killerName: killer ? killer.name : 'The Storm',
      victimId: victim.id,
      victimName: victim.name,
      weaponName,
      isHeadshot,
      timestamp: Date.now(),
    });
  }

  // Handle loot pickup
  private handleLootPickup(room: Room, player: Player, lootId: string) {
    const itemIndex = room.loot.findIndex((l) => l.id === lootId && !l.pickedUp);
    if (itemIndex === -1) return;

    const item = room.loot[itemIndex];
    // Distance validation: player must be within 4.5m
    const dx = player.x - item.x;
    const dz = player.z - item.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 4.5) return;

    item.pickedUp = true;
    room.loot.splice(itemIndex, 1);

    if (item.type === 'weapon' && item.weaponType) {
      const newWep = createWeaponInstance(item.weaponType);
      // If inventory has < 3 weapons, add it, else replace active
      if (player.inventory.length < 3) {
        player.inventory.push(newWep);
      } else {
        const activeIdx = player.inventory.findIndex((w) => w.id === player.currentWeaponId);
        if (activeIdx !== -1) {
          player.inventory[activeIdx] = newWep;
        } else {
          player.inventory[0] = newWep;
        }
      }
      player.currentWeaponId = newWep.id;
    } else if (item.type === 'shield') {
      player.shield = Math.min(100, player.shield + 50);
    } else if (item.type === 'medkit') {
      player.health = Math.min(100, player.health + 50);
    } else if (item.type === 'ammo') {
      player.inventory.forEach((w) => {
        w.reserveAmmo += 60;
      });
    }

    // Send pickup confirmation to player
    const socket = room.sockets.get(player.id);
    if (socket) {
      socket.emit('player:loot_success', { item, inventory: player.inventory });
    }
  }

  // Check Win Condition
  private checkWinCondition(room: Room) {
    if (room.matchState.status !== 'in_progress') return;

    const alivePlayers = Array.from(room.players.values()).filter((p) => p.isAlive);
    if (alivePlayers.length <= 1) {
      room.matchState.status = 'ended';

      const winner = alivePlayers[0] || null;
      room.matchState.winnerId = winner?.id;
      room.matchState.winnerName = winner?.name || 'Draw';

      this.io.to(room.id).emit('match:ended', {
        winnerId: room.matchState.winnerId,
        winnerName: room.matchState.winnerName,
        matchTimeSeconds: Math.floor(room.matchState.matchTimeSeconds),
      });

      if (room.gameLoopTimer) {
        clearInterval(room.gameLoopTimer);
        room.gameLoopTimer = null;
      }
    }
  }

  // Generate tactical ground loot scattered across arena
  private generateMapLoot(): LootItem[] {
    const lootList: LootItem[] = [];
    const weaponPool: WeaponType[] = ['rifle', 'shotgun', 'sniper', 'smg'];

    // Spawn 24 loot crates / weapons across the map
    const spawnPoints = [
      { x: 0, z: 0, type: 'weapon' as const, wep: 'sniper' as WeaponType },
      { x: 2, z: 2, type: 'shield' as const },
      { x: -2, z: -2, type: 'medkit' as const },
      { x: 75, z: 10, type: 'weapon' as const, wep: 'sniper' as WeaponType },
      { x: -75, z: -15, type: 'weapon' as const, wep: 'shotgun' as WeaponType },
      { x: 0, z: -65, type: 'weapon' as const, wep: 'rifle' as WeaponType },
      { x: 0, z: 65, type: 'weapon' as const, wep: 'smg' as WeaponType },
      { x: 25, z: -20, type: 'shield' as const },
      { x: -25, z: 20, type: 'medkit' as const },
      { x: 42, z: 28, type: 'ammo' as const },
      { x: -45, z: -30, type: 'ammo' as const },
      { x: 60, z: -45, type: 'weapon' as const, wep: 'rifle' as WeaponType },
      { x: -62, z: 45, type: 'weapon' as const, wep: 'shotgun' as WeaponType },
      { x: 18, z: 12, type: 'shield' as const },
      { x: -18, z: -14, type: 'medkit' as const },
    ];

    spawnPoints.forEach((sp, i) => {
      let name = 'Loot Item';
      let color = '#38bdf8';

      if (sp.type === 'weapon' && sp.wep) {
        name = `ZX-${sp.wep.toUpperCase()} Crate`;
        color = '#06b6d4';
      } else if (sp.type === 'shield') {
        name = 'Tactical Shield Cell (+50)';
        color = '#3b82f6';
      } else if (sp.type === 'medkit') {
        name = 'Nanotech Medkit (+50 HP)';
        color = '#10b981';
      } else if (sp.type === 'ammo') {
        name = 'Heavy Ammo Cache (+60)';
        color = '#f59e0b';
      }

      lootList.push({
        id: `loot_${i}_${Math.random().toString(36).substring(2, 6)}`,
        type: sp.type,
        name,
        weaponType: sp.wep,
        x: sp.x,
        y: 0.3,
        z: sp.z,
        color,
        pickedUp: false,
      });
    });

    return lootList;
  }

  private broadcastRoster(room: Room) {
    const roster = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      kills: p.kills,
    }));
    this.io.to(room.id).emit('room:roster', roster);
  }
}
