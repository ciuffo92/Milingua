import React from 'react';
import {
  Mic,
  MicOff,
  Gauge,
  Type,
  Volume2,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';

interface ControlDockProps {
  isListening: boolean;
  isPlayingAudio: boolean;
  audioLevel: number;
  onToggleListening: () => void;
  speechSpeed: number;
  onChangeSpeed: () => void;
  fontSize: 'normal' | 'large' | 'extra';
  onToggleFontSize: () => void;
  onTestAudio: () => void;
  onOpenQuickInput: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  isListening,
  isPlayingAudio,
  audioLevel,
  onToggleListening,
  speechSpeed,
  onChangeSpeed,
  fontSize,
  onToggleFontSize,
  onTestAudio,
  onOpenQuickInput,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-3 pb-2 pt-1 shrink-0">
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl">
        {/* Top Mini-Dock: Waveform + Quick Toggles */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          {/* Audio Waveform Live Display */}
          <div className="flex items-center gap-2">
            <AudioWaveform
              level={audioLevel}
              isListening={isListening}
              isPlayingAudio={isPlayingAudio}
            />
            <span className="text-[10px] font-mono text-slate-400">
              {isListening ? (
                <span className="text-emerald-400 font-bold">Microfono Attivo</span>
              ) : (
                'In Pausa'
              )}
            </span>
          </div>

          {/* Quick Utility Toggles */}
          <div className="flex items-center gap-1.5">
            {/* Speed Multiplier */}
            <button
              onClick={onChangeSpeed}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] font-semibold text-slate-300 hover:text-white"
              title="Velocità voce in cuffia"
            >
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>{speechSpeed.toFixed(2)}x</span>
            </button>

            {/* Font Size Toggle */}
            <button
              onClick={onToggleFontSize}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] font-semibold text-slate-300 hover:text-white"
              title="Dimensione caratteri"
            >
              <Type className="w-3 h-3 text-indigo-400" />
              <span className="uppercase text-[10px]">{fontSize === 'normal' ? 'Med' : fontSize === 'large' ? 'Big' : 'XL'}</span>
            </button>

            {/* Test Earphones Sound */}
            <button
              onClick={onTestAudio}
              className="p-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-emerald-300"
              title="Test audio in cuffia"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            {/* Quick Keyboard Input */}
            <button
              onClick={onOpenQuickInput}
              className="p-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-cyan-300"
              title="Scrivi o incolla testo manualmente"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Central Big Action Button: Start / Pause Continuous In-Ear Listening */}
        <button
          onClick={onToggleListening}
          className={`w-full relative group overflow-hidden py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] shadow-xl ${
            isListening
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white animate-pulse shadow-red-950/60 ring-2 ring-red-400/50'
              : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 text-white shadow-emerald-950/60 hover:brightness-110 ring-2 ring-emerald-400/40'
          }`}
        >
          {isListening ? (
            <>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <MicOff className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="tracking-wide">🔴 IN ASCOLTO CONTINUO • TOCCA PER FERMARE</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shadow-inner">
                <Mic className="w-4 h-4 text-white animate-bounce" />
              </div>
              <span className="tracking-wide">🟢 TOCCA IL MICROFONO VERDE PER AVVIARE L'ASCOLTO</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
