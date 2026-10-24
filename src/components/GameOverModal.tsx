/**
 * PASEO GAME ZX - Match Summary & Victory Royale Modal
 * Developer: ZUCCHERO XANN
 */

import React from 'react';
import { Trophy, Skull, Zap, Clock, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  isWinner: boolean;
  winnerName: string;
  kills: number;
  damage: number;
  matchDurationSeconds: number;
  aliveCount: number;
  onDeployAgain: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isWinner,
  winnerName,
  kills,
  damage,
  matchDurationSeconds,
  aliveCount,
  onDeployAgain,
  onReturnToMenu,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-6 overflow-hidden">
        {/* Glowing Banner Header */}
        <div className="text-center">
          <div
            className={`inline-flex p-4 rounded-2xl mb-3 shadow-xl ${
              isWinner
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 border border-yellow-200'
                : 'bg-gradient-to-tr from-rose-600 to-red-500 text-white border border-rose-400'
            }`}
          >
            {isWinner ? <Trophy className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
          </div>

          <h2
            className={`text-3xl font-black tracking-widest uppercase ${
              isWinner
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400'
                : 'text-rose-400'
            }`}
          >
            {isWinner ? '#1 VICTORY ROYALE' : 'TACTICAL ELIMINATION'}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {isWinner
              ? 'YOU ARE THE LAST OPERATOR STANDING!'
              : `CHAMPION: ${winnerName.toUpperCase()}`}
          </p>
        </div>

        {/* Combat Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-xl font-black text-white">{kills}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Kills</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Zap className="w-6 h-6 text-cyan-400" />
            <div>
              <div className="text-xl font-black text-white">{Math.round(damage)}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Damage Dealt</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Clock className="w-6 h-6 text-sky-400" />
            <div>
              <div className="text-xl font-black text-white">{formatTime(matchDurationSeconds)}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Survival Time</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Skull className="w-6 h-6 text-rose-400" />
            <div>
              <div className="text-xl font-black text-white">{isWinner ? '#1' : `#${aliveCount + 1}`}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Final Rank</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onDeployAgain}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>DEPLOY AGAIN</span>
          </button>

          <button
            onClick={onReturnToMenu}
            className="flex-1 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
