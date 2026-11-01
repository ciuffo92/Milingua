import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

function hasValidApiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'MY_GEMINI_API_KEY');
}

// Initialize GoogleGenAI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const LANGUAGE_NAMES: Record<string, string> = {
  it: 'Italian (Italiano)',
  en: 'English',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  pt: 'Portuguese (Português)',
  auto: 'Auto-detect source language',
};

// Fallback high-quality neural translation service
async function translateWithNeuralFallback(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  try {
    const srcCode = sourceLang === 'auto' ? 'en' : sourceLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(srcCode)}|${encodeURIComponent(targetLang)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const translation = data?.responseData?.translatedText;
      if (translation && typeof translation === 'string' && translation.trim() && !translation.includes('MYMEMORY WARNING')) {
        return translation.trim();
      }
    }
  } catch (err) {
    // Non-fatal, caller will fallback to local dictionary
  }
  return null;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = hasValidApiKey();
  res.json({
    status: 'ok',
    geminiConfigured: hasKey,
    timestamp: new Date().toISOString(),
  });
});

// Translation endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { text, sourceLang = 'auto', targetLang = 'it', conversationContext = [] } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text parameter is required.' });
  }

  const cleanInput = text.trim();

  // If source and target are identical
  if (sourceLang !== 'auto' && sourceLang === targetLang) {
    return res.json({
      translation: cleanInput,
      detectedLang: sourceLang,
      latencyMs: Date.now() - startTime,
      matchType: 'identical',
    });
  }

  // TIER 1: If GEMINI_API_KEY is available in Secrets, use Gemini 3.8 Flash
  if (hasValidApiKey()) {
    try {
      const targetLangName = LANGUAGE_NAMES[targetLang] || targetLang;
      const sourceLangName = sourceLang === 'auto' ? 'the detected spoken language' : (LANGUAGE_NAMES[sourceLang] || sourceLang);

      const contextSnippet = Array.isArray(conversationContext) && conversationContext.length > 0
        ? `Recent conversation context for reference:\n${conversationContext.slice(-4).join('\n')}\n\n`
        : '';

      const systemInstruction = `You are an ultra-fast, professional simultaneous interpreter for live conversations between speakers.
Task: Translate the incoming spoken utterance accurately and naturally into ${targetLangName} from ${sourceLangName}.
Rules:
1. Deliver a natural, fluent, spoken translation that captures colloquial nuances, proper nouns, and context.
2. Return ONLY the plain translation text. Do NOT add quotation marks, explanations, notes, or prefixes.
3. Keep the translation concise and immediate so it can be vocalized smoothly into the listener's earphones without delay.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${contextSnippet}Translate this spoken utterance into ${targetLangName}:\n"${cleanInput}"`,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const translatedText = (response.text || '').trim();
      const cleanTranslation = translatedText.replace(/^["']|["']$/g, '').trim();

      if (cleanTranslation) {
        return res.json({
          translation: cleanTranslation,
          sourceLang,
          targetLang,
          latencyMs: Date.now() - startTime,
          matchType: 'gemini-3.8-flash',
        });
      }
    } catch (geminiError: any) {
      // Gracefully fall through to Tier 2
    }
  }

  // TIER 2: High quality neural translation service (fluent, natural sentence translations)
  const fallbackTranslation = await translateWithNeuralFallback(cleanInput, sourceLang, targetLang);
  if (fallbackTranslation) {
    return res.json({
      translation: fallbackTranslation,
      sourceLang,
      targetLang,
      latencyMs: Date.now() - startTime,
      matchType: 'neural-engine',
    });
  }

  // TIER 3: Return null so frontend uses local offline dictionary
  return res.json({
    translation: null,
    sourceLang,
    targetLang,
    latencyMs: Date.now() - startTime,
    matchType: 'offline-needed',
  });
});

// TTS endpoint
app.post('/api/tts', async (req: Request, res: Response) => {
  const { text, targetLang = 'it', voiceName } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text parameter is required for TTS.' });
  }

  if (!hasValidApiKey()) {
    return res.json({
      canFallback: true,
      audioBase64: null,
    });
  }

  const selectedVoice = voiceName || (targetLang === 'it' || targetLang === 'es' ? 'Kore' : 'Zephyr');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: 'Clear, natural, articulate conversational tone for earphone listening',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    }
  } catch (error: any) {
    // Non-fatal
  }

  return res.json({
    canFallback: true,
    audioBase64: null,
  });
});

// Vite middleware in dev or static server in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
