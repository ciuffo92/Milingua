/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { LanguageSelector, SUPPORTED_LANGUAGES } from './components/LanguageSelector';
import { TeleprompterView } from './components/TeleprompterView';
import { DualSplitView } from './components/DualSplitView';
import { TranscriptView } from './components/TranscriptView';
import { ControlDock } from './components/ControlDock';
import { SettingsModal } from './components/SettingsModal';
import { QuickInputModal } from './components/QuickInputModal';
import { ContinuousSpeechRecognizer } from './services/speechService';
import { earphoneAudio } from './services/audioPlayer';
import { executeTranslation } from './services/translator';
import { SupportedLang, translateOffline } from './services/offlineTranslator';
import { TranslationItem, ViewMode, AppSettings } from './types';
import { AlertCircle, X, Sparkles } from 'lucide-react';

const STORAGE_KEY_SETTINGS = 'omni_voice_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  inEarAudioEnabled: true,
  speechSpeed: 1.15,
  preferNativeVoice: false,
  offlineTravelMode: false,
  fontSize: 'large',
  autoScroll: true,
  hapticFeedback: true,
};

export default function App() {
  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Languages: Default source is 'de' (German) and target is 'it' (Italian)
  const [sourceLang, setSourceLang] = useState<SupportedLang | 'auto'>('de');
  const [targetLang, setTargetLang] = useState<SupportedLang>('it');

  // Translation Items & Stream State
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [interimTranslation, setInterimTranslation] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('teleprompter');

  // Dual Face-to-Face active speaker tracking: 'interlocutor' or 'user'
  const [activeSpeaker, setActiveSpeaker] = useState<'interlocutor' | 'user' | null>(null);
  const activeSpeakerRef = useRef<'interlocutor' | 'user' | null>(null);

  // Session Timer for 1-hour+ continuous listening
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Modals & Banners
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQuickInputOpen, setIsQuickInputOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References
  const recognizerRef = useRef<ContinuousSpeechRecognizer | null>(null);
  const contextHistoryRef = useRef<string[]>([]);

  // Keep ref in sync
  useEffect(() => {
    activeSpeakerRef.current = activeSpeaker;
  }, [activeSpeaker]);

  // Save settings when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Audio Player subscription
  useEffect(() => {
    const unsubscribe = earphoneAudio.subscribe((playing, currentItem) => {
      setIsPlayingAudio(playing);
      setCurrentSpeakingId(currentItem?.id);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Timer watchdog for long continuous sessions
  useEffect(() => {
    if (isListening) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isListening]);

  // Translation executor
  const handleProcessUtterance = useCallback(
    async (spokenPhrase: string) => {
      if (!spokenPhrase.trim()) return;

      const speakerWhoSpoke = activeSpeakerRef.current;

      // Determine translation direction
      // If user spoke Italian: translate from targetLang (it) to sourceLang (de/fr/en/es/pt)
      // If interlocutor spoke or default: translate from sourceLang to targetLang (it)
      let fromLang: SupportedLang | 'auto' = sourceLang;
      let toLang: SupportedLang = targetLang;

      if (speakerWhoSpoke === 'user') {
        fromLang = targetLang;
        toLang = sourceLang === 'auto' ? 'de' : sourceLang;
      }

      // Update context memory
      contextHistoryRef.current.push(spokenPhrase.trim());
      if (contextHistoryRef.current.length > 8) {
        contextHistoryRef.current = contextHistoryRef.current.slice(-8);
      }

      const tempId = Math.random().toString(36).substring(2, 9);
      setInterimText('');

      try {
        const result = await executeTranslation({
          sourceText: spokenPhrase.trim(),
          sourceLang: fromLang,
          targetLang: toLang,
          forceOffline: settings.offlineTravelMode,
          contextHistory: contextHistoryRef.current,
          requestTTS: settings.inEarAudioEnabled,
        });

        const newItem: TranslationItem = {
          id: tempId,
          timestamp: new Date(),
          sourceText: result.sourceText,
          translatedText: result.translatedText,
          sourceLang: fromLang,
          effectiveSourceLang: result.sourceLang,
          targetLang: result.targetLang,
          isOffline: result.isOffline,
          latencyMs: result.latencyMs,
          matchType: result.matchType,
        };

        setItems((prev) => [...prev, newItem]);

        // Vocalize translation in earphones or device speaker
        if (settings.inEarAudioEnabled) {
          earphoneAudio.enqueue(result.translatedText, result.targetLang, result.audioBase64, {
            speed: settings.speechSpeed,
            preferNative: settings.preferNativeVoice,
          });
        }
      } catch (err: any) {
        console.error('Translation workflow error:', err);
      }
    },
    [sourceLang, targetLang, settings]
  );

  // Live real-time subtitle translation while speaker is uttering words
  useEffect(() => {
    if (!interimText.trim()) {
      setInterimTranslation('');
      return;
    }

    const timer = setTimeout(() => {
      const speakerWhoSpoke = activeSpeakerRef.current;
      let fromLang: SupportedLang | 'auto' = sourceLang;
      let toLang: SupportedLang = targetLang;

      if (speakerWhoSpoke === 'user') {
        fromLang = targetLang;
        toLang = sourceLang === 'auto' ? 'de' : sourceLang;
      }

      const quick = translateOffline(interimText, fromLang, toLang);
      if (quick && quick.translation) {
        setInterimTranslation(quick.translation);
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [interimText, sourceLang, targetLang]);

  // Initialize Speech Recognizer
  useEffect(() => {
    const recognizer = new ContinuousSpeechRecognizer({
      onInterim: (text) => {
        setInterimText(text);
      },
      onChunk: (chunkText) => {
        // Stream chunk immediately for real-time translation & earphone speech!
        handleProcessUtterance(chunkText);
      },
      onFinal: (text) => {
        handleProcessUtterance(text);
      },
      onError: (msg) => {
        setErrorMessage(msg);
      },
      onStatusChange: (listening) => {
        setIsListening(listening);
        if (!listening) {
          setAudioLevel(0);
          setActiveSpeaker(null);
          setInterimText('');
          setInterimTranslation('');
        }
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
    });

    recognizer.setLanguage(sourceLang);
    recognizerRef.current = recognizer;

    return () => {
      recognizer.stop();
      earphoneAudio.stopAll();
    };
  }, [handleProcessUtterance]);

  // Update speech recognition language when source changes
  useEffect(() => {
    if (recognizerRef.current && (!activeSpeaker || activeSpeaker === 'interlocutor')) {
      recognizerRef.current.setLanguage(sourceLang);
    }
  }, [sourceLang, activeSpeaker]);

  // Toggle Live Listening from main bottom dock (Teleprompter mode)
  const toggleListening = async () => {
    if (!recognizerRef.current) return;

    setErrorMessage(null);

    if (isListening) {
      recognizerRef.current.stop();
      setActiveSpeaker(null);
    } else {
      earphoneAudio.stopAll();
      setActiveSpeaker('interlocutor');
      recognizerRef.current.setLanguage(sourceLang);
      const started = await recognizerRef.current.start();
      if (!started) {
        setIsListening(false);
        setActiveSpeaker(null);
      }
    }
  };

  // Toggle specific speaker in Face-to-Face Dual mode
  const handleToggleSpeaker = async (speaker: 'interlocutor' | 'user') => {
    if (!recognizerRef.current) return;

    setErrorMessage(null);

    if (isListening && activeSpeaker === speaker) {
      // User tapped currently active mic -> Stop
      recognizerRef.current.stop();
      setActiveSpeaker(null);
      return;
    }

    earphoneAudio.stopAll();

    // Set recognition language to match who is speaking!
    if (speaker === 'user') {
      recognizerRef.current.setLanguage(targetLang); // e.g. 'it'
    } else {
      recognizerRef.current.setLanguage(sourceLang); // e.g. 'de'
    }

    setActiveSpeaker(speaker);

    if (!isListening) {
      const started = await recognizerRef.current.start();
      if (!started) {
        setIsListening(false);
        setActiveSpeaker(null);
      }
    }
  };

  // Swap Languages
  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    const oldSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(oldSource);
  };

  // Speed multiplier cycle
  const cycleSpeed = () => {
    const speeds = [1.0, 1.15, 1.25, 1.35];
    const currentIndex = speeds.findIndex((s) => Math.abs(s - settings.speechSpeed) < 0.05);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSettings((prev) => ({ ...prev, speechSpeed: nextSpeed }));
  };

  // Font size toggle
  const toggleFontSize = () => {
    const next =
      settings.fontSize === 'normal'
        ? 'large'
        : settings.fontSize === 'large'
        ? 'extra'
        : 'normal';
    setSettings((prev) => ({ ...prev, fontSize: next }));
  };

  // Test Earphones Sound
  const handleTestAudio = () => {
    earphoneAudio.testEarphones(targetLang);
  };

  // Replay specific sentence
  const handleReplaySentence = (item: TranslationItem) => {
    earphoneAudio.enqueue(item.translatedText, item.targetLang, undefined, {
      speed: settings.speechSpeed,
      preferNative: settings.preferNativeVoice,
    });
  };

  // Replay specific audio text in given language
  const handleReplayTextAndLang = (text: string, lang: SupportedLang) => {
    earphoneAudio.enqueue(text, lang, undefined, {
      speed: settings.speechSpeed,
      preferNative: settings.preferNativeVoice,
    });
  };

  // Target and Source language names
  const targetName =
    SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-[#090d16] text-slate-100 font-sans pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] overflow-x-hidden">
      {/* Top Header */}
      <Header
        isListening={isListening}
        isPlayingAudio={isPlayingAudio}
        isOfflineMode={settings.offlineTravelMode}
        inEarAudioEnabled={settings.inEarAudioEnabled}
        onToggleInEarAudio={() =>
          setSettings((prev) => ({ ...prev, inEarAudioEnabled: !prev.inEarAudioEnabled }))
        }
        viewMode={viewMode}
        onChangeViewMode={(mode) => {
          if (isListening && viewMode !== mode) {
            recognizerRef.current?.stop();
            setActiveSpeaker(null);
          }
          setViewMode(mode);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        elapsedSeconds={elapsedSeconds}
      />

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="w-full max-w-xl mx-auto px-3.5 pt-1.5 shrink-0 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-900/50 rounded-lg text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Language Selector Bar (Visible only in Teleprompter and Transcript modes to preserve 100% height in Dual mode) */}
      {viewMode !== 'dual-split' && (
        <div className="shrink-0">
          <LanguageSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            onChangeSource={setSourceLang}
            onChangeTarget={setTargetLang}
            onSwapLanguages={handleSwapLanguages}
            isListening={isListening}
          />
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col w-full relative">
        {viewMode === 'teleprompter' && (
          <TeleprompterView
            items={items}
            interimText={interimText}
            interimTranslation={interimTranslation}
            isListening={isListening}
            isPlayingAudio={isPlayingAudio}
            currentSpeakingId={currentSpeakingId}
            fontSize={settings.fontSize}
            onReplayAudio={handleReplaySentence}
            targetLangName={targetName}
          />
        )}

        {viewMode === 'dual-split' && (
          <DualSplitView
            items={items}
            interimText={interimText}
            interimTranslation={interimTranslation}
            isListening={isListening}
            activeSpeaker={activeSpeaker}
            onToggleSpeaker={handleToggleSpeaker}
            onReplayAudio={handleReplayTextAndLang}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onChangeSource={setSourceLang}
            onChangeTarget={setTargetLang}
            onSwapLanguages={handleSwapLanguages}
          />
        )}

        {viewMode === 'transcript' && (
          <TranscriptView
            items={items}
            onClear={() => setItems([])}
            onReplayAudio={handleReplaySentence}
            sessionElapsedSec={elapsedSeconds}
          />
        )}
      </main>

      {/* Bottom Floating Control Dock (Visible in Teleprompter and Transcript modes) */}
      {viewMode !== 'dual-split' && (
        <ControlDock
          isListening={isListening}
          isPlayingAudio={isPlayingAudio}
          audioLevel={audioLevel}
          onToggleListening={toggleListening}
          speechSpeed={settings.speechSpeed}
          onChangeSpeed={cycleSpeed}
          fontSize={settings.fontSize}
          onToggleFontSize={toggleFontSize}
          onTestAudio={handleTestAudio}
          onOpenQuickInput={() => setIsQuickInputOpen(true)}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onTestVoice={handleTestAudio}
      />

      <QuickInputModal
        isOpen={isQuickInputOpen}
        onClose={() => setIsQuickInputOpen(false)}
        onSubmitText={handleProcessUtterance}
        sourceLang={sourceLang}
        targetLang={targetLang}
      />
    </div>
  );
}
