/**
 * Audio Player for In-Ear Continuous Translation
 * Handles low-latency audio queueing, Gemini TTS playback, and native SpeechSynthesis fallback
 */

import { SupportedLang } from './offlineTranslator';

export interface PlaybackOptions {
  speed?: number; // 0.8 to 1.5
  volume?: number; // 0 to 1.0
  voiceName?: string;
  preferNative?: boolean; // Use on-device speech synthesis for instant 0ms latency
}

type AudioQueueItem = {
  id: string;
  text: string;
  lang: SupportedLang;
  audioBase64?: string;
  options: PlaybackOptions;
};

class EarphoneAudioEngine {
  private queue: AudioQueueItem[] = [];
  private isPlaying = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private listeners: Set<(isPlaying: boolean, currentItem?: AudioQueueItem) => void> = new Set();
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.availableVoices = window.speechSynthesis.getVoices();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  public subscribe(listener: (isPlaying: boolean, currentItem?: AudioQueueItem) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isPlaying: boolean, item?: AudioQueueItem) {
    this.listeners.forEach((fn) => fn(isPlaying, item));
  }

  /**
   * Queue a translated sentence for immediate in-ear vocalization
   */
  public enqueue(
    text: string,
    lang: SupportedLang,
    audioBase64?: string,
    options: PlaybackOptions = {}
  ) {
    if (!text.trim()) return;

    const item: AudioQueueItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: text.trim(),
      lang,
      audioBase64,
      options: {
        speed: options.speed ?? 1.1,
        volume: options.volume ?? 1.0,
        voiceName: options.voiceName,
        preferNative: options.preferNative ?? false,
      },
    };

    this.queue.push(item);
    if (!this.isPlaying) {
      this.processNext();
    }
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.notify(false);
      return;
    }

    this.isPlaying = true;
    const item = this.queue.shift()!;
    this.notify(true, item);

    try {
      // If server provided high quality Gemini WAV audio and user doesn't force native
      if (item.audioBase64 && !item.options.preferNative) {
        await this.playGeminiAudio(item.audioBase64, item.options.speed || 1.1);
      } else {
        // Native SpeechSynthesis (works 100% offline and instant)
        await this.playNativeSpeech(item.text, item.lang, item.options);
      }
    } catch (err) {
      console.warn('Audio playback error, attempting fallback:', err);
      try {
        await this.playNativeSpeech(item.text, item.lang, item.options);
      } catch (fallbackErr) {
        console.error('All audio playback attempts failed:', fallbackErr);
      }
    }

    // Small pause between utterances (120ms) to sound natural
    setTimeout(() => {
      this.processNext();
    }, 120);
  }

  private playGeminiAudio(base64: string, speed = 1.1): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(`data:audio/wav;base64,${base64}`);
        this.currentAudioElement = audio;
        audio.playbackRate = Math.max(0.75, Math.min(2.0, speed));
        audio.onended = () => {
          this.currentAudioElement = null;
          resolve();
        };
        audio.onerror = (e) => {
          this.currentAudioElement = null;
          reject(e);
        };
        audio.play().catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  private playNativeSpeech(
    text: string,
    lang: SupportedLang,
    options: PlaybackOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel(); // Stop any hung utterances

      const utterance = new SpeechSynthesisUtterance(text);
      const langCodes: Record<SupportedLang, string> = {
        it: 'it-IT',
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        pt: 'pt-BR',
      };

      utterance.lang = langCodes[lang] || 'it-IT';
      utterance.rate = Math.max(0.8, Math.min(1.8, options.speed ?? 1.1));
      utterance.pitch = 1.0;
      utterance.volume = options.volume ?? 1.0;

      // Select best local voice for the language (e.g. Siri, Apple, Google, natural)
      if (this.availableVoices.length > 0) {
        const matching = this.availableVoices.filter(
          (v) => v.lang.startsWith(lang) || v.lang.replace('_', '-').startsWith(langCodes[lang].substring(0, 2))
        );
        // Prefer enhanced or Siri/Natural voices if available
        const preferred = matching.find(
          (v) => v.name.includes('Siri') || v.name.includes('Natural') || v.name.includes('Enhanced') || v.name.includes('Google')
        ) || matching[0];

        if (preferred) {
          utterance.voice = preferred;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopAll() {
    this.queue = [];
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this.notify(false);
  }

  public testEarphones(lang: SupportedLang = 'it'): Promise<void> {
    const testPhrases: Record<SupportedLang, string> = {
      it: 'Audio attivo. Traduzione in cuffia pronta.',
      en: 'Audio connected. In-ear translation ready.',
      es: 'Audio conectado. Traducción lista en auriculares.',
      fr: 'Audio connecté. Traduction prête dans vos écouteurs.',
      de: 'Audio aktiv. Übersetzung im Kopfhörer bereit.',
      pt: 'Áudio conectado. Tradução pronta nos fones.',
    };

    return this.playNativeSpeech(testPhrases[lang] || testPhrases.it, lang, { speed: 1.05 });
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const earphoneAudio = new EarphoneAudioEngine();
