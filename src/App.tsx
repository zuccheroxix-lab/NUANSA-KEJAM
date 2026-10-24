/**
 * PASEO GAME ZX - Main Application Component
 * Developer: ZUCCHERO XANN
 * Repository: NUANSA-KEJAM-GAME-ZX
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameWorld } from './game/GameWorld.ts';
import { NetworkClient } from './game/NetworkClient.ts';
import { MainMenu } from './components/MainMenu.tsx';
import { LobbyRoom } from './components/LobbyRoom.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { MobileControls } from './components/MobileControls.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { SoundFX } from './game/SoundFX.ts';
import {
  WeaponItem,
  SafeZone,
  KillFeedEntry,
  LootItem,
  RoomListItem,
} from './shared/types.ts';
import { Smartphone } from 'lucide-react';

export default function App() {
  const [phase, setPhase] = useState<'menu' | 'lobby' | 'playing' | 'game_over'>('menu');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [ping, setPing] = useState<number>(0);
  const [roomList, setRoomList] = useState<RoomListItem[]>([]);
  const [currentRoom, setCurrentRoom] = useState<{ id: string; name: string } | null>(null);
  const [roster, setRoster] = useState<Array<{ id: string; name: string; isBot?: boolean; kills: number }>>([]);
  const [isHost, setIsHost] = useState<boolean>(true);

  // HUD and Player States
  const [health, setHealth] = useState<number>(100);
  const [shield, setShield] = useState<number>(50);
  const [activeWeapon, setActiveWeapon] = useState<WeaponItem | null>(null);
  const [inventory, setInventory] = useState<WeaponItem[]>([]);
  const [aliveCount, setAliveCount] = useState<number>(1);
  const [kills, setKills] = useState<number>(0);
  const [damageDealt, setDamageDealt] = useState<number>(0);
  const [safeZone, setSafeZone] = useState<SafeZone | null>(null);
  const [isOutsideSafeZone, setIsOutsideSafeZone] = useState<boolean>(false);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const [nearbyLoot, setNearbyLoot] = useState<LootItem | null>(null);

  // Visual cues
  const [hitMarker, setHitMarker] = useState<boolean>(false);
  const [isHeadshotHit, setIsHeadshotHit] = useState<boolean>(false);
  const [damageFlash, setDamageFlash] = useState<boolean>(false);
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number; yaw: number }>({ x: 0, z: 0, yaw: 0 });

  // Settings & GameOver modals
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [gameOverStats, setGameOverStats] = useState<{
    isWinner: boolean;
    winnerName: string;
    matchDurationSeconds: number;
  }>({
    isWinner: false,
    winnerName: '',
    matchDurationSeconds: 0,
  });

  // Device orientation / portrait notice
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  // Canvas & Engine References
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameWorldRef = useRef<GameWorld | null>(null);
  const networkRef = useRef<NetworkClient>(new NetworkClient());

  // Check portrait orientation on mobile
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const isMobileScreen = window.innerWidth <= 768;
        setIsPortrait(isMobileScreen && window.innerHeight > window.innerWidth);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Initialize network connection once on load
  useEffect(() => {
    const net = networkRef.current;
    const customUrl = localStorage.getItem('paseo_custom_server') || undefined;
    net.connect(customUrl);

    net.onConnectionChange = (connected) => {
      setIsConnected(connected);
    };

    net.onRoomList = (list) => {
      setRoomList(list);
    };

    net.onRoomJoined = (data) => {
      setCurrentRoom({ id: data.roomId, name: data.roomName });
      setPhase('lobby');
    };

    net.onRosterUpdate = (newRoster) => {
      setRoster(newRoster);
    };

    net.onMatchStarted = () => {
      setPhase('playing');
    };

    net.onKillFeed = (entry) => {
      setKillFeed((prev) => [...prev.slice(-4), entry]);
    };

    net.onMatchEnded = (data) => {
      const myId = net.playerId;
      const won = data.winnerId === myId;
      setGameOverStats({
        isWinner: won,
        winnerName: data.winnerName || 'Winner',
        matchDurationSeconds: data.matchTimeSeconds,
      });
      setPhase('game_over');

      if (won) {
        SoundFX.playVictory();
      } else {
        SoundFX.playEliminated();
      }
    };

    // Ping polling
    const pingTimer = setInterval(() => {
      setPing(net.ping);
    }, 2000);

    return () => {
      clearInterval(pingTimer);
      net.disconnect();
    };
  }, []);

  // Initialize 3D Three.js Game World when entering 'playing' phase
  useEffect(() => {
    if (phase === 'playing' && canvasMountRef.current && !gameWorldRef.current) {
      const world = new GameWorld(
        canvasMountRef.current,
        networkRef.current,
        {
          onHealthUpdate: (h, s) => {
            setHealth(h);
            setShield(s);
          },
          onWeaponUpdate: (wep, inv) => {
            setActiveWeapon(wep);
            setInventory(inv);
          },
          onLootPrompt: (loot) => {
            setNearbyLoot(loot);
          },
          onDamageFlash: () => {
            setDamageFlash(true);
            setTimeout(() => setDamageFlash(false), 200);
          },
          onHitConfirmed: (headshot) => {
            setIsHeadshotHit(headshot);
            setHitMarker(true);
            setTimeout(() => setHitMarker(false), 120);
          },
          onMatchStatsUpdate: (alive, k, dmg) => {
            setAliveCount(alive);
            setKills(k);
            setDamageDealt(dmg);
          },
          onSafeZoneUpdate: (zone, outside) => {
            setSafeZone(zone);
            setIsOutsideSafeZone(outside);
          },
        },
        graphicsQuality
      );

      gameWorldRef.current = world;

      // Track player coordinates for HUD compass and radar
      const posTracker = setInterval(() => {
        if (world && world.localPosition) {
          setPlayerPos({
            x: world.localPosition.x,
            z: world.localPosition.z,
            yaw: world.controls.yaw,
          });
        }
      }, 100);

      // Bind incoming socket state to 3D world
      networkRef.current.onGameState = (packet) => {
        world.handleServerState(packet);
      };

      return () => {
        clearInterval(posTracker);
        world.dispose();
        gameWorldRef.current = null;
      };
    }
  }, [phase, graphicsQuality]);

  // Actions
  const handleQuickPlay = (playerName: string) => {
    networkRef.current.joinRoom(undefined, playerName);
  };

  const handleJoinRoom = (roomId: string, playerName: string) => {
    networkRef.current.joinRoom(roomId, playerName);
  };

  const handleCreateRoom = (roomName: string, playerName: string) => {
    setIsHost(true);
    networkRef.current.createRoom(roomName, playerName);
  };

  const handleSoloPractice = (playerName: string) => {
    setIsHost(true);
    networkRef.current.createRoom(`Sector ZX-Training`, playerName);
    // Automatically start match with 10 AI bots after brief delay
    setTimeout(() => {
      networkRef.current.startMatch(10);
    }, 600);
  };

  const handleStartMatch = (botCount: number) => {
    networkRef.current.startMatch(botCount);
  };

  const handleLeaveRoom = () => {
    networkRef.current.disconnect();
    setPhase('menu');
    setCurrentRoom(null);
    networkRef.current.connect();
  };

  const handleLootPickup = () => {
    if (nearbyLoot) {
      networkRef.current.sendLootPickup(nearbyLoot.id);
      SoundFX.playPickup();
    }
  };

  const handleReload = () => {
    networkRef.current.sendReload();
    SoundFX.playReload();
  };

  const handleSwitchWeapon = (index: number) => {
    networkRef.current.sendSwitchWeapon(index);
  };

  const handleDeployAgain = () => {
    setPhase('lobby');
    handleStartMatch(8);
  };

  const handleQualityChange = (q: 'low' | 'medium' | 'high') => {
    setGraphicsQuality(q);
    gameWorldRef.current?.setQuality(q);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* Portrait orientation reminder for mobile users */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-cyan-400 font-mono">
          <Smartphone className="w-12 h-12 mb-4 animate-bounce rotate-90" />
          <h2 className="text-lg font-black tracking-widest uppercase mb-2">PLEASE ROTATE DEVICE</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            PASEO GAME ZX is optimized for landscape orientation on Android and mobile touchscreens.
          </p>
        </div>
      )}

      {/* 3D Three.js WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        className={`absolute inset-0 z-0 ${phase === 'playing' ? 'block' : 'hidden'}`}
        onClick={() => {
          // Request pointer lock on PC desktop when clicking canvas
          if (phase === 'playing') {
            gameWorldRef.current?.controls.requestPointerLock();
          }
        }}
      />

      {/* PHASE 1: MAIN MENU */}
      {phase === 'menu' && (
        <MainMenu
          onQuickPlay={handleQuickPlay}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onSoloPractice={handleSoloPractice}
          onOpenSettings={() => setShowSettings(true)}
          isConnected={isConnected}
          ping={ping}
          roomList={roomList}
          onRefreshRooms={() => networkRef.current.requestRoomList()}
        />
      )}

      {/* PHASE 2: LOBBY / SECTOR WAITING */}
      {phase === 'lobby' && currentRoom && (
        <LobbyRoom
          roomName={currentRoom.name}
          roomId={currentRoom.id}
          roster={roster}
          isHost={isHost}
          onStartMatch={handleStartMatch}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* PHASE 3: PLAYING IN-GAME HUD & MOBILE CONTROLS */}
      {phase === 'playing' && (
        <>
          <GameHUD
            health={health}
            shield={shield}
            activeWeapon={activeWeapon}
            inventory={inventory}
            aliveCount={aliveCount}
            kills={kills}
            safeZone={safeZone}
            isOutsideSafeZone={isOutsideSafeZone}
            killFeed={killFeed}
            hitMarker={hitMarker}
            isHeadshotHit={isHeadshotHit}
            damageFlash={damageFlash}
            nearbyLoot={nearbyLoot}
            playerPos={playerPos}
            ping={ping}
            onLootPickup={handleLootPickup}
            onSwitchWeapon={handleSwitchWeapon}
          />

          <MobileControls
            controls={gameWorldRef.current?.controls || null}
            nearbyLoot={nearbyLoot}
            activeWeapon={activeWeapon}
            inventory={inventory}
            onOpenSettings={() => setShowSettings(true)}
            onLootPickup={handleLootPickup}
            onReload={handleReload}
            onSwitchWeapon={handleSwitchWeapon}
          />
        </>
      )}

      {/* PHASE 4: GAME OVER / VICTORY MODAL */}
      {phase === 'game_over' && (
        <GameOverModal
          isWinner={gameOverStats.isWinner}
          winnerName={gameOverStats.winnerName}
          kills={kills}
          damage={damageDealt}
          matchDurationSeconds={gameOverStats.matchDurationSeconds}
          aliveCount={aliveCount}
          onDeployAgain={handleDeployAgain}
          onReturnToMenu={() => {
            setPhase('menu');
            setCurrentRoom(null);
          }}
        />
      )}

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        graphicsQuality={graphicsQuality}
        onQualityChange={handleQualityChange}
        onLeaveMatch={() => {
          setShowSettings(false);
          handleLeaveRoom();
        }}
        isInGame={phase === 'playing'}
      />
    </div>
  );
}
