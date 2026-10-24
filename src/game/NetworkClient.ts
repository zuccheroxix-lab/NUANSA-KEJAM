/**
 * PASEO GAME ZX - Client Network Controller (Socket.IO)
 * Connects to server, sends player intent, synchronizes state, calculates ping.
 * Developer: ZUCCHERO XANN
 */

import { io, Socket } from 'socket.io-client';
import {
  ServerGameStatePacket,
  ClientInputPacket,
  ShootRequestPacket,
  KillFeedEntry,
  RoomListItem,
  Player,
  LootItem,
} from '../shared/types.ts';

export type NetworkEventCallback<T> = (data: T) => void;

export class NetworkClient {
  public socket: Socket | null = null;
  public isConnected: boolean = false;
  public playerId: string | null = null;
  public roomId: string | null = null;
  public roomName: string | null = null;
  public ping: number = 0;

  // Event callbacks
  public onGameState?: NetworkEventCallback<ServerGameStatePacket>;
  public onKillFeed?: NetworkEventCallback<KillFeedEntry>;
  public onMatchStarted?: NetworkEventCallback<{ totalPlayers: number }>;
  public onMatchEnded?: NetworkEventCallback<{ winnerId?: string; winnerName?: string; matchTimeSeconds: number }>;
  public onRoomJoined?: NetworkEventCallback<{ roomId: string; roomName: string; playerId: string; player: Player }>;
  public onRoomList?: NetworkEventCallback<RoomListItem[]>;
  public onRosterUpdate?: NetworkEventCallback<Array<{ id: string; name: string; isBot?: boolean; kills: number }>>;
  public onLootSuccess?: NetworkEventCallback<{ item: LootItem; inventory: any[] }>;
  public onConnectionChange?: NetworkEventCallback<boolean>;

  private pingInterval: number | null = null;

  public connect(customServerUrl?: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Determine target server URL:
    // If running in browser, connect to origin (e.g. port 3000), or env var
    const serverUrl =
      customServerUrl ||
      import.meta.env.VITE_SERVER_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    console.log('[PASEO GAME ZX] Connecting to server at:', serverUrl);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.playerId = this.socket?.id || null;
      console.log('[PASEO GAME ZX] Connected! Player ID:', this.playerId);
      this.onConnectionChange?.(true);
      this.startPingMeasurement();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.warn('[PASEO GAME ZX] Disconnected from game server.');
      this.onConnectionChange?.(false);
      if (this.pingInterval) clearInterval(this.pingInterval);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[PASEO GAME ZX] Connection error:', err.message);
      this.isConnected = false;
      this.onConnectionChange?.(false);
    });

    // Game lifecycle events
    this.socket.on('game:state', (packet: ServerGameStatePacket) => {
      this.onGameState?.(packet);
    });

    this.socket.on('game:killfeed', (entry: KillFeedEntry) => {
      this.onKillFeed?.(entry);
    });

    this.socket.on('match:started', (data) => {
      this.onMatchStarted?.(data);
    });

    this.socket.on('match:ended', (data) => {
      this.onMatchEnded?.(data);
    });

    this.socket.on('room:joined', (data) => {
      this.roomId = data.roomId;
      this.roomName = data.roomName;
      this.playerId = data.playerId;
      this.onRoomJoined?.(data);
    });

    this.socket.on('room:list_response', (list: RoomListItem[]) => {
      this.onRoomList?.(list);
    });

    this.socket.on('room:roster', (roster) => {
      this.onRosterUpdate?.(roster);
    });

    this.socket.on('player:loot_success', (data) => {
      this.onLootSuccess?.(data);
    });
  }

  // Ping calculation loop
  private startPingMeasurement() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = window.setInterval(() => {
      if (!this.socket || !this.isConnected) return;
      const start = Date.now();
      this.socket.volatile.emit('ping_check', () => {
        this.ping = Date.now() - start;
      });
    }, 3000);
  }

  // Client requests
  public requestRoomList() {
    this.socket?.emit('room:list');
  }

  public createRoom(roomName: string, playerName: string) {
    this.socket?.emit('room:create', { roomName, playerName });
  }

  public joinRoom(roomId?: string, playerName?: string) {
    this.socket?.emit('room:join', { roomId, playerName });
  }

  public startMatch(botCount: number = 8) {
    this.socket?.emit('match:start_request', { botCount });
  }

  public sendInput(packet: ClientInputPacket) {
    this.socket?.volatile.emit('player:input', packet);
  }

  public sendShoot(packet: ShootRequestPacket) {
    this.socket?.emit('player:shoot', packet);
  }

  public sendReload() {
    this.socket?.emit('player:reload');
  }

  public sendLootPickup(lootId: string) {
    this.socket?.emit('player:loot_pickup', { lootId });
  }

  public sendSwitchWeapon(slotIndex: number) {
    this.socket?.emit('player:switch_weapon', { slotIndex });
  }

  public disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
  }
}
