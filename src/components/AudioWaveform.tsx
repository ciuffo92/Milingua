import React from 'react';

interface AudioWaveformProps {
  level: number; // 0.0 to 1.0
  isListening: boolean;
  isPlayingAudio?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  level,
  isListening,
  isPlayingAudio = false,
}) => {
  // 12 dynamic visualizer bars
  const bars = [0.4, 0.7, 0.9, 1.0, 0.8, 0.6, 0.85, 0.95, 0.7, 0.5, 0.75, 0.6];

  return (
    <div className="flex items-center gap-1.5 h-6 px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
      {bars.map((multiplier, idx) => {
        const heightPercent = isListening
          ? Math.max(15, Math.min(100, Math.round(level * multiplier * 100 + (Math.sin(Date.now() / 200 + idx) * 10 + 20))))
          : 15;

        return (
          <span
            key={idx}
            className={`w-1 rounded-full transition-all duration-75 ${
              isPlayingAudio
                ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : isListening
                ? 'bg-gradient-to-t from-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                : 'bg-slate-700/60'
            }`}
            style={{
              height: `${heightPercent}%`,
            }}
          />
        );
      })}
    </div>
  );
};
