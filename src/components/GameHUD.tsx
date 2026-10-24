/**
 * PASEO GAME ZX - Tactical Battle Royale HUD
 * High-tech military sci-fi interface with radar, compass, health/shield bars, weapon dock, killfeed.
 * Developer: ZUCCHERO XANN
 */

import React, { useEffect, useState } from 'react';
import { Shield, Heart, Crosshair, Users, Trophy, AlertTriangle, Disc } from 'lucide-react';
import { WeaponItem, SafeZone, KillFeedEntry, LootItem } from '../shared/types.ts';

interface GameHUDProps {
  health: number;
  shield: number;
  activeWeapon: WeaponItem | null;
  inventory: WeaponItem[];
  aliveCount: number;
  kills: number;
  safeZone: SafeZone | null;
  isOutsideSafeZone: boolean;
  killFeed: KillFeedEntry[];
  hitMarker: boolean;
  isHeadshotHit: boolean;
  damageFlash: boolean;
  nearbyLoot: LootItem | null;
  playerPos: { x: number; z: number; yaw: number };
  ping: number;
  onLootPickup: () => void;
  onSwitchWeapon: (index: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  health,
  shield,
  activeWeapon,
  inventory,
  aliveCount,
  kills,
  safeZone,
  isOutsideSafeZone,
  killFeed,
  hitMarker,
  isHeadshotHit,
  damageFlash,
  nearbyLoot,
  playerPos,
  ping,
  onLootPickup,
  onSwitchWeapon,
}) => {
  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert player yaw to compass degrees (0 - 360)
  const deg = Math.round(((-playerPos.yaw * 180) / Math.PI + 360) % 360);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 font-mono text-slate-100 overflow-hidden">
      {/* Red screen border damage flash */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-600/30 border-8 border-red-500 animate-pulse pointer-events-none" />
      )}

      {/* TOP COMPASS BAR */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="bg-slate-950/80 border border-cyan-500/30 px-4 py-1 rounded-full flex items-center gap-3 backdrop-blur-md shadow-md shadow-cyan-950/40">
          <span className="text-cyan-400 font-bold text-sm tracking-widest">{deg}°</span>
          <div className="w-px h-3 bg-slate-700" />
          <span className="text-xs text-slate-400 font-semibold">
            {deg >= 338 || deg < 23 ? 'NORTH' :
             deg >= 23 && deg < 68 ? 'NE' :
             deg >= 68 && deg < 113 ? 'EAST' :
             deg >= 113 && deg < 158 ? 'SE' :
             deg >= 158 && deg < 203 ? 'SOUTH' :
             deg >= 203 && deg < 248 ? 'SW' :
             deg >= 248 && deg < 293 ? 'WEST' : 'NW'}
          </span>
        </div>
      </div>

      {/* TOP LEFT: MATCH STATS & KILL FEED */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 max-w-xs">
        {/* Alive & Kill Counters */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold">{aliveCount} ALIVE</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold">{kills} KILLS</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <span className="text-[10px] text-slate-400">{ping}ms</span>
        </div>

        {/* Tactical Kill Feed */}
        <div className="flex flex-col gap-1 mt-1">
          {killFeed.slice(-3).map((kf) => (
            <div
              key={kf.id}
              className="px-2.5 py-1 rounded bg-slate-900/80 border-l-2 border-cyan-400 text-[11px] backdrop-blur-sm flex items-center gap-1.5 animate-fadeIn"
            >
              <span className="font-bold text-cyan-300">{kf.killerName}</span>
              <span className="text-slate-400">[{kf.weaponName}]</span>
              <span className="font-bold text-rose-400">{kf.victimName}</span>
              {kf.isHeadshot && <span className="text-amber-400 text-[9px] font-black">★ HEADSHOT</span>}
            </div>
          ))}
        </div>
      </div>

      {/* TOP RIGHT: TACTICAL RADAR MINI-MAP & SAFE ZONE STATUS */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        {/* Radar Mini-Map */}
        <div className="relative w-28 h-28 rounded-full border-2 border-cyan-500/40 bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-lg shadow-cyan-950/40">
          {/* Radar Sweep lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-px bg-cyan-500/20" />
            <div className="h-full w-px bg-cyan-500/20" />
          </div>

          {/* Safe Zone circle on radar */}
          {safeZone && (
            <div
              style={{
                width: `${Math.min(100, (safeZone.currentRadius / 150) * 100)}%`,
                height: `${Math.min(100, (safeZone.currentRadius / 150) * 100)}%`,
                transform: 'translate(-50%, -50%)',
                top: `${50 + (safeZone.currentZ - playerPos.z) * 0.3}%`,
                left: `${50 + (safeZone.currentX - playerPos.x) * 0.3}%`,
              }}
              className="absolute rounded-full border border-cyan-400 bg-cyan-500/10 transition-all pointer-events-none"
            />
          )}

          {/* Player marker in center (pointing along yaw) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              style={{ transform: `rotate(${playerPos.yaw}rad)` }}
              className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400"
            />
          </div>
        </div>

        {/* Safe Zone Phase Banner */}
        {safeZone && (
          <div
            className={`px-3 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 backdrop-blur-md ${
              isOutsideSafeZone
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : safeZone.isShrinking
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-slate-900/80 border-cyan-500/50 text-cyan-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {isOutsideSafeZone
                ? 'OUTSIDE SAFE ZONE!'
                : safeZone.isShrinking
                ? `SHRINKING (${formatTime(safeZone.timeRemaining)})`
                : `ZONE IN ${formatTime(safeZone.timeRemaining)}`}
            </span>
          </div>
        )}
      </div>

      {/* CENTER CROSSHAIR & HIT MARKER */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-7 h-7 flex items-center justify-center">
          {/* Default Crosshair reticle */}
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/90 shadow-sm shadow-cyan-500" />
          <div className="absolute -top-3 w-0.5 h-2 bg-cyan-400/80" />
          <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-400/80" />
          <div className="absolute -left-3 w-2 h-0.5 bg-cyan-400/80" />
          <div className="absolute -right-3 w-2 h-0.5 bg-cyan-400/80" />

          {/* Hit Marker confirmation ticks */}
          {hitMarker && (
            <div
              className={`absolute inset-0 flex items-center justify-center animate-ping ${
                isHeadshotHit ? 'text-rose-500' : 'text-amber-400'
              }`}
            >
              <span className="text-xl font-black">✕</span>
            </div>
          )}
        </div>
      </div>

      {/* INTERACTIVE LOOT PICKUP PROMPT (PC Key E / Touch) */}
      {nearbyLoot && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={onLootPickup}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950/90 border border-cyan-400 rounded-xl text-cyan-300 font-bold text-xs shadow-lg shadow-cyan-950/60 backdrop-blur-md active:scale-95 transition-all"
          >
            <span className="px-2 py-0.5 rounded bg-cyan-500/30 border border-cyan-400 text-white text-[10px]">E</span>
            <span>PICK UP {nearbyLoot.name}</span>
          </button>
        </div>
      )}

      {/* BOTTOM CENTER: HEALTH & SHIELD GAUGES */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 w-72">
        {/* Shield Bar */}
        <div className="w-full flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <div className="flex-1 h-2 rounded-full bg-slate-900 border border-cyan-500/30 overflow-hidden">
            <div
              style={{ width: `${Math.max(0, Math.min(100, shield))}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-150"
            />
          </div>
          <span className="text-[10px] font-bold text-cyan-400 w-8 text-right">{Math.round(shield)}</span>
        </div>

        {/* Health Bar */}
        <div className="w-full flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-emerald-400" />
          <div className="flex-1 h-3 rounded-full bg-slate-900 border border-emerald-500/30 overflow-hidden">
            <div
              style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
              className={`h-full transition-all duration-150 ${
                health > 50
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : health > 25
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-600 to-red-500'
              }`}
            />
          </div>
          <span className="text-[11px] font-bold text-emerald-400 w-8 text-right">{Math.round(health)}</span>
        </div>
      </div>

      {/* BOTTOM RIGHT: WEAPON CARD & AMMO */}
      {activeWeapon && (
        <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-3 bg-slate-950/85 border border-slate-700/80 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg pointer-events-auto">
          {/* Inventory slots */}
          <div className="flex flex-col gap-1">
            {inventory.map((w, idx) => (
              <button
                key={w.id}
                onClick={() => onSwitchWeapon(idx)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  activeWeapon.id === w.id
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                [{idx + 1}] {w.type.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="w-px h-10 bg-slate-800" />

          {/* Active Weapon Ammo */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-cyan-300">{activeWeapon.name}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-2xl font-black ${activeWeapon.ammo === 0 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                {activeWeapon.ammo}
              </span>
              <span className="text-xs text-slate-400">/ {activeWeapon.reserveAmmo}</span>
            </div>
            <span className="text-[9px] text-slate-500">PRESS [R] TO RELOAD</span>
          </div>
        </div>
      )}
    </div>
  );
};
