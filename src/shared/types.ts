/**
 * PASEO GAME ZX - Shared Protocols & Type Definitions
 * Developer: ZUCCHERO XANN
 * Repository: NUANSA-KEJAM-GAME-ZX
 */

export type WeaponType = 'rifle' | 'shotgun' | 'sniper' | 'smg';

export interface WeaponItem {
  id: string;
  name: string;
  type: WeaponType;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  damage: number;
  fireRate: number; // minimum ms between shots
  reloadTime: number; // ms
  range: number;
  spread: number;
  recoil: number;
  color: string;
}

export type PlayerState = 'idle' | 'running' | 'jumping' | 'firing' | 'dead';

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  pitch: number;
  health: number;
  shield: number;
  state: PlayerState;
  currentWeaponId: string;
  inventory: WeaponItem[];
  isBot?: boolean;
  kills: number;
  damageDealt: number;
  isAlive: boolean;
  color: string;
  lastShootTime?: number;
  lastReloadStartTime?: number;
  isReloading?: boolean;
}

export type LootType = 'weapon' | 'ammo' | 'medkit' | 'shield';

export interface LootItem {
  id: string;
  type: LootType;
  name: string;
  weaponType?: WeaponType;
  amount?: number;
  x: number;
  y: number;
  z: number;
  color: string;
  pickedUp: boolean;
}

export interface SafeZone {
  currentRadius: number;
  targetRadius: number;
  currentX: number;
  currentZ: number;
  targetX: number;
  targetZ: number;
  phase: number;
  maxPhases: number;
  timeRemaining: number; // seconds
  damagePerSecond: number;
  isShrinking: boolean;
}

export type MatchStatus = 'waiting' | 'starting' | 'in_progress' | 'ended';

export interface MatchState {
  status: MatchStatus;
  matchId: string;
  totalPlayers: number;
  aliveCount: number;
  countdownSeconds: number;
  winnerId?: string;
  winnerName?: string;
  matchTimeSeconds: number;
}

export interface KillFeedEntry {
  id: string;
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  weaponName: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface ClientInputPacket {
  seq: number;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  pitch: number;
  state: PlayerState;
}

export interface ShootRequestPacket {
  seq: number;
  weaponId: string;
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  targetPlayerId?: string;
  isHeadshot?: boolean;
  distance?: number;
}

export interface DamageEvent {
  victimId: string;
  attackerId: string;
  damage: number;
  shieldDamage: number;
  healthDamage: number;
  remainingHealth: number;
  remainingShield: number;
  isEliminated: boolean;
  isHeadshot: boolean;
  weaponName: string;
}

export interface ServerGameStatePacket {
  timestamp: number;
  matchState: MatchState;
  players: Record<string, Player>;
  safeZone: SafeZone;
  loot: LootItem[];
  recentDamageEvents?: DamageEvent[];
}

export interface RoomListItem {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: MatchStatus;
}
