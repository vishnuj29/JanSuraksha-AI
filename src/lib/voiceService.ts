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
  private currentLang = 'en-IN';
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

    this.isSupported = !!SpeechRecognitionConstructor;
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
      const unique = audioInputs.filter((d, idx, arr) => arr.findIndex((x) => x.deviceId === d.deviceId) === idx);
      return unique;
    } catch {
      return [];
    }
  }

  setDeviceId(deviceId: string): void {
    this.selectedDeviceId = deviceId || null;
  }

  /**
   * Start Web Audio API Volume Monitoring with AudioContext.resume() and RMS calculation.
   */
  async startAudioMeter(onVolume: (vol: number) => void): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return false;
      }

      this.stopAudioMeter();

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
   * Create fresh SpeechRecognition instance with clean listeners to prevent browser zombie sessions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getOrCreateRecognition(): any {
    const SpeechRecognitionConstructor =
      typeof window !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionConstructor) return null;

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.onaudiostart = null;
        this.recognition.abort();
      } catch {}
    }

    try {
      const rec = new SpeechRecognitionConstructor();
      rec.continuous = this.currentConfig?.continuous ?? true;
      rec.interimResults = this.currentConfig?.interimResults ?? true;
      rec.lang = this.currentLang || this.currentConfig?.lang || 'en-IN';
      rec.maxAlternatives = 5;

      this.attachRecognitionHandlers(rec);
      this.recognition = rec;
      return rec;
    } catch (err) {
      console.warn('[VoiceService] Failed creating SpeechRecognition instance:', err);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private attachRecognitionHandlers(rec: any): void {
    if (!rec) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      this.consecutiveErrors = 0;
      let interimChunk = '';
      let finalTranscript = '';
      const allAlternatives: string[] = [];

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res) continue;

        if (res.isFinal) {
          finalTranscript += ' ' + (res[0]?.transcript || '');
        } else {
          interimChunk += ' ' + (res[0]?.transcript || '');
        }

        for (let a = 0; a < res.length; a++) {
          const piece = res[a]?.transcript?.trim();
          if (piece) allAlternatives.push(piece);
        }
      }

      // Current utterance chunk
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res) continue;
        const topPiece = res[0]?.transcript || '';
        if (topPiece && !interimChunk.includes(topPiece)) {
          interimChunk += ' ' + topPiece;
        }
      }

      const cleanInterim = interimChunk.trim();
      const cleanFinal = finalTranscript.trim();
      const cleanFull = `${cleanFinal} ${cleanInterim}`.trim();

      if (cleanInterim || cleanFinal || allAlternatives.length > 0) {
        if (this.currentConfig?.onResult) {
          this.currentConfig.onResult(cleanInterim || cleanFinal || cleanFull, !!cleanFinal, cleanFull, allAlternatives);
        }
      }
    };

    rec.onaudiostart = () => {
      console.log('[VoiceService] 🎙️ Speech recognition audio started');
      if (this.currentConfig?.onAudioStart) this.currentConfig.onAudioStart();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      const err = event.error || 'unknown';
      console.warn('[VoiceService] Speech Recognition Event:', err);

      if (err === 'no-speech' || err === 'aborted') {
        return;
      }

      if (err === 'not-allowed' || err === 'service-not-allowed') {
        this.shouldRestart = false;
        this.isListening = false;
        this.isStarting = false;
        if (this.currentConfig?.onError) {
          this.currentConfig.onError('Microphone access denied. Please allow microphone permissions in your browser URL bar.');
        }
        return;
      }

      if (err === 'audio-capture') {
        if (this.currentConfig?.onError) {
          this.currentConfig.onError('Microphone audio capture busy. Re-initializing microphone...');
        }
        this.consecutiveErrors++;
        return;
      }

      if (err === 'network') {
        this.consecutiveErrors++;
        return;
      }

      if (this.currentConfig?.onError) {
        this.currentConfig.onError(`Voice status: ${err}`);
      }
    };

    rec.onstart = () => {
      this.isListening = true;
      this.isStarting = false;
      this.consecutiveErrors = 0;
      console.log('[VoiceService] 🔊 Speech recognition listening active');
      if (this.currentConfig?.onStart) this.currentConfig.onStart();
    };

    rec.onend = () => {
      this.isListening = false;
      this.isStarting = false;
      console.log('[VoiceService] 🛑 Speech session cycle ended. ShouldRestart:', this.shouldRestart);

      if (this.currentConfig?.onEnd) this.currentConfig.onEnd();

      if (this.shouldRestart) {
        this.scheduleRestart(150);
      }
    };
  }

  initialize(config: VoiceServiceConfig): void {
    this.currentConfig = config;
    if (config.lang) {
      this.currentLang = config.lang;
    }
  }

  updateConfig(config: Partial<VoiceServiceConfig>): void {
    if (this.currentConfig) {
      this.currentConfig = { ...this.currentConfig, ...config };
      if (config.lang) {
        this.currentLang = config.lang;
      }
    }
  }

  private scheduleRestart(delayMs: number = 200): void {
    if (this.restartTimeout) {
      globalThis.clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (!this.shouldRestart) return;

    const backoff = Math.min(2500, delayMs + this.consecutiveErrors * 300);

    this.restartTimeout = globalThis.setTimeout(() => {
      if (this.shouldRestart && !this.isListening && !this.isStarting) {
        try {
          const rec = this.getOrCreateRecognition();
          if (rec) {
            this.isStarting = true;
            rec.start();
            console.log('[VoiceService] 🔄 Auto-reconnected speech recognition');
          }
        } catch (e) {
          this.isStarting = false;
          console.warn('[VoiceService] Reconnection notice:', e);
          if (this.shouldRestart) {
            this.scheduleRestart(600);
          }
        }
      }
    }, backoff);
  }

  setLanguage(lang: string): void {
    this.currentLang = lang;
    if (this.currentConfig) {
      this.currentConfig.lang = lang;
    }
    if (this.isListening) {
      // Soft restart to apply language
      try {
        this.recognition?.stop();
      } catch {}
    }
  }

  start(): void {
    if (!this.isSupported) {
      throw new Error('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
    }
    this.shouldRestart = true;
    this.consecutiveErrors = 0;

    if (this.isListening || this.isStarting) {
      return;
    }

    try {
      const rec = this.getOrCreateRecognition();
      if (!rec) {
        throw new Error('Failed to initialize speech engine');
      }
      this.isStarting = true;
      rec.start();
    } catch (e) {
      this.isStarting = false;
      console.warn('[VoiceService] Start notice:', e);
      this.scheduleRestart(300);
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
    'help', 'help me', 'please help', 'help please', 'help emergency', 'help help',
    'need help', 'i need help', 'helpp', 'save me', 'emergency', 'sos', 'held', 'health',
    'helping', 'helped', 'khatra', 'danger', 'police', 'ambulance',
    'हेल्प', 'हेल्प मी', 'मदद', 'सहायता', 'खतरा', 'पुलिस', 'बचाओ'
  ],
  bachao: [
    'bachao', 'bacho', 'bachoo', 'bachaao', 'bachav', 'bachao bachao', 'bacho bacho',
    'mujhe bachao', 'bachao mujhe', 'bchao', 'bachaho', 'bachaoji', 'batch oh', 'but chow',
    'bacchao', 'bacaho', 'bachaoo', 'bachho',
    'बचाओ', 'बचो', 'बचाव', 'बचाओ बचाओ', 'मुझे बचाओ', 'बचाओ मुझे'
  ],
  suraksha: [
    'suraksha', 'suraksh', 'suraksha karo', 'meri suraksha', 'surakshaa', 'surksha',
    'surakhsha', 'suraksha app', 'surakhsa', 'siraksha', 'so raksha', 'surakshit',
    'सुरक्षा', 'सुरक्ष', 'सुरक्षा करो', 'मेरी सुरक्षा'
  ],
  'madad karo': [
    'madad karo', 'madad', 'madat', 'madat karo', 'meri madad karo', 'madad kijiye',
    'madad chahiye', 'madadh', 'maddat', 'sahayata', 'sahayata karo', 'mother car',
    'mad at', 'madath', 'madatji',
    'मदद करो', 'मदद', 'मदद कीजिये', 'मेरी मदद करो', 'मदद चाहिए', 'सहायता', 'सहायता करो'
  ],
  four: [
    'four', '4', 'for', 'fore', 'four four', '4 4', 'char', 'chaar', 'number 4',
    'number four', 'trigger 4', 'trigger four', '४', 'चार', 'फोर'
  ],
};

/**
 * Helper to test exact word/phrase boundary in normalized text
 */
function matchesExactWordOrPhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const t = text.trim();
  const p = phrase.trim().toLowerCase();

  if (t === p) return true;

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

      const isPureGreeting = words.every((w) => ['hello', 'hey', 'hi', 'hola', 'ok', 'okay'].includes(w));
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

