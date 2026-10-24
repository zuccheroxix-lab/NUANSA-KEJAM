/**
 * PASEO GAME ZX - Settings & Configuration Modal
 * Developer: ZUCCHERO XANN
 */

import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Eye, Sliders, Globe, X } from 'lucide-react';
import { SoundFX } from '../game/SoundFX.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphicsQuality: 'low' | 'medium' | 'high';
  onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  onLeaveMatch?: () => void;
  isInGame?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  graphicsQuality,
  onQualityChange,
  onLeaveMatch,
  isInGame = false,
}) => {
  const [volume, setVolume] = useState<number>(SoundFX.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(SoundFX.getMuted());
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return localStorage.getItem('paseo_custom_server') || '';
  });

  if (!isOpen) return null;

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    SoundFX.setVolume(newVol);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    SoundFX.setMuted(next);
  };

  const handleSaveServer = (url: string) => {
    setServerUrl(url);
    localStorage.setItem('paseo_custom_server', url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span>OPERATIONAL SETTINGS</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Graphics Quality */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>GRAPHICS FIDELITY (ANDROID / PC)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => onQualityChange(q)}
                className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  graphicsQuality === q
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {graphicsQuality === 'low'
              ? 'Low: Standard resolution, no dynamic shadows, optimal for entry-level Android.'
              : graphicsQuality === 'medium'
              ? 'Medium: Balanced antialiasing, high frame rate.'
              : 'High: Studio PBR soft shadows, 2x pixel ratio.'}
          </span>
        </div>

        {/* 2. Audio Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>SOUND EFFECTS (SYNTHESIZER)</span>
            </label>
            <button
              onClick={handleToggleMute}
              className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                isMuted
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {isMuted ? 'MUTED' : 'ACTIVE'}
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            disabled={isMuted}
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* 3. Custom Server URL */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>SERVER URL (FOR ANDROID / REMOTE TEST)</span>
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => handleSaveServer(e.target.value)}
            placeholder="Default (Origin / Same Host)"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
          <span className="text-[10px] text-slate-400 block">
            Leave blank to connect to same origin. On physical Android device, enter your PC/server IP (e.g. http://192.168.1.50:3000).
          </span>
        </div>

        {/* In-Game Actions */}
        {isInGame && onLeaveMatch && (
          <button
            onClick={onLeaveMatch}
            className="w-full py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/50 hover:bg-rose-600/30 text-rose-300 font-bold text-xs"
          >
            ABORT MATCH & RETURN TO MENU
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
        >
          SAVE & RESUME
        </button>
      </div>
    </div>
  );
};
