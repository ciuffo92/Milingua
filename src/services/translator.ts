/**
 * Translation Orchestrator
 * Seamlessly manages Online Gemini 3.8 Flash, Neural Engine, & Offline Local Translation
 */

import {
  SupportedLang,
  translateOffline,
  saveOnlineTranslationToOfflineCache,
  detectLanguageOffline,
} from './offlineTranslator';

export interface TranslationPayload {
  sourceText: string;
  sourceLang: SupportedLang | 'auto';
  targetLang: SupportedLang;
  forceOffline?: boolean;
  contextHistory?: string[];
  requestTTS?: boolean;
}

export interface TranslationOutput {
  sourceText: string;
  translatedText: string;
  sourceLang: SupportedLang;
  targetLang: SupportedLang;
  isOffline: boolean;
  latencyMs: number;
  audioBase64?: string;
  matchType?: string;
}

export async function executeTranslation(payload: TranslationPayload): Promise<TranslationOutput> {
  const startTime = performance.now();
  const { sourceText, sourceLang, targetLang, forceOffline = false, contextHistory = [], requestTTS = true } = payload;

  const effectiveSource: SupportedLang =
    sourceLang === 'auto' ? detectLanguageOffline(sourceText) : sourceLang;

  // Check if forceOffline or browser is completely disconnected
  const isNetworkOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (forceOffline || isNetworkOffline) {
    const offlineResult = translateOffline(sourceText, effectiveSource, targetLang);
    return {
      sourceText,
      translatedText: offlineResult.translation,
      sourceLang: effectiveSource,
      targetLang,
      isOffline: true,
      latencyMs: Math.round(performance.now() - startTime),
      matchType: offlineResult.matchType,
    };
  }

  // Attempt online translation via Server (Tier 1 Gemini or Tier 2 Neural)
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: sourceText,
        sourceLang,
        targetLang,
        conversationContext: contextHistory.slice(-4),
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    let translatedText = data.translation;
    let matchType = data.matchType || 'ai';
    let isOffline = false;

    // If server returned null translation, fallback to local offline engine
    if (!translatedText || typeof translatedText !== 'string' || !translatedText.trim()) {
      const offlineResult = translateOffline(sourceText, effectiveSource, targetLang);
      translatedText = offlineResult.translation;
      matchType = offlineResult.matchType;
      isOffline = true;
    } else {
      // Save valid online translation to offline cache for future trips
      saveOnlineTranslationToOfflineCache(sourceText, effectiveSource, targetLang, translatedText);
    }

    let audioBase64: string | undefined;

    // If requested and online, fetch Gemini 3.8 Flash Lite TTS audio
    if (requestTTS && translatedText.length <= 300) {
      try {
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: translatedText,
            targetLang,
          }),
        });
        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          audioBase64 = ttsData.audioBase64;
        }
      } catch (ttsErr) {
        // Non-critical, audioPlayer uses device speech synthesis
      }
    }

    return {
      sourceText,
      translatedText,
      sourceLang: data.detectedLang || effectiveSource,
      targetLang,
      isOffline,
      latencyMs: Math.round(performance.now() - startTime),
      audioBase64,
      matchType,
    };
  } catch (onlineError) {
    // Seamless offline fallback
    const offlineResult = translateOffline(sourceText, effectiveSource, targetLang);
    return {
      sourceText,
      translatedText: offlineResult.translation,
      sourceLang: effectiveSource,
      targetLang,
      isOffline: true,
      latencyMs: Math.round(performance.now() - startTime),
      matchType: offlineResult.matchType,
    };
  }
}
