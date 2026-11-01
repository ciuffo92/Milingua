import React, { useState, useEffect } from 'react';
import {
  X,
  WifiOff,
  Sparkles,
  Headphones,
  Sliders,
  BatteryCharging,
  Smartphone,
  Info,
  Check,
  Trash2,
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onTestVoice: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onTestVoice,
}) => {
  const [cachedCount, setCachedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem('omni_offline_translations_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          setCachedCount(Object.keys(parsed).length);
        } else {
          setCachedCount(0);
        }
      } catch {
        setCachedCount(0);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clearCache = () => {
    localStorage.removeItem('omni_offline_translations_v1');
    setCachedCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Impostazioni & Ottimizzazione iPhone
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Offline Travel Mode */}
        <div className="mb-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Modalità Viaggio Offline</h3>
                <p className="text-xs text-slate-400">
                  Funziona senza connessione internet né consumo dati
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.offlineTravelMode}
                onChange={(e) => onUpdateSettings({ offlineTravelMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
          <p className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
            Utilizza il dizionario integrato multilingue e la sintesi vocale on-device di iOS. Salva automaticamente le frasi apprese durante i tuoi viaggi.
          </p>
        </div>

        {/* Section 2: Audio & In-Ear Latency */}
        <div className="mb-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Headphones className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Audio & Voce nelle Cuffie</h3>
          </div>

          {/* Engine choice */}
          <div className="space-y-2 mb-4">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/70 cursor-pointer hover:border-indigo-500/50 transition-colors">
              <input
                type="radio"
                name="voiceEngine"
                checked={!settings.preferNativeVoice}
                onChange={() => onUpdateSettings({ preferNativeVoice: false })}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Gemini 3.8 Flash Lite TTS (Voce Naturale Studio)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Voce umana fluida ad alta fedeltà generata nel cloud quando online.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/70 cursor-pointer hover:border-indigo-500/50 transition-colors">
              <input
                type="radio"
                name="voiceEngine"
                checked={settings.preferNativeVoice}
                onChange={() => onUpdateSettings({ preferNativeVoice: true })}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  Sintesi On-Device iOS / Siri (Latenza Zero 0ms)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Istantaneo, consuma pochissima batteria ed è perfetto per seguire chi parla molto veloce.
                </p>
              </div>
            </label>
          </div>

          {/* Speed slider */}
          <div className="mb-3">
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span>Velocità Voce in Cuffia:</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.speechSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.9"
              max="1.35"
              step="0.05"
              value={settings.speechSpeed}
              onChange={(e) => onUpdateSettings({ speechSpeed: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.9x (Calma)</span>
              <span>1.15x (Consigliata)</span>
              <span>1.35x (Per chi parla veloce)</span>
            </div>
          </div>

          <button
            onClick={onTestVoice}
            className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Ascolta Voce di Prova in Cuffia
          </button>
        </div>

        {/* Section 3: 1-Hour Continuous Speech & iPhone Optimization */}
        <div className="mb-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <Info className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Consigli per Conversazioni Lunghe (1 ora+)</h3>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>
              <strong>Schermo Attivo (WakeLock):</strong> L'app mantiene automaticamente lo schermo dell'iPhone acceso durante la registrazione per non interrompere l'ascolto.
            </li>
            <li>
              <strong>Watchdog anti-disconnessione:</strong> Safari a volte silenzia il microfono dopo le pause; Milingua riavvia il microfono all'istante senza toccare lo schermo.
            </li>
            <li>
              <strong>Cuffie / AirPods:</strong> Per la migliore esperienza, mantieni le AirPods o le cuffie Bluetooth collegate. In questo modo il microfono del telefono cattura l'interlocutore mentre tu ascolti la traduzione privata.
            </li>
          </ul>
        </div>

        {/* Section 4: Offline Memory Cache */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-white">Frasi in memoria offline: </span>
            <span className="font-mono text-cyan-400">{cachedCount}</span>
          </div>
          {cachedCount > 0 && (
            <button
              onClick={clearCache}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Svuota cache</span>
            </button>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-950/50"
          >
            Chiudi Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
};
