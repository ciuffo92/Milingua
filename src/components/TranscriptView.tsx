import React, { useState } from 'react';
import {
  Download,
  Copy,
  Trash2,
  Search,
  Check,
  FileDown,
  Volume2,
} from 'lucide-react';
import { TranslationItem } from '../types';

interface TranscriptViewProps {
  items: TranslationItem[];
  onClear: () => void;
  onReplayAudio: (item: TranslationItem) => void;
  sessionElapsedSec: number;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  items,
  onClear,
  onReplayAudio,
  sessionElapsedSec,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  const filteredItems = items.filter(
    (item) =>
      item.translatedText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sourceText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const exportAsFile = (type: 'txt' | 'md') => {
    if (items.length === 0) return;

    let content = '';
    if (type === 'md') {
      content = `# Trascrizione Sessione Milingua Live\nData: ${new Date().toLocaleString()}\nDurata sessione: ${Math.floor(sessionElapsedSec / 60)} min\nTotale frasi tradotte: ${items.length}\n\n---\n\n`;
      items.forEach((item, idx) => {
        content += `### [${formatTime(item.timestamp)}] (${item.effectiveSourceLang.toUpperCase()} → ${item.targetLang.toUpperCase()})\n`;
        content += `**Parlato:** ${item.sourceText}\n\n`;
        content += `**Traduzione in Cuffia:** ${item.translatedText}\n\n`;
      });
    } else {
      content = `Milingua Live - Trascrizione Completa\n${new Date().toLocaleString()}\n\n`;
      items.forEach((item) => {
        content += `[${formatTime(item.timestamp)}] [${item.effectiveSourceLang} -> ${item.targetLang}]\nOriginale: ${item.sourceText}\nTradotto: ${item.translatedText}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milingua-session-${new Date().toISOString().slice(0, 10)}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyFullTranscript = () => {
    if (items.length === 0) return;
    const text = items
      .map(
        (it) =>
          `[${formatTime(it.timestamp)}] ${it.sourceText} -> ${it.translatedText}`
      )
      .join('\n\n');
    navigator.clipboard?.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="flex-1 w-full max-w-xl mx-auto flex flex-col min-h-0 px-3.5 pb-2">
      {/* Search & Actions Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cerca nella conversazione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={copyFullTranscript}
            disabled={items.length === 0}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium border border-slate-700 disabled:opacity-40"
            title="Copia tutto negli appunti"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Copia</span>
          </button>
          <button
            onClick={() => exportAsFile('txt')}
            disabled={items.length === 0}
            className="flex items-center gap-1 bg-indigo-600/80 hover:bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-medium border border-indigo-500/50 disabled:opacity-40"
            title="Scarica file testo"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Esporta</span>
          </button>
          <button
            onClick={onClear}
            disabled={items.length === 0}
            className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 rounded-xl border border-slate-700 hover:border-red-700/50 disabled:opacity-40 transition-colors"
            title="Cancella cronologia sessione"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Frasi registrate: <strong className="text-white">{items.length}</strong></span>
          <span>Tempo totale: <strong className="text-indigo-300">{Math.floor(sessionElapsedSec / 60)} min {sessionElapsedSec % 60}s</strong></span>
        </div>
      </div>

      {/* Transcript Items List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 my-auto">
            <p className="text-sm">Nessuna frase trovata nella trascrizione.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                <span className="font-mono">{formatTime(item.timestamp)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-300 uppercase">
                    {item.effectiveSourceLang} → {item.targetLang}
                  </span>
                  <button
                    onClick={() => onReplayAudio(item)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-slate-200 font-semibold mb-1 text-sm">
                {item.translatedText}
              </p>
              <p className="text-slate-400 italic text-xs">
                "{item.sourceText}"
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
