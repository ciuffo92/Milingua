/**
 * Translation Orchestrator
 * Seamlessly manages Online Gemini 3.8 Flash, Direct Client Neural Engine, & Offline Local Translation.
 * Fully compatible with GitHub Pages static deployment and full-stack servers.
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

// Client-side direct neural translation for static hosts like GitHub Pages
async function translateViaDirectClientNeural(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  try {
    const src = sourceLang === 'auto' ? 'autodetect' : sourceLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(targetLang)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const translation = data?.responseData?.translatedText;
      if (
        translation &&
        typeof translation === 'string' &&
        translation.trim() &&
        !translation.includes('MYMEMORY WARNING')
      ) {
        return translation.trim();
      }
    }
  } catch {}
  return null;
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

  // 1. Attempt online translation via Server (if hosted with backend)
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

    if (response.ok) {
      const data = await response.json();
      let translatedText = data.translation;
      let matchType = data.matchType || 'ai';
      let isOffline = false;

      if (!translatedText || typeof translatedText !== 'string' || !translatedText.trim()) {
        const directTranslation = await translateViaDirectClientNeural(sourceText, effectiveSource, targetLang);
        if (directTranslation) {
          translatedText = directTranslation;
          matchType = 'client-neural';
        } else {
          const offlineResult = translateOffline(sourceText, effectiveSource, targetLang);
          translatedText = offlineResult.translation;
          matchType = offlineResult.matchType;
          isOffline = true;
        }
      } else {
        saveOnlineTranslationToOfflineCache(sourceText, effectiveSource, targetLang, translatedText);
      }

      let audioBase64: string | undefined;

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
        } catch {}
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
    }
  } catch {
    // Backend fetch failed (e.g. running on GitHub Pages static host)
  }

  // 2. Direct client-side neural translation (Perfect for GitHub Pages!)
  const directTranslation = await translateViaDirectClientNeural(sourceText, effectiveSource, targetLang);
  if (directTranslation) {
    saveOnlineTranslationToOfflineCache(sourceText, effectiveSource, targetLang, directTranslation);
    return {
      sourceText,
      translatedText: directTranslation,
      sourceLang: effectiveSource,
      targetLang,
      isOffline: false,
      latencyMs: Math.round(performance.now() - startTime),
      matchType: 'github-pages-neural',
    };
  }

  // 3. Seamless offline fallback
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
