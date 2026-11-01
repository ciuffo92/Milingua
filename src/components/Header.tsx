import React from 'react';
import {
  Headphones,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Settings,
  Sparkles,
  FlipHorizontal,
  FileText,
  Radio,
} from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  isListening: boolean;
  isPlayingAudio: boolean;
  isOfflineMode: boolean;
  inEarAudioEnabled: boolean;
  onToggleInEarAudio: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  elapsedSeconds: number;
}

export const Header: React.FC<HeaderProps> = ({
  isListening,
  isPlayingAudio,
  isOfflineMode,
  inEarAudioEnabled,
  onToggleInEarAudio,
  viewMode,
  onChangeViewMode,
  onOpenSettings,
  elapsedSeconds,
}) => {
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="shrink-0 w-full bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-800/80 px-3.5 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+10px)] transition-all select-none">
      <div className="flex items-center justify-between gap-2 max-w-xl mx-auto">
        {/* App Title & Live Pulse */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/20">
            <Headphones className="w-4 h-4 text-white" />
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#090d16]"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                Milingua <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Live In-Ear</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {isListening ? (
                <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  In ascolto • {formatTime(elapsedSeconds)}
                </span>
              ) : (
                <span className="text-slate-400">Pronto per cuffie / altoparlante</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Badges & Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Offline / Online Status Pill */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              isOfflineMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {isOfflineMode ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Gemini AI</span>
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              </>
            )}
          </div>

          {/* In-Ear Spoken Audio Toggle */}
          <button
            onClick={onToggleInEarAudio}
            className={`p-2 rounded-xl border transition-all ${
              inEarAudioEnabled
                ? isPlayingAudio
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-500 hover:text-slate-300'
            }`}
            title={inEarAudioEnabled ? 'Voce in cuffia attiva (clicca per silenziare)' : 'Voce in cuffia mutata (clicca per attivare)'}
          >
            {inEarAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Impostazioni"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Bar (Teleprompter / Dual / Transcript) */}
      <div className="flex items-center justify-center mt-2 pt-2 border-t border-slate-800/40 max-w-xl mx-auto">
        <div className="grid grid-cols-3 w-full bg-slate-900/70 p-0.5 rounded-xl border border-slate-800/70">
          <button
            onClick={() => onChangeViewMode('teleprompter')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'teleprompter'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Teleprompter</span>
          </button>

          <button
            onClick={() => onChangeViewMode('dual-split')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'dual-split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Fronte a Fronte</span>
          </button>

          <button
            onClick={() => onChangeViewMode('transcript')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'transcript'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Trascrizione</span>
          </button>
        </div>
      </div>
    </header>
  );
};
