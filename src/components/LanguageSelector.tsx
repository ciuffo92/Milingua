import React from 'react';
import { ArrowLeftRight, ChevronDown, Sparkles } from 'lucide-react';
import { SupportedLang } from '../services/offlineTranslator';

export interface LanguageDef {
  code: SupportedLang;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageDef[] = [
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'Inglese', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Tedesco', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Francese', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spagnolo', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portoghese', nativeName: 'Português', flag: '🇵🇹' },
];

interface LanguageSelectorProps {
  sourceLang: SupportedLang | 'auto';
  targetLang: SupportedLang;
  onChangeSource: (lang: SupportedLang | 'auto') => void;
  onChangeTarget: (lang: SupportedLang) => void;
  onSwapLanguages: () => void;
  isListening: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLang,
  targetLang,
  onChangeSource,
  onChangeTarget,
  onSwapLanguages,
  isListening,
}) => {
  const currentSourceObj = SUPPORTED_LANGUAGES.find((l) => l.code === sourceLang);
  const currentTargetObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 py-2">
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          {/* Speaker Language (Source) */}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block px-1 mb-1">
              Chi Parla davanti a te
            </span>
            <div className="relative">
              <select
                value={sourceLang}
                onChange={(e) => onChangeSource(e.target.value as any)}
                disabled={isListening}
                className="w-full appearance-none bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/50 text-white text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <option value="auto">⚡ Auto (Rileva Parlante)</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex flex-col items-center justify-end pb-0.5">
            <button
              onClick={onSwapLanguages}
              disabled={isListening || sourceLang === 'auto'}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              title="Scambia lingue di conversazione"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Listener Language (Target / Earphones) */}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-400 block px-1 mb-1 flex items-center justify-between">
              <span>Nelle tue Cuffie</span>
              <span className="text-[9px] text-emerald-400 font-mono">LIVE AUDIO</span>
            </span>
            <div className="relative">
              <select
                value={targetLang}
                onChange={(e) => onChangeTarget(e.target.value as SupportedLang)}
                disabled={isListening}
                className="w-full appearance-none bg-indigo-950/40 border border-indigo-700/60 hover:border-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-indigo-300">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Language Quick-Select Pills */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0 mr-1">Frequenti:</span>
          {[
            { src: 'de', tgt: 'it', label: '🇩🇪 Tedesco → 🇮🇹 Italiano' },
            { src: 'en', tgt: 'it', label: '🇬🇧 Inglese → 🇮🇹 Italiano' },
            { src: 'fr', tgt: 'it', label: '🇫🇷 Francese → 🇮🇹 Italiano' },
            { src: 'es', tgt: 'it', label: '🇪🇸 Spagnolo → 🇮🇹 Italiano' },
            { src: 'pt', tgt: 'it', label: '🇵🇹 Portoghese → 🇮🇹 Italiano' },
            { src: 'it', tgt: 'en', label: '🇮🇹 Italiano → 🇬🇧 Inglese' },
          ].map((pair, idx) => (
            <button
              key={idx}
              disabled={isListening}
              onClick={() => {
                onChangeSource(pair.src as any);
                onChangeTarget(pair.tgt as any);
              }}
              className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                sourceLang === pair.src && targetLang === pair.tgt
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
