/**
 * Continuous Speech Recognition & Simultaneous Segmenter
 * Engineered for real-time live simultaneous interpretation:
 * - Does NOT wait for speaker to pause or stop talking
 * - Uses syntactic boundary detection (German verbs/conjunctions, commas, 5-7 word chunks, micro-pauses)
 * - Streams live clauses directly into translation and in-ear audio pipeline
 * - Auto-reconnect watchdog for 1h+ uninterrupted sessions
 */

import { SupportedLang } from './offlineTranslator';

export interface SpeechCallbacks {
  onInterim: (text: string) => void;
  onChunk: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (errorMsg: string) => void;
  onStatusChange: (isListening: boolean) => void;
  onAudioLevel?: (level: number) => void;
}

export class ContinuousSpeechRecognizer {
  private recognition: any = null;
  private isDesiredRunning = false;
  private restartTimeout: any = null;
  private pauseCommitTimeout: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private wakeLock: any = null;
  private currentLanguage: SupportedLang | 'auto' = 'auto';
  private callbacks: SpeechCallbacks;

  // Track what has already been segmented and sent for translation in current speech
  private committedCharsCount = 0;
  private currentRawTranscript = '';
  private lastChunkTime = Date.now();

  private langMap: Record<SupportedLang, string> = {
    it: 'it-IT',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
  };

  constructor(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      this.committedCharsCount = 0;
      this.currentRawTranscript = '';
      this.callbacks.onStatusChange(true);
    };

    rec.onresult = (event: any) => {
      let accumulatedTranscript = '';
      let isAnyFinal = false;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        accumulatedTranscript += text;
        if (item.isFinal) {
          isAnyFinal = true;
        }
      }

      this.currentRawTranscript = accumulatedTranscript.trim();

      // Get uncommitted portion of speech
      const uncommitted = this.currentRawTranscript.slice(this.committedCharsCount).trim();

      if (uncommitted) {
        // Send interim text for live typing display on smartphone screen
        this.callbacks.onInterim(uncommitted);

        // Check if a syntactic clause or semantic boundary has occurred
        this.evaluateClauseBoundaries(uncommitted, isAnyFinal);
      }

      // If recognition marked final, flush whatever remains
      if (isAnyFinal && uncommitted) {
        this.commitChunk(uncommitted);
        this.committedCharsCount = 0;
        this.currentRawTranscript = '';
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      console.warn('Speech recognition warning:', event.error);
      if (event.error === 'not-allowed') {
        this.isDesiredRunning = false;
        this.callbacks.onError('Permesso microfono non concesso. Abilita il microfono nelle impostazioni di Safari / iOS.');
        this.callbacks.onStatusChange(false);
      }
    };

    rec.onend = () => {
      // Flush any lingering speech on end
      const uncommitted = this.currentRawTranscript.slice(this.committedCharsCount).trim();
      if (uncommitted) {
        this.commitChunk(uncommitted);
      }
      this.committedCharsCount = 0;
      this.currentRawTranscript = '';

      if (this.isDesiredRunning) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = setTimeout(() => {
          if (this.isDesiredRunning) {
            try {
              rec.start();
            } catch (err) {
              this.initRecognition();
              try {
                this.recognition?.start();
              } catch {}
            }
          }
        }, 80);
      } else {
        this.callbacks.onStatusChange(false);
      }
    };

    this.recognition = rec;
  }

  /**
   * Evaluates if the uncommitted speech contains a clause boundary or natural breath point
   */
  private evaluateClauseBoundaries(uncommittedText: string, isFinal: boolean) {
    clearTimeout(this.pauseCommitTimeout);

    // 1. Punctuation boundaries
    const punctMatch = uncommittedText.match(/([,.;?!:])\s+/);
    if (punctMatch && punctMatch.index !== undefined) {
      const splitPoint = punctMatch.index + punctMatch[1].length;
      const clause = uncommittedText.substring(0, splitPoint).trim();
      if (clause.length >= 4) {
        this.commitChunk(clause);
        return;
      }
    }

    // 2. Syntactic Conjunction Delimiters (German, Romance, English)
    // German: und, oder, aber, denn, sondern, weil, dass, wenn, als, ob, während, obwohl, damit, sodass, nachdem, bevor, dann, also
    const conjunctionRegex =
      /\s+(und|oder|aber|denn|sondern|weil|dass|daß|wenn|als|ob|während|obwohl|damit|sodass|nachdem|bevor|dann|also|e|o|ma|però|quindi|perché|se|che|quando|mentre|allora|et|ou|mais|donc|car|parce que|que|si|quand|y|pero|sino|porque|and|or|but|so|because|that|if|when|while)\s+/i;

    const conjMatch = uncommittedText.match(conjunctionRegex);
    if (conjMatch && conjMatch.index !== undefined && conjMatch.index > 8) {
      const splitPoint = conjMatch.index;
      const clause = uncommittedText.substring(0, splitPoint).trim();
      if (clause.split(/\s+/).length >= 3) {
        this.commitChunk(clause);
        return;
      }
    }

    const words = uncommittedText.split(/\s+/);

    // 3. Length threshold (5-7 words): When speaker has spoken 6+ words without boundary
    if (words.length >= 6) {
      const chunkWords = words.slice(0, 6).join(' ');
      this.commitChunk(chunkWords);
      return;
    }

    // 4. Micro-pause threshold (450ms): If the speaker makes a tiny breath pause
    // commit the current chunk so translation starts vocalizing immediately without waiting!
    if (words.length >= 2) {
      this.pauseCommitTimeout = setTimeout(() => {
        if (this.isDesiredRunning) {
          const currentRemaining = this.currentRawTranscript.slice(this.committedCharsCount).trim();
          if (currentRemaining && currentRemaining.split(/\s+/).length >= 2) {
            this.commitChunk(currentRemaining);
          }
        }
      }, 450);
    }
  }

  private commitChunk(chunkText: string) {
    const cleanChunk = chunkText.trim();
    if (!cleanChunk || cleanChunk.length < 2) return;

    // Advance committed character count
    const idx = this.currentRawTranscript.indexOf(cleanChunk, this.committedCharsCount);
    if (idx !== -1) {
      this.committedCharsCount = idx + cleanChunk.length;
    } else {
      this.committedCharsCount += cleanChunk.length;
    }

    this.lastChunkTime = Date.now();

    // Fire onChunk immediately to trigger instant translation & earphone speech!
    this.callbacks.onChunk(cleanChunk);
  }

  public setLanguage(lang: SupportedLang | 'auto') {
    this.currentLanguage = lang;
    if (this.recognition) {
      const code = lang === 'auto' ? 'de-DE' : (this.langMap[lang] || 'de-DE');
      this.recognition.lang = code;
    }
  }

  public async start(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.callbacks.onError(
        'Il tuo browser non supporta il riconoscimento vocale continuo. Su iPhone usa Safari (iOS 14.5+).'
      );
      return false;
    }

    this.isDesiredRunning = true;
    this.committedCharsCount = 0;
    this.currentRawTranscript = '';
    this.setLanguage(this.currentLanguage);

    try {
      this.recognition?.start();
    } catch (e) {}

    await this.startVisualizer();
    this.requestWakeLock();

    return true;
  }

  public stop() {
    this.isDesiredRunning = false;
    clearTimeout(this.restartTimeout);
    clearTimeout(this.pauseCommitTimeout);

    try {
      this.recognition?.stop();
    } catch {}

    this.stopVisualizer();
    this.releaseWakeLock();
    this.callbacks.onStatusChange(false);
  }

  public isRunning(): boolean {
    return this.isDesiredRunning;
  }

  private async startVisualizer() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.6;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!this.analyser || !this.isDesiredRunning) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1.0, avg / 128);

        if (this.callbacks.onAudioLevel) {
          this.callbacks.onAudioLevel(normalized);
        }

        this.animFrameId = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('Audio visualizer not available:', err);
    }
  }

  private stopVisualizer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    if (this.callbacks.onAudioLevel) {
      this.callbacks.onAudioLevel(0);
    }
  }

  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {}
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }
}
