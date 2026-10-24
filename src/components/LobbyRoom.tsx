/**
 * PASEO GAME ZX - Tactical Sector Lobby & Matchmaking
 * Developer: ZUCCHERO XANN
 */

import React, { useState } from 'react';
import { Users, Bot, Play, ArrowLeft, Shield, CheckCircle } from 'lucide-react';

interface LobbyRoomProps {
  roomName: string;
  roomId: string;
  roster: Array<{ id: string; name: string; isBot?: boolean; kills: number }>;
  isHost: boolean;
  onStartMatch: (botCount: number) => void;
  onLeaveRoom: () => void;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  roomName,
  roomId,
  roster,
  isHost,
  onStartMatch,
  onLeaveRoom,
}) => {
  const [botCount, setBotCount] = useState<number>(8);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 bg-slate-950 font-mono text-slate-100 select-none overflow-y-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>LEAVE SECTOR</span>
        </button>

        <div className="text-center">
          <h2 className="text-xl font-black text-cyan-400 tracking-wider uppercase">{roomName}</h2>
          <span className="text-[11px] text-slate-400">SECTOR ID: {roomId}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs font-bold text-cyan-400">
          <Users className="w-4 h-4" />
          <span>{roster.length} / 16 OPERATORS</span>
        </div>
      </div>

      {/* ROSTER & SETTINGS */}
      <div className="relative z-10 max-w-2xl mx-auto w-full my-auto flex flex-col gap-6 py-6">
        {/* Operators Roster Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-xs font-bold text-slate-300 tracking-wider">DEPLOYMENT ROSTER</span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              SYNCHRONIZED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {roster.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-400">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{player.name}</span>
                      {player.isBot && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                          AI BOT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">STATUS: READY FOR AIRDROP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bot Filler Configuration (Host Only) */}
        {isHost && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold text-white">TACTICAL BOT FILLERS</span>
              </div>
              <span className="text-xs font-bold text-cyan-400">{botCount} COMBAT BOTS</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Fill empty sector slots with intelligent combat AI bots for high-intensity battle royale gameplay.
            </p>

            <input
              type="range"
              min={0}
              max={15}
              value={botCount}
              onChange={(e) => setBotCount(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* FOOTER START BUTTON */}
      <div className="relative z-10 max-w-2xl mx-auto w-full pt-4 border-t border-slate-900">
        <button
          onClick={() => onStartMatch(botCount)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg tracking-wider shadow-xl shadow-cyan-950/60 border border-cyan-300/40 flex items-center justify-center gap-3 transition-all"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>START BATTLE ROYALE MATCH</span>
        </button>
      </div>
    </div>
  );
};
