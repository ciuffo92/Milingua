import { SupportedLang } from './services/offlineTranslator';

export interface TranslationItem {
  id: string;
  timestamp: Date;
  sourceText: string;
  translatedText: string;
  sourceLang: SupportedLang | 'auto';
  effectiveSourceLang: SupportedLang;
  targetLang: SupportedLang;
  isOffline: boolean;
  latencyMs: number;
  matchType?: string;
  isPlayingAudio?: boolean;
}

export type ViewMode = 'teleprompter' | 'dual-split' | 'transcript';

export interface AppSettings {
  inEarAudioEnabled: boolean;
  speechSpeed: number; // 0.9 to 1.4
  preferNativeVoice: boolean; // true = 0ms native device speech, false = Gemini studio audio
  offlineTravelMode: boolean; // force offline mode even if connected
  fontSize: 'normal' | 'large' | 'extra';
  autoScroll: boolean;
  hapticFeedback: boolean;
}
