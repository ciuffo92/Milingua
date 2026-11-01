import React, { useRef, useEffect, useState } from 'react';
import {
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowDown,
  Headphones,
  Radio,
} from 'lucide-react';
import { TranslationItem } from '../types';
import { SUPPORTED_LANGUAGES } from './LanguageSelector';

interface TeleprompterViewProps {
  items: TranslationItem[];
  interimText: string;
  interimTranslation?: string;
  isListening: boolean;
  isPlayingAudio: boolean;
  currentSpeakingId?: string;
  fontSize: 'normal' | 'large' | 'extra';
  onReplayAudio: (item: TranslationItem) => void;
  targetLangName: string;
}

export const TeleprompterView: React.FC<TeleprompterViewProps> = ({
  items,
  interimText,
  interimTranslation,
  isListening,
  isPlayingAudio,
  currentSpeakingId,
  fontSize,
  onReplayAudio,
  targetLangName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fontSizes = {
    normal: {
      translated: 'text-xl sm:text-2xl font-bold leading-snug',
      source: 'text-sm text-slate-400',
    },
    large: {
      translated: 'text-2xl sm:text-3xl font-extrabold leading-snug',
      source: 'text-base text-slate-400',
    },
    extra: {
      translated: 'text-3xl sm:text-4xl font-extrabold leading-tight',
      source: 'text-lg text-slate-400',
    },
  }[fontSize];

  // Auto scroll to bottom when new item arrives or interim updates
  useEffect(() => {
    if (!userHasScrolledUp && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [items, interimText, interimTranslation, userHasScrolledUp]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setUserHasScrolledUp(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setUserHasScrolledUp(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLanguageFlag = (code: string) => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return found ? found.flag : '🌐';
  };

  return (
    <div className="relative flex-1 w-full max-w-xl mx-auto flex flex-col min-h-0 px-3.5 pb-2">
      {/* Scrollable Subtitles Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth"
      >
        {items.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
              <Headphones className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">
              Traduzione Simultanea in Tempo Reale
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mb-3">
              Mentre la persona parla davanti a te, la traduzione viene vocalizzata nelle tue cuffie senza attendere pause e mostrata in tempo reale qui sotto.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-indigo-300/80 bg-indigo-950/30 px-3 py-1.5 rounded-full border border-indigo-800/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Segmentazione continua a clausole senza interruzioni</span>
            </div>
          </div>
        )}

        {/* Confirmed Sentence Subtitles */}
        {items.map((item, index) => {
          const isLatest = index === items.length - 1;
          const isCurrentlySpeaking = currentSpeakingId === item.id;

          return (
            <div
              key={item.id}
              className={`group relative rounded-2xl p-4 transition-all border ${
                isLatest
                  ? 'bg-gradient-to-b from-indigo-950/30 to-slate-900/80 border-indigo-500/40 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/20'
                  : 'bg-slate-900/60 border-slate-800/70 hover:border-slate-700/80'
              }`}
            >
              {/* Header Info: Language Tag + Timestamp */}
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {getLanguageFlag(item.effectiveSourceLang)} → {getLanguageFlag(item.targetLang)}
                  </span>
                  {item.isOffline && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                      Offline
                    </span>
                  )}
                  {item.latencyMs > 0 && !item.isOffline && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.latencyMs}ms
                    </span>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onReplayAudio(item)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors"
                    title="Riascolta in cuffia"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(item.id, item.translatedText)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Copia testo tradotto"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Main Subtitle: In-Ear Translated Text */}
              <div className="relative mb-2">
                <div className="flex items-start gap-2">
                  {isCurrentlySpeaking && (
                    <span className="shrink-0 mt-1 text-emerald-400 animate-pulse">
                      <Volume2 className="w-5 h-5" />
                    </span>
                  )}
                  <p className={`${fontSizes.translated} text-white tracking-tight`}>
                    {item.translatedText}
                  </p>
                </div>
              </div>

              {/* Original Spoken Text (Smaller for reference) */}
              <div className="pt-2 border-t border-slate-800/60 flex items-start gap-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0 mt-0.5">
                  Originale:
                </span>
                <p className={`${fontSizes.source} italic text-slate-300`}>
                  "{item.sourceText}"
                </p>
              </div>
            </div>
          );
        })}

        {/* Live Interim Speech & Real-Time Translated Subtitle (Updates while talking!) */}
        {isListening && interimText && (
          <div className="rounded-2xl p-4 bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-cyan-400/60 shadow-xl shadow-cyan-950/50">
            <div className="flex items-center justify-between text-xs mb-2 text-cyan-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Simultaneo in corso...</span>
              </span>
              <span className="text-[10px] uppercase font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-700/50">
                Live Subtitle
              </span>
            </div>

            {/* Real-time translated text in prominent bold */}
            {interimTranslation && (
              <div className="mb-2">
                <p className={`${fontSizes.translated} text-emerald-300 font-extrabold tracking-tight`}>
                  {interimTranslation}
                </p>
              </div>
            )}

            {/* Live incoming original words as uttered */}
            <div className="pt-1 border-t border-cyan-800/40">
              <span className="text-[10px] uppercase font-mono text-cyan-400 mr-1.5">
                Parole catturate:
              </span>
              <span className="text-sm text-cyan-100 italic">
                "{interimText}"
              </span>
            </div>
          </div>
        )}
      </div>

      {/* "Scroll to bottom" floating button if user scrolled up */}
      {userHasScrolledUp && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg border border-indigo-400/30 transition-all transform active:scale-95"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Torna in tempo reale</span>
        </button>
      )}
    </div>
  );
};
