import React, { useState } from 'react';
import {
  Mic,
  Volume2,
  RefreshCw,
  ArrowLeftRight,
  Headphones,
  Radio,
  ChevronDown,
} from 'lucide-react';
import { TranslationItem } from '../types';
import { SupportedLang } from '../services/offlineTranslator';
import { SUPPORTED_LANGUAGES, LanguageDef } from './LanguageSelector';

interface DualSplitViewProps {
  items: TranslationItem[];
  interimText: string;
  interimTranslation?: string;
  isListening: boolean;
  activeSpeaker: 'interlocutor' | 'user' | null;
  onToggleSpeaker: (speaker: 'interlocutor' | 'user') => void;
  onReplayAudio: (text: string, lang: SupportedLang) => void;
  sourceLang: SupportedLang | 'auto';
  targetLang: SupportedLang;
  onChangeSource?: (lang: SupportedLang | 'auto') => void;
  onChangeTarget?: (lang: SupportedLang) => void;
  onSwapLanguages?: () => void;
}

export const DualSplitView: React.FC<DualSplitViewProps> = ({
  items,
  interimText,
  interimTranslation,
  isListening,
  activeSpeaker,
  onToggleSpeaker,
  onReplayAudio,
  sourceLang,
  targetLang,
  onChangeSource,
  onChangeTarget,
  onSwapLanguages,
}) => {
  const [isTopFlipped, setIsTopFlipped] = useState(true);

  const getLangObj = (code: string): LanguageDef => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === code) || {
        code: code as SupportedLang,
        name: code.toUpperCase(),
        nativeName: code.toUpperCase(),
        flag: '🌐',
      }
    );
  };

  const interlocutorLangObj = getLangObj(sourceLang === 'auto' ? 'de' : sourceLang);
  const userLangObj = getLangObj(targetLang);

  const latestItem = items.length > 0 ? items[items.length - 1] : null;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3.5 p-3 select-none pb-12">
      {/* =========================================================================
          TOP HALF: INTERLOCUTORE (Faced toward the person sitting across from you)
          ========================================================================= */}
      <div
        className={`w-full min-h-[220px] flex flex-col justify-between rounded-3xl p-4 transition-all duration-300 relative border shadow-md ${
          isTopFlipped ? 'rotate-180' : ''
        } ${
          activeSpeaker === 'interlocutor' && isListening
            ? 'bg-gradient-to-b from-indigo-950 to-slate-900 border-indigo-400 ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-950/60'
            : 'bg-slate-900/95 border-slate-800'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{interlocutorLangObj.flag}</span>
            {onChangeSource ? (
              <div className="relative inline-block">
                <select
                  value={sourceLang}
                  onChange={(e) => onChangeSource(e.target.value as any)}
                  className="appearance-none bg-slate-800/90 text-white font-bold text-xs rounded-lg pl-2 pr-6 py-1 border border-slate-700 focus:outline-none"
                >
                  <option value="auto">⚡ Auto</option>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            ) : (
              <span className="text-xs font-bold text-white">
                {interlocutorLangObj.nativeName}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              (Interlocutore)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTopFlipped(!isTopFlipped)}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 border border-slate-700"
              title="Ruota a 180°"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>{isTopFlipped ? '180°' : 'Dritto'}</span>
            </button>
            {latestItem && (
              <button
                onClick={() =>
                  onReplayAudio(
                    latestItem.sourceLang === sourceLang ? latestItem.sourceText : latestItem.translatedText,
                    sourceLang === 'auto' ? 'de' : sourceLang
                  )
                }
                className="p-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card Content (Subtitles) */}
        <div className="flex-1 flex flex-col justify-center my-auto py-2 text-center overflow-y-auto">
          {activeSpeaker === 'interlocutor' && isListening && interimText ? (
            <div className="animate-pulse">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-0.5">
                In ascolto in tempo reale...
              </span>
              <p className="text-base sm:text-xl font-bold text-cyan-200 leading-snug">
                "{interimText}"
              </p>
              {interimTranslation && (
                <div className="mt-1.5 pt-1.5 border-t border-cyan-800/40">
                  <span className="text-[9px] font-mono uppercase text-emerald-400 font-semibold block">
                    Traduzione live per te:
                  </span>
                  <p className="text-lg sm:text-2xl font-black text-emerald-300 leading-snug">
                    {interimTranslation}
                  </p>
                </div>
              )}
            </div>
          ) : latestItem ? (
            <div>
              {latestItem.targetLang === sourceLang || latestItem.effectiveSourceLang === targetLang ? (
                <div>
                  <span className="text-[9px] font-mono uppercase text-indigo-400 font-semibold block mb-0.5">
                    Traduzione per te:
                  </span>
                  <p className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                    {latestItem.translatedText}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    "{latestItem.sourceText}"
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-semibold block mb-0.5">
                    Hai detto:
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {latestItem.sourceText}
                  </p>
                  <p className="text-[11px] text-indigo-300 mt-1 font-medium">
                    → "{latestItem.translatedText}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 py-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-200">
                Tocca il microfono blu sotto per parlare
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                in {interlocutorLangObj.name} ({interlocutorLangObj.nativeName})
              </p>
            </div>
          )}
        </div>

        {/* TOP MICROPHONE BUTTON: UNMISSABLE & BRIGHT */}
        <div className="pt-1 shrink-0">
          <button
            onClick={() => onToggleSpeaker('interlocutor')}
            className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md ${
              activeSpeaker === 'interlocutor' && isListening
                ? 'bg-red-600 text-white animate-pulse shadow-red-950/60 ring-2 ring-red-400'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="tracking-wide">
              {activeSpeaker === 'interlocutor' && isListening
                ? `IN ASCOLTO (${interlocutorLangObj.nativeName.toUpperCase()}) - TOCCA PER STOP`
                : `🎤 PARLA ORA (${interlocutorLangObj.nativeName.toUpperCase()})`}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MIDDLE DIVIDER: Quick Swap & Live Audio Status
          ========================================================================= */}
      <div className="flex items-center justify-between px-3 py-0.5 shrink-0">
        <div className="h-[1px] flex-1 bg-slate-800" />
        <div className="flex items-center gap-2 px-2">
          {onSwapLanguages && (
            <button
              onClick={onSwapLanguages}
              className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white border border-slate-700 transition-colors"
              title="Scambia lingue"
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>
          )}
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
            Fronte a Fronte Live
          </span>
        </div>
        <div className="h-[1px] flex-1 bg-slate-800" />
      </div>

      {/* =========================================================================
          BOTTOM HALF: TU (Italiano) - PROMINENT GREEN MICROPHONE
          ========================================================================= */}
      <div
        className={`w-full min-h-[220px] flex flex-col justify-between rounded-3xl p-4 transition-all duration-300 relative border shadow-md ${
          activeSpeaker === 'user' && isListening
            ? 'bg-gradient-to-b from-emerald-950 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-950/60'
            : 'bg-gradient-to-b from-indigo-950/30 to-slate-900/95 border-emerald-500/40'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-indigo-900/40 pb-1.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{userLangObj.flag}</span>
            {onChangeTarget ? (
              <div className="relative inline-block">
                <select
                  value={targetLang}
                  onChange={(e) => onChangeTarget(e.target.value as SupportedLang)}
                  className="appearance-none bg-emerald-950/60 text-white font-bold text-xs rounded-lg pl-2 pr-6 py-1 border border-emerald-700/60 focus:outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-emerald-300 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            ) : (
              <span className="text-xs font-bold text-white">
                {userLangObj.name} ({userLangObj.nativeName})
              </span>
            )}
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <Headphones className="w-3 h-3" />
              <span>(Tuo Display & Cuffie)</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {latestItem && (
              <button
                onClick={() =>
                  onReplayAudio(
                    latestItem.targetLang === targetLang ? latestItem.translatedText : latestItem.sourceText,
                    targetLang
                  )
                }
                className="p-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card Content (Subtitles) */}
        <div className="flex-1 flex flex-col justify-center my-auto py-2 text-center overflow-y-auto">
          {activeSpeaker === 'user' && isListening && interimText ? (
            <div className="animate-pulse">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-0.5">
                Stai parlando in tempo reale...
              </span>
              <p className="text-base sm:text-xl font-bold text-emerald-200 leading-snug">
                "{interimText}"
              </p>
              {interimTranslation && (
                <div className="mt-1.5 pt-1.5 border-t border-emerald-800/40">
                  <span className="text-[9px] font-mono uppercase text-indigo-300 font-semibold block">
                    Traduzione live per l'interlocutore:
                  </span>
                  <p className="text-lg sm:text-2xl font-black text-white leading-snug">
                    {interimTranslation}
                  </p>
                </div>
              )}
            </div>
          ) : latestItem ? (
            <div>
              {latestItem.targetLang === targetLang ? (
                <div>
                  <span className="text-[9px] font-mono uppercase text-emerald-400 font-semibold block mb-0.5">
                    Traduzione nelle tue cuffie:
                  </span>
                  <p className="text-xl sm:text-2xl font-extrabold text-white leading-snug tracking-tight">
                    {latestItem.translatedText}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    "{latestItem.sourceText}"
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-semibold block mb-0.5">
                    Hai detto:
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {latestItem.sourceText}
                  </p>
                  <p className="text-[11px] text-emerald-300 mt-1 font-medium">
                    → "{latestItem.translatedText}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 py-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-200">
                Tocca il grande pulsante verde qui sotto per parlare
              </p>
              <p className="text-[10px] text-emerald-300/80 mt-0.5">
                La tua voce verrà tradotta in tempo reale per l'interlocutore.
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM MICROPHONE BUTTON: VIBRANT EMERALD GREEN (CANNOT BE MISSED) */}
        <div className="pt-1 shrink-0">
          <button
            onClick={() => onToggleSpeaker('user')}
            className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all transform active:scale-95 shadow-xl ${
              activeSpeaker === 'user' && isListening
                ? 'bg-red-600 text-white animate-pulse shadow-red-950/60 ring-4 ring-red-400/50'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 hover:brightness-110 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/40'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shadow-inner">
              <Mic className="w-4 h-4 text-white animate-bounce" />
            </div>
            <span className="tracking-wide text-xs sm:text-sm font-black">
              {activeSpeaker === 'user' && isListening
                ? `IN ASCOLTO (${userLangObj.name.toUpperCase()}) - TOCCA PER FERMARE`
                : `🟢 TOCCA IL MICROFONO VERDE PER PARLARE (${userLangObj.name.toUpperCase()})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
