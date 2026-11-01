import React, { useState } from 'react';
import { X, Send, Sparkles, MessageSquare } from 'lucide-react';
import { SupportedLang } from '../services/offlineTranslator';

interface QuickInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitText: (text: string) => void;
  sourceLang: SupportedLang | 'auto';
  targetLang: SupportedLang;
}

const COMMON_PRESETS: Record<string, string[]> = {
  de: [
    'Wo ist der Bahnhof?',
    'Wie viel kostet das?',
    'Können Sie bitte langsamer sprechen?',
    'Ich habe eine Reservierung im Hotel.',
    'Die Rechnung bitte.',
    'Gibt es hier WLAN?',
  ],
  en: [
    'Where is the train station?',
    'How much does this cost?',
    'Could you please speak a bit slower?',
    'I have a hotel reservation.',
    'The bill please.',
    'Is there Wi-Fi available here?',
  ],
  fr: [
    'Où est la gare ?',
    'Combien ça coûte ?',
    'Pouvez-vous parler plus lentement svp ?',
    "J'ai une réservation d'hôtel.",
    "L'addition s'il vous plaît.",
    'Y a-t-il du Wi-Fi ici ?',
  ],
  es: [
    '¿Dónde está la estación de tren?',
    '¿Cuánto cuesta esto?',
    '¿Puede hablar más despacio por favor?',
    'Tengo una reserva de hotel.',
    'La cuenta por favor.',
    '¿Hay conexión wifi aquí?',
  ],
  pt: [
    'Onde fica a estação de trem?',
    'Quanto custa isto?',
    'Pode falar mais devagar, por favor?',
    'Tenho uma reserva no hotel.',
    'A conta por favor.',
    'Tem Wi-Fi aqui?',
  ],
  it: [
    'Dov\'è la stazione dei treni?',
    'Quanto costa questo?',
    'Può parlare più lentamente per favore?',
    'Ho una prenotazione in albergo.',
    'Il conto per favore.',
    'C\'è il Wi-Fi qui?',
  ],
};

export const QuickInputModal: React.FC<QuickInputModalProps> = ({
  isOpen,
  onClose,
  onSubmitText,
  sourceLang,
  targetLang,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSubmitText(inputText.trim());
    setInputText('');
    onClose();
  };

  const handlePresetClick = (phrase: string) => {
    onSubmitText(phrase);
    onClose();
  };

  const effectiveLangKey = sourceLang === 'auto' ? 'en' : sourceLang;
  const presets = COMMON_PRESETS[effectiveLangKey] || COMMON_PRESETS.en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Inserimento Manuale o Frasario Rapido
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form input */}
        <form onSubmit={handleSubmit} className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Digita o incolla il testo da tradurre e ascoltare:
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Es. 'Guten Tag, wir möchten gerne zwei Fahrkarten nach Berlin kaufen'..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              autoFocus
            />
          </div>
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs disabled:opacity-40 hover:brightness-110 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Traduci & Ascolta in Cuffia</span>
            </button>
          </div>
        </form>

        {/* Quick Travel Phrase Presets */}
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Frasi Comuni Rapide ({effectiveLangKey.toUpperCase()}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {presets.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(phrase)}
                className="text-left text-xs bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/80 text-slate-200 px-3 py-1.5 rounded-xl transition-all"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
