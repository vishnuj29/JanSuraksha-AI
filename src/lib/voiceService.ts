/// <reference lib="dom" />

/**
 * Enterprise Multi-Lingual Voice Recognition & Audio Engine for JanSuraksha AI
 * Strictly restricted to 4 emergency triggers:
 * 1. "Help"
 * 2. "Bachao" / "Bacho"
 * 3. "Suraksha"
 * 4. "Madad Karo" / "Madad"
 * (Plus optional custom secret word)
 * 
 * Uses exact word-boundary matching to prevent false positives (e.g., "hello" will NEVER trigger).
 */

export interface VoiceServiceConfig {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (transcript: string, isFinal: boolean, fullSessionTranscript: string) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onAudioStart?: () => void;
}

export class VoiceService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private isSupported = false;
  private isListening = false;
  private shouldRestart = false;
  private restartTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
  private currentConfig: VoiceServiceConfig | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private volumeInterval: ReturnType<typeof globalThis.setInterval> | null = null;
  private selectedDeviceId: string | null = null;

  constructor() {
    const SpeechRecognitionConstructor =
      typeof window !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (SpeechRecognitionConstructor) {
      this.recognition = new SpeechRecognitionConstructor();
      this.isSupported = true;
    }
  }

  isVoiceAPISupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get list of audio input devices (Microphones)
   */
  async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch {
      return [];
    }
  }

  /**
   * Set specific microphone device ID
   */
  setDeviceId(deviceId: string): void {
    this.selectedDeviceId = deviceId;
  }

  /**
   * Start Web Audio API Volume Monitoring with AudioContext.resume() and RMS calculation
   */
  async startAudioMeter(onVolume: (vol: number) => void): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return false;
      }

      this.stopAudioMeter();

      const constraints: MediaStreamConstraints = {
        audio: this.selectedDeviceId
          ? {
              deviceId: { exact: this.selectedDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.micStream = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return true;

      this.audioContext = new AudioCtx();
      
      // Resume AudioContext for browser autoplay policy
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);

      const bufferLength = this.analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      this.volumeInterval = globalThis.setInterval(() => {
        if (!this.analyser) return;

        this.analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }

        const rms = Math.sqrt(sumSquares / bufferLength);
        const volume = Math.min(100, Math.round(rms * 350));
        onVolume(volume);
      }, 60);

      return true;
    } catch (err) {
      console.warn('[VoiceService] Audio meter error:', err);
      return false;
    }
  }

  stopAudioMeter(): void {
    if (this.volumeInterval) {
      globalThis.clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;
  }

  /**
   * Initialize speech recognition
   */
  initialize(config: VoiceServiceConfig): void {
    if (!this.recognition) {
      throw new Error('Speech Recognition API not supported in this browser');
    }

    this.currentConfig = config;
    this.recognition.continuous = config.continuous ?? true;
    this.recognition.interimResults = config.interimResults ?? true;
    this.recognition.lang = config.lang ?? 'en-IN';
    this.recognition.maxAlternatives = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let cumulativeTranscript = '';
      let currentChunk = '';
      let isFinal = false;

      // 1. Cumulative transcript across all speech events
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res) continue;
        const piece = res[0]?.transcript || '';
        cumulativeTranscript += ' ' + piece;
        if (i === event.results.length - 1) {
          isFinal = res.isFinal;
        }
      }

      // 2. Current interim chunk
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res) continue;
        for (let alt = 0; alt < res.length; alt++) {
          const piece = res[alt]?.transcript || '';
          if (piece) {
            currentChunk += ' ' + piece;
          }
        }
      }

      const cleanChunk = currentChunk.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
      const cleanFull = cumulativeTranscript.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

      if (cleanChunk || cleanFull) {
        config.onResult(cleanChunk || cleanFull, isFinal, cleanFull);
      }
    };

    this.recognition.onaudiostart = () => {
      console.log('[VoiceService] 🎙️ Speech recognition audio start');
      if (config.onAudioStart) config.onAudioStart();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      const err = event.error || 'unknown';
      console.warn('[VoiceService] Speech Recognition Event:', err);

      if (err === 'no-speech' || err === 'aborted') {
        return;
      }

      if (err === 'not-allowed') {
        this.shouldRestart = false;
        this.isListening = false;
        config.onError('Microphone permission denied. Please allow microphone access in your browser.');
        return;
      }

      config.onError(`Voice status: ${err}`);
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('[VoiceService] 🔊 Speech recognition listening active');
      if (config.onStart) config.onStart();
    };

    this.recognition.onend = () => {
      console.log('[VoiceService] 🛑 Session cycle finished. ShouldRestart:', this.shouldRestart);

      if (config.onEnd) config.onEnd();

      if (this.shouldRestart) {
        if (this.restartTimeout) globalThis.clearTimeout(this.restartTimeout);
        this.restartTimeout = globalThis.setTimeout(() => {
          if (this.shouldRestart) {
            try {
              this.recognition.start();
              console.log('[VoiceService] 🔄 Auto-reconnected speech recognition');
            } catch (e) {
              console.warn('[VoiceService] Reconnection notice:', e);
            }
          }
        }, 150);
      } else {
        this.isListening = false;
      }
    };
  }

  setLanguage(lang: string): void {
    if (this.recognition) {
      const wasListening = this.isListening;
      this.stop();
      this.recognition.lang = lang;
      if (wasListening) {
        this.start();
      }
    }
  }

  start(): void {
    if (!this.recognition) {
      throw new Error('Voice service not initialized');
    }
    this.shouldRestart = true;
    this.isListening = true;
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[VoiceService] Start notice:', e);
    }
  }

  stop(): void {
    this.shouldRestart = false;
    this.isListening = false;
    if (this.restartTimeout) {
      globalThis.clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.stopAudioMeter();
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {}
  }

  abort(): void {
    this.shouldRestart = false;
    this.isListening = false;
    if (this.restartTimeout) {
      globalThis.clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.stopAudioMeter();
    if (!this.recognition) return;
    try {
      this.recognition.abort();
    } catch {}
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

/**
 * EXACT ALLOWED 4 EMERGENCY TRIGGER KEYWORDS & SYNONYMS
 * ONLY these 4 categories will trigger emergency SOS.
 */
export const ALLOWED_4_TRIGGERS: Record<string, string[]> = {
  help: [
    'help', 'help me', 'please help', 'help please', 'help emergency', 'help help', 'need help', 'i need help',
    'हेल्प', 'हेल्प मी'
  ],
  bachao: [
    'bachao', 'bacho', 'bachoo', 'bachaao', 'bachao bachao', 'bacho bacho', 'mujhe bachao', 'bachao mujhe',
    'बचाओ', 'बचो', 'बचाव', 'बचाओ बचाओ', 'मुझे बचाओ', 'बचाओ मुझे'
  ],
  suraksha: [
    'suraksha', 'suraksh', 'suraksha karo', 'meri suraksha',
    'सुरक्षा', 'सुरक्ष', 'सुरक्षा करो'
  ],
  'madad karo': [
    'madad karo', 'madad', 'meri madad karo', 'madad kijiye', 'madad chahiye', 'madat karo',
    'मदद करो', 'मदद', 'मदद कीजिये', 'मेरी मदद करो', 'मदद चाहिए'
  ],
};

/**
 * Helper to test exact word/phrase boundary in normalized text
 */
function matchesExactWordOrPhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const t = text.trim();
  const p = phrase.trim().toLowerCase();

  // If text equals phrase directly
  if (t === p) return true;

  // Word boundary regex test: (^|\s)phrase(\s|$)
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'u');
  return regex.test(t);
}

/**
 * High-accuracy multi-lingual trigger matcher
 * Strictly allows ONLY the 4 keywords (plus user-configured secret word).
 * Prevents false positives from words like "hello", "helmet", "holder".
 */
export const triggerWordMatcher = {
  isValidLength: (transcript: string, minLength: number = 2): boolean => {
    return transcript.trim().length >= minLength;
  },

  findMatch: (transcript: string, customSecretTriggers: string[] = []): string | null => {
    if (!transcript) return null;

    const normalized = transcript
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized || normalized.length < 2) return null;

    // Explicit check against conversational non-emergency words that start with 'hel'
    const words = normalized.split(/\s+/);
    const hasOnlyHello = words.every((w) => w === 'hello' || w === 'hey' || w === 'hi' || w === 'hola');
    if (hasOnlyHello) {
      return null;
    }

    // 1. Check the 4 Core Triggers
    // Trigger 1: HELP
    for (const alias of ALLOWED_4_TRIGGERS.help) {
      if (matchesExactWordOrPhrase(normalized, alias)) {
        return 'help';
      }
    }

    // Trigger 2: BACHAO / BACHO
    for (const alias of ALLOWED_4_TRIGGERS.bachao) {
      if (matchesExactWordOrPhrase(normalized, alias)) {
        return 'bachao';
      }
    }

    // Trigger 3: SURAKSHA
    for (const alias of ALLOWED_4_TRIGGERS.suraksha) {
      if (matchesExactWordOrPhrase(normalized, alias)) {
        return 'suraksha';
      }
    }

    // Trigger 4: MADAD KARO / MADAD
    for (const alias of ALLOWED_4_TRIGGERS['madad karo']) {
      if (matchesExactWordOrPhrase(normalized, alias)) {
        return 'madad karo';
      }
    }

    // 2. Check Custom User Secret Word if configured
    for (const custom of customSecretTriggers) {
      const c = custom.toLowerCase().trim();
      if (!c) continue;
      // Skip if custom is one of standard triggers already checked
      if (['help', 'bachao', 'suraksha', 'madad karo', 'madad', 'bacho'].includes(c)) continue;

      if (matchesExactWordOrPhrase(normalized, c)) {
        return custom;
      }
    }

    return null;
  },
};
