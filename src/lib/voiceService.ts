/// <reference lib="dom" />

/**
 * Enterprise Multi-Lingual Voice Recognition & Audio Engine for JanSuraksha AI
 * Built with robust support for Mobile Devices (Android Chrome, iOS Safari)
 * and Integrated Laptop Microphones (Realtek, Intel Smart Sound, Apple Audio).
 * 
 * Strictly restricted to 4 emergency triggers:
 * 1. "Help"
 * 2. "Bachao" / "Bacho"
 * 3. "Suraksha"
 * 4. "Madad Karo" / "Madad"
 * (Plus optional custom secret word)
 */

export interface VoiceServiceConfig {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (transcript: string, isFinal: boolean, fullSessionTranscript: string, alternatives?: string[]) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onAudioStart?: () => void;
}

export interface SpeechDiagnostics {
  isSupported: boolean;
  isSecureContext: boolean;
  isMobile: boolean;
  browserName: string;
  hasMediaDevices: boolean;
}

export class VoiceService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private isSupported = false;
  private isListening = false;
  private isStarting = false;
  private shouldRestart = false;
  private restartTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
  private currentConfig: VoiceServiceConfig | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private volumeInterval: ReturnType<typeof globalThis.setInterval> | null = null;
  private selectedDeviceId: string | null = null;
  private consecutiveErrors = 0;

  constructor() {
    const SpeechRecognitionConstructor =
      typeof window !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (SpeechRecognitionConstructor) {
      try {
        this.recognition = new SpeechRecognitionConstructor();
        this.isSupported = true;
      } catch (e) {
        console.warn('[VoiceService] Failed to construct SpeechRecognition:', e);
        this.isSupported = false;
      }
    }
  }

  isVoiceAPISupported(): boolean {
    return this.isSupported;
  }

  /**
   * Diagnostic details for environment & browser capabilities
   */
  getDiagnostics(): SpeechDiagnostics {
    const isClient = typeof window !== 'undefined';
    const ua = isClient ? navigator.userAgent : '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isSecureContext = isClient ? window.isSecureContext ?? (window.location.protocol === 'https:' || window.location.hostname === 'localhost') : false;
    const hasMediaDevices = isClient ? !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) : false;

    let browserName = 'Unknown Browser';
    if (/Edg/i.test(ua)) browserName = 'Microsoft Edge';
    else if (/Chrome/i.test(ua)) browserName = 'Google Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browserName = 'Mozilla Firefox';

    return {
      isSupported: this.isSupported,
      isSecureContext,
      isMobile,
      browserName,
      hasMediaDevices,
    };
  }

  /**
   * Safe microphone permission request and device discovery
   */
  async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release test stream immediately
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.warn('[VoiceService] Microphone permission request error:', err);
      return false;
    }
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
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      // Filter unique device IDs
      const unique = audioInputs.filter((d, idx, arr) => arr.findIndex((x) => x.deviceId === d.deviceId) === idx);
      return unique;
    } catch {
      return [];
    }
  }

  /**
   * Set specific microphone device ID
   */
  setDeviceId(deviceId: string): void {
    this.selectedDeviceId = deviceId || null;
  }

  /**
   * Start Web Audio API Volume Monitoring with AudioContext.resume() and RMS calculation.
   * Resilient to mobile hardware limitations and non-blocking for speech recognition.
   */
  async startAudioMeter(onVolume: (vol: number) => void): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return false;
      }

      this.stopAudioMeter();

      // Build non-conflicting constraints
      const audioConstraint: boolean | MediaTrackConstraints =
        this.selectedDeviceId && this.selectedDeviceId !== 'default' && this.selectedDeviceId !== ''
          ? {
              deviceId: { ideal: this.selectedDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            };

      const constraints: MediaStreamConstraints = {
        audio: audioConstraint,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.micStream = stream;

      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return true;

      this.audioContext = new AudioCtx();

      // Resume AudioContext for browser autoplay policy
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch {}
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
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
      }, 70);

      return true;
    } catch (err) {
      console.warn('[VoiceService] Audio meter notice (speech recognition will still work):', err);
      return false;
    }
  }

  stopAudioMeter(): void {
    if (this.volumeInterval) {
      globalThis.clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
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
      this.consecutiveErrors = 0;
      let cumulativeTranscript = '';
      let currentChunk = '';
      let isFinal = false;
      const allAlternatives: string[] = [];

      // 1. Cumulative transcript across all speech events
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res) continue;
        const piece = res[0]?.transcript || '';
        cumulativeTranscript += ' ' + piece;
        if (i === event.results.length - 1) {
          isFinal = res.isFinal;
        }
        for (let a = 0; a < res.length; a++) {
          const altText = res[a]?.transcript?.trim();
          if (altText) allAlternatives.push(altText);
        }
      }

      // 2. Current interim chunk (use best alternative)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res) continue;
        const piece = res[0]?.transcript || '';
        if (piece) {
          currentChunk += ' ' + piece;
        }
      }

      const cleanChunk = currentChunk.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
      const cleanFull = cumulativeTranscript.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

      if (cleanChunk || cleanFull || allAlternatives.length > 0) {
        config.onResult(cleanChunk || cleanFull, isFinal, cleanFull, allAlternatives);
      }
    };

    this.recognition.onaudiostart = () => {
      console.log('[VoiceService] 🎙️ Speech recognition audio started');
      if (config.onAudioStart) config.onAudioStart();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      const err = event.error || 'unknown';
      console.warn('[VoiceService] Speech Recognition Event:', err);

      if (err === 'no-speech' || err === 'aborted') {
        // Normal silence event on mobile devices; auto-reconnect handled via onend
        return;
      }

      if (err === 'not-allowed' || err === 'service-not-allowed') {
        this.shouldRestart = false;
        this.isListening = false;
        this.isStarting = false;
        config.onError('Microphone access denied. Please click the lock or camera/mic icon in your browser address bar to allow microphone permission.');
        return;
      }

      if (err === 'audio-capture') {
        config.onError('Microphone audio capture busy. Re-initializing microphone...');
        this.consecutiveErrors++;
        return;
      }

      if (err === 'network') {
        config.onError('Speech service network issue. Reconnecting...');
        this.consecutiveErrors++;
        return;
      }

      config.onError(`Voice status: ${err}`);
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.isStarting = false;
      this.consecutiveErrors = 0;
      console.log('[VoiceService] 🔊 Speech recognition listening active');
      if (config.onStart) config.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.isStarting = false;
      console.log('[VoiceService] 🛑 Session cycle finished. ShouldRestart:', this.shouldRestart);

      if (config.onEnd) config.onEnd();

      if (this.shouldRestart) {
        this.scheduleRestart();
      }
    };
  }

  /**
   * Update configuration callbacks dynamically without destroying recognition
   */
  updateConfig(config: Partial<VoiceServiceConfig>): void {
    if (this.currentConfig) {
      this.currentConfig = { ...this.currentConfig, ...config };
      if (config.lang && this.recognition) {
        this.recognition.lang = config.lang;
      }
    }
  }

  private scheduleRestart(delayMs: number = 300): void {
    if (this.restartTimeout) {
      globalThis.clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    // Exponential backoff if consecutive errors occur
    const backoff = Math.min(3000, delayMs + this.consecutiveErrors * 400);

    this.restartTimeout = globalThis.setTimeout(() => {
      if (this.shouldRestart && !this.isListening && !this.isStarting) {
        try {
          this.isStarting = true;
          this.recognition.start();
          console.log('[VoiceService] 🔄 Auto-reconnected speech recognition');
        } catch (e) {
          this.isStarting = false;
          console.warn('[VoiceService] Reconnection notice:', e);
          if (this.shouldRestart) {
            this.scheduleRestart(800);
          }
        }
      }
    }, backoff);
  }

  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
      if (this.currentConfig) {
        this.currentConfig.lang = lang;
      }
      if (this.isListening) {
        // Soft restart to apply new language
        try {
          this.recognition.stop();
        } catch {}
      }
    }
  }

  start(): void {
    if (!this.recognition) {
      throw new Error('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    }
    this.shouldRestart = true;
    this.consecutiveErrors = 0;

    if (this.isListening || this.isStarting) {
      return;
    }

    try {
      this.isStarting = true;
      this.recognition.start();
    } catch (e) {
      this.isStarting = false;
      console.warn('[VoiceService] Start notice:', e);
      // If already started or transitioning, retry safely
      this.scheduleRestart(400);
    }
  }

  stop(): void {
    this.shouldRestart = false;
    this.isListening = false;
    this.isStarting = false;
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
    this.isStarting = false;
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
    'help', 'help me', 'please help', 'help please', 'help emergency', 'help help', 'need help', 'i need help', 'helpp', 'save me', 'emergency', 'sos',
    'हेल्प', 'हेल्प मी', 'मदद', 'सहायता'
  ],
  bachao: [
    'bachao', 'bacho', 'bachoo', 'bachaao', 'bachav', 'bachao bachao', 'bacho bacho', 'mujhe bachao', 'bachao mujhe', 'bchao', 'bachaho', 'bachaoji',
    'बचाओ', 'बचो', 'बचाव', 'बचाओ बचाओ', 'मुझे बचाओ', 'बचाओ मुझे'
  ],
  suraksha: [
    'suraksha', 'suraksh', 'suraksha karo', 'meri suraksha', 'surakshaa', 'surksha', 'surakhsha', 'suraksha app', 'surakhsa',
    'सुरक्षा', 'सुरक्ष', 'सुरक्षा करो'
  ],
  'madad karo': [
    'madad karo', 'madad', 'madat', 'madat karo', 'meri madad karo', 'madad kijiye', 'madad chahiye', 'madadh', 'maddat', 'sahayata', 'sahayata karo',
    'मदद करो', 'मदद', 'मदद कीजिये', 'मेरी मदद करो', 'मदद चाहिए', 'सहायता करो'
  ],
  four: [
    'four', '4', 'for', 'four four', '4 4', 'char', 'chaar', 'number 4', 'number four', 'trigger 4', 'trigger four', '४', 'चार'
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
 * Strictly matches the 4 emergency triggers + synonyms + custom secret word.
 */
export const triggerWordMatcher = {
  isValidLength: (transcript: string, minLength: number = 1): boolean => {
    return transcript.trim().length >= minLength;
  },

  findMatch: (
    transcript: string | string[],
    customSecretTriggers: string[] = []
  ): string | null => {
    const rawList = Array.isArray(transcript) ? transcript : [transcript];
    const inputs: string[] = [];

    for (const item of rawList) {
      if (!item || typeof item !== 'string') continue;
      const normalized = item
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (normalized) inputs.push(normalized);
    }

    if (inputs.length === 0) return null;

    for (const text of inputs) {
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      // Filter out pure casual greetings if no emergency word is present
      const isPureGreeting = words.every((w) => ['hello', 'hey', 'hi', 'hola'].includes(w));
      if (isPureGreeting) continue;

      // 1. Check all standard triggers (phrase matching & word boundaries)
      for (const [category, aliases] of Object.entries(ALLOWED_4_TRIGGERS)) {
        for (const alias of aliases) {
          if (matchesExactWordOrPhrase(text, alias)) {
            return category === 'four' ? 'madad karo' : category;
          }
        }
      }

      // 2. Token-level matching (individual word match)
      for (const w of words) {
        for (const [category, aliases] of Object.entries(ALLOWED_4_TRIGGERS)) {
          if (aliases.includes(w)) {
            return category === 'four' ? 'madad karo' : category;
          }
        }
      }

      // 3. Substring matching for keywords with length >= 3
      for (const [category, aliases] of Object.entries(ALLOWED_4_TRIGGERS)) {
        for (const alias of aliases) {
          if (alias.length >= 3 && text.includes(alias)) {
            if (alias === 'help' && text.includes('hello')) {
              const nonHello = text.replace(/hello/g, '').trim();
              if (nonHello.includes('help')) {
                return 'help';
              }
            } else {
              return category === 'four' ? 'madad karo' : category;
            }
          }
        }
      }

      // 4. Custom Secret Word
      for (const custom of customSecretTriggers) {
        const c = custom?.toLowerCase().trim();
        if (!c || c.length < 2) continue;
        if (text.includes(c) || words.includes(c) || matchesExactWordOrPhrase(text, c)) {
          return custom;
        }
      }
    }

    return null;
  },
};

