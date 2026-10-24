/**
 * PASEO GAME ZX - Main Menu Screen
 * Developer: ZUCCHERO XANN
 * Repository: NUANSA-KEJAM-GAME-ZX
 */

import React, { useState } from 'react';
import { Play, Users, Bot, Settings, BookOpen, Shield, Crosshair, Wifi, Globe, Smartphone, Monitor } from 'lucide-react';
import { RoomListItem } from '../shared/types.ts';

interface MainMenuProps {
  onQuickPlay: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onCreateRoom: (roomName: string, playerName: string) => void;
  onSoloPractice: (playerName: string) => void;
  onOpenSettings: () => void;
  isConnected: boolean;
  ping: number;
  roomList: RoomListItem[];
  onRefreshRooms: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onQuickPlay,
  onJoinRoom,
  onCreateRoom,
  onSoloPractice,
  onOpenSettings,
  isConnected,
  ping,
  roomList,
  onRefreshRooms,
}) => {
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('paseo_player_name') || `OPERATOR-${Math.floor(Math.random() * 900 + 100)}`;
  });
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);
  const [showCustomRoomModal, setShowCustomRoomModal] = useState<boolean>(false);
  const [customRoomName, setCustomRoomName] = useState<string>('Sector ZX-Echo');

  const handleSaveName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('paseo_player_name', name);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black select-none overflow-y-auto">
      {/* Background Cybernetic Hex Grid Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* TOP HEADER */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300">
            <Crosshair className="w-6 h-6 text-slate-950 font-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400">
              PASEO GAME ZX
            </h1>
            <p className="text-[11px] font-mono text-slate-400 tracking-widest uppercase">
              DEVELOPER: ZUCCHERO XANN • NUANSA-KEJAM-GAME-ZX
            </p>
          </div>
        </div>

        {/* Server Status Badge & Settings Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-mono">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'}`} />
            <span className="text-slate-300">{isConnected ? `SERVER ONLINE (${ping}ms)` : 'CONNECTING...'}</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 transition-all shadow-md"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CENTER CONTENT */}
      <div className="relative z-10 max-w-xl mx-auto my-auto w-full flex flex-col items-center py-6">
        {/* Operator Call Sign Input */}
        <div className="w-full bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-md mb-6">
          <label className="block text-xs font-mono text-cyan-400 mb-1.5 uppercase tracking-wider">
            Operator Callsign
          </label>
          <input
            type="text"
            maxLength={18}
            value={playerName}
            onChange={(e) => handleSaveName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none transition-all"
            placeholder="Enter your gamertag"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* QUICK MATCH / DEPLOY */}
          <button
            onClick={() => onQuickPlay(playerName)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg tracking-wider shadow-xl shadow-cyan-950/60 border border-cyan-300/40 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>DEPLOY TO BATTLE ROYALE</span>
          </button>

          {/* SOLO / PRACTICE WITH BOTS */}
          <button
            onClick={() => onSoloPractice(playerName)}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/40 text-cyan-300 font-bold text-sm tracking-wide flex items-center justify-center gap-3 transition-all"
          >
            <Bot className="w-5 h-5 text-cyan-400" />
            <span>PRACTICE VS COMBAT BOTS (10 AI)</span>
          </button>

          {/* CUSTOM ROOM / MULTIPLAYER LOBBY */}
          <button
            onClick={() => {
              onRefreshRooms();
              setShowCustomRoomModal(true);
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold text-sm tracking-wide flex items-center justify-center gap-3 transition-all"
          >
            <Users className="w-5 h-5 text-sky-400" />
            <span>CUSTOM SECTORS & LOBBY</span>
          </button>

          {/* CONTROLS GUIDE MODAL BUTTON */}
          <button
            onClick={() => setShowControlsModal(true)}
            className="w-full py-3 px-6 rounded-2xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>CONTROLS & TACTICAL MANUAL</span>
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="relative z-10 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-900 pt-3">
        <span>PLATFORM: WEB 3D & ANDROID APK (CAPACITOR)</span>
        <span>ENGINE: THREE.JS PBR • PROTOCOL: SOCKET.IO AUTHORITATIVE</span>
      </div>

      {/* CONTROLS & MANUAL MODAL */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-5 h-5" />
              <span>TACTICAL COMBAT CONTROLS</span>
            </h3>

            {/* PC Controls */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>PC KEYBOARD & MOUSE</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div><span className="text-cyan-400 font-bold">W A S D</span> : Move</div>
                <div><span className="text-cyan-400 font-bold">MOUSE</span> : Look / Aim</div>
                <div><span className="text-cyan-400 font-bold">LEFT CLICK</span> : Fire</div>
                <div><span className="text-cyan-400 font-bold">SPACE</span> : Jump</div>
                <div><span className="text-cyan-400 font-bold">R</span> : Reload Weapon</div>
                <div><span className="text-cyan-400 font-bold">E</span> : Pick Up Loot</div>
                <div><span className="text-cyan-400 font-bold">SHIFT</span> : Sprint</div>
                <div><span className="text-cyan-400 font-bold">1, 2, 3</span> : Weapon Slots</div>
              </div>
            </div>

            {/* Mobile Touch Controls */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>MOBILE TOUCHSCREEN (LANDSCAPE)</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div><span className="text-cyan-400 font-bold">LEFT JOYSTICK</span> : Move</div>
                <div><span className="text-cyan-400 font-bold">RIGHT SCREEN</span> : Drag to Look</div>
                <div><span className="text-cyan-400 font-bold">FIRE BTN</span> : Shoot</div>
                <div><span className="text-cyan-400 font-bold">AIM BTN</span> : Zoom ADS</div>
                <div><span className="text-cyan-400 font-bold">JUMP BTN</span> : Jump</div>
                <div><span className="text-cyan-400 font-bold">RELOAD BTN</span> : Reload</div>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM ROOM MODAL */}
      {showCustomRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-cyan-400 flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>CUSTOM SECTOR LOBBY</span>
              </span>
              <button
                onClick={onRefreshRooms}
                className="text-xs text-slate-400 hover:text-cyan-300 font-mono"
              >
                [REFRESH]
              </button>
            </h3>

            {/* Create Room Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customRoomName}
                onChange={(e) => setCustomRoomName(e.target.value)}
                placeholder="Sector Name..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => {
                  onCreateRoom(customRoomName, playerName);
                  setShowCustomRoomModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                CREATE
              </button>
            </div>

            {/* Active Room List */}
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              <span className="text-xs font-mono text-slate-400">ACTIVE ROOMS</span>
              {roomList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
                  No active custom sectors found. Create one above or use Quick Match!
                </div>
              ) : (
                roomList.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{room.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {room.playerCount} / {room.maxPlayers} PLAYERS • STATUS: {room.status.toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onJoinRoom(room.id, playerName);
                        setShowCustomRoomModal(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-bold"
                    >
                      JOIN
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowCustomRoomModal(false)}
              className="mt-1 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
