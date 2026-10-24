/**
 * PASEO GAME ZX - Mobile Virtual Joystick & Touch Controls
 * Ergonomic layout for landscape smartphones & tablets.
 * Developer: ZUCCHERO XANN
 */

import React, { useRef, useState, useEffect } from 'react';
import { Crosshair, Shield, Zap, ArrowUp, RefreshCw, Hand, Menu } from 'lucide-react';
import { Controls } from '../game/Controls.ts';
import { LootItem, WeaponItem } from '../shared/types.ts';

interface MobileControlsProps {
  controls: Controls | null;
  nearbyLoot: LootItem | null;
  activeWeapon: WeaponItem | null;
  inventory: WeaponItem[];
  onOpenSettings: () => void;
  onLootPickup: () => void;
  onReload: () => void;
  onSwitchWeapon: (index: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  controls,
  nearbyLoot,
  activeWeapon,
  inventory,
  onOpenSettings,
  onLootPickup,
  onReload,
  onSwitchWeapon,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickThumb, setJoystickThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);
  const joystickTouchId = useRef<number | null>(null);

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchId.current !== null) return;

    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setIsJoystickActive(true);
    updateJoystickPos(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setIsJoystickActive(false);
        setJoystickThumb({ x: 0, y: 0 });
        if (controls) {
          controls.isJoystickActive = false;
          controls.joystickVector = { x: 0, y: 0 };
        }
        break;
      }
    }
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current || !controls) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = rect.width / 2 - 10;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let normX = dx;
    let normY = dy;

    if (dist > maxRadius) {
      normX = (dx / dist) * maxRadius;
      normY = (dy / dist) * maxRadius;
    }

    setJoystickThumb({ x: normX, y: normY });

    // Pass normalized vector to game controls (-1 to +1)
    controls.isJoystickActive = true;
    controls.joystickVector = {
      x: normX / maxRadius,
      y: normY / maxRadius,
    };
  };

  // Touch drag look area (right screen half)
  const handleLookTouchStart = (e: React.TouchEvent) => {
    if (!controls) return;
    const touch = e.changedTouches[0];
    // Only accept touches on the right half or upper screen
    controls.handleTouchLookStart(touch.identifier, touch.clientX, touch.clientY);
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (!controls) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      controls.handleTouchLookMove(touch.identifier, touch.clientX, touch.clientY);
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent) => {
    if (!controls) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      controls.handleTouchLookEnd(touch.identifier);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* Right-half Touch-Look swipe zone */}
      <div
        className="absolute top-0 right-0 w-2/3 h-full pointer-events-auto touch-none"
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
      />

      {/* Top Bar Pause / Menu Button */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-lg text-slate-300 active:bg-slate-800 text-xs font-semibold backdrop-blur-sm"
        >
          <Menu className="w-4 h-4 text-cyan-400" />
          <span>PAUSE</span>
        </button>
      </div>

      {/* Bottom Left: Virtual Movement Joystick */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="relative w-32 h-32 rounded-full border-2 border-cyan-500/30 bg-slate-950/60 backdrop-blur-md flex items-center justify-center touch-none shadow-lg shadow-cyan-950/40"
        >
          {/* Inner ring marker */}
          <div className="w-16 h-16 rounded-full border border-cyan-500/20 pointer-events-none" />

          {/* Draggable thumbstick */}
          <div
            style={{
              transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
            className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-sky-600 shadow-md shadow-cyan-500/50 border-2 border-white/40 flex items-center justify-center pointer-events-none"
          >
            <div className="w-4 h-4 rounded-full bg-white/80" />
          </div>
        </div>
      </div>

      {/* Bottom Right: Combat Action Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Interactive Loot Pickup Button */}
        {nearbyLoot && (
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onLootPickup();
            }}
            onClick={onLootPickup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/40 border border-emerald-300/40 animate-bounce active:scale-95 touch-none"
          >
            <Hand className="w-5 h-5" />
            <span>PICK UP {nearbyLoot.name}</span>
          </button>
        )}

        {/* Weapons switch quick strip */}
        <div className="flex gap-2 mb-1">
          {inventory.map((wep, idx) => (
            <button
              key={wep.id}
              onTouchStart={(e) => {
                e.stopPropagation();
                onSwitchWeapon(idx);
              }}
              onClick={() => onSwitchWeapon(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeWeapon?.id === wep.id
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
            >
              {wep.type.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Action Button Diamond Cluster */}
        <div className="relative w-44 h-44">
          {/* FIRE BUTTON (Primary, Large) */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              if (controls) controls.input.fire = true;
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (controls) controls.input.fire = false;
            }}
            className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 border-2 border-red-300 text-white flex flex-col items-center justify-center shadow-xl shadow-red-950/60 active:scale-90 touch-none"
          >
            <Crosshair className="w-8 h-8 drop-shadow" />
            <span className="text-[10px] font-black tracking-wider">FIRE</span>
          </button>

          {/* JUMP BUTTON */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              if (controls) controls.input.jump = true;
            }}
            className="absolute bottom-2 left-0 w-14 h-14 rounded-full bg-slate-900/90 border-2 border-cyan-500/60 text-cyan-300 flex flex-col items-center justify-center shadow-lg active:scale-90 touch-none"
          >
            <ArrowUp className="w-6 h-6" />
            <span className="text-[9px] font-bold">JUMP</span>
          </button>

          {/* AIM (ADS) BUTTON */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              if (controls) controls.input.aim = !controls.input.aim;
            }}
            className="absolute top-0 right-2 w-14 h-14 rounded-full bg-slate-900/90 border-2 border-sky-400/60 text-sky-300 flex flex-col items-center justify-center shadow-lg active:scale-90 touch-none"
          >
            <Shield className="w-5 h-5" />
            <span className="text-[9px] font-bold">AIM</span>
          </button>

          {/* RELOAD BUTTON */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onReload();
            }}
            onClick={onReload}
            className="absolute top-4 left-6 w-13 h-13 rounded-full bg-slate-900/90 border-2 border-amber-500/60 text-amber-300 flex flex-col items-center justify-center shadow-lg active:scale-90 touch-none"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[9px] font-bold">RELOAD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
