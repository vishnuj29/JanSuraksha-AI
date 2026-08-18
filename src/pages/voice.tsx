/// <reference lib="dom" />
/// <reference lib="es2022" />

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Shield, AlertTriangle, CheckCircle, Settings, Eye, EyeOff, Save, Zap, Volume2, Globe, Activity, Sliders } from 'lucide-react';
import { VoiceService, triggerWordMatcher } from '../lib/voiceService';
import { sendSOSEmergency } from '../lib/sosService';
import { api } from '../lib/api-client';
import { toast } from 'sonner';

type VoiceState = 'idle' | 'listening' | 'detected' | 'triggered' | 'error';
type SpeechLang = 'en-IN' | 'hi-IN' | 'en-US';

export default function VoicePage() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [selectedLang, setSelectedLang] = useState<SpeechLang>('en-IN');
  const [secretWord, setSecretWord] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [savedWord, setSavedWord] = useState('SURAKSHA');
  const [saved, setSaved] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [waveAmplitudes, setWaveAmplitudes] = useState([0.3, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.4]);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
  const [matchedTrigger, setMatchedTrigger] = useState<string | null>(null);

  const voiceServiceRef = useRef<VoiceService | null>(null);
  const detectionTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const triggeringRef = useRef(false);
  const listeningRef = useRef(false);

  // Initialize Voice Service
  useEffect(() => {
    const voiceService = new VoiceService();

    if (!voiceService.isVoiceAPISupported()) {
      setErrorMessage('Web Speech Recognition is not supported by your current browser. Please use Google Chrome or Microsoft Edge.');
      setVoiceState('error');
      return;
    }

    voiceServiceRef.current = voiceService;

    // Discover audio input devices
    voiceService.getAudioInputDevices().then((devs) => {
      setDevices(devs);
      if (devs.length > 0 && !selectedDevice) {
        setSelectedDevice(devs[0].deviceId);
      }
    });

    voiceService.initialize({
      lang: selectedLang,
      continuous: true,
      interimResults: true,
      onStart: () => {
        console.log('[VoicePage] 🎙️ Speech recognition engine started');
      },
      onResult: (transcript: string, isFinal: boolean, fullSessionTranscript: string) => {
        const displayText = transcript || fullSessionTranscript;
        setLastTranscript(displayText);

        if (isFinal && displayText) {
          setTranscriptLog((prev) => [displayText, ...prev.slice(0, 4)]);
        }

        console.log('[VoicePage] 🎤 Heard:', displayText, isFinal ? '(FINAL)' : '(INTERIM)');

        // Active triggers list
        const activeTriggers = Array.from(
          new Set(['help', 'bachao', 'suraksha', 'madad karo', savedWord?.toLowerCase()].filter(Boolean))
        );

        // Check both chunk and full utterance
        const matchedWord =
          triggerWordMatcher.findMatch(transcript, activeTriggers) ||
          triggerWordMatcher.findMatch(fullSessionTranscript, activeTriggers);

        if (matchedWord && !triggeringRef.current) {
          console.log('[VoicePage] 🚨 Emergency Trigger Detected:', matchedWord);
          triggeringRef.current = true;
          setMatchedTrigger(matchedWord);
          setVoiceState('detected');

          // Audio speech feedback
          try {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance('Emergency Alert Activated');
              utterance.rate = 1.1;
              window.speechSynthesis.speak(utterance);
            }
          } catch {}

          detectionTimeoutRef.current = globalThis.setTimeout(async () => {
            setVoiceState('triggered');

            try {
              const userPhone = localStorage.getItem('emergencyPhone') || '+918874047462';
              await sendSOSEmergency(userPhone, matchedWord);
              toast.error(`🚨 Emergency SOS Alert Dispatched via "${matchedWord}"!`);

              globalThis.setTimeout(() => {
                setVoiceState('idle');
                setMatchedTrigger(null);
                triggeringRef.current = false;
                if (listeningRef.current && voiceServiceRef.current) {
                  setVoiceState('listening');
                  voiceServiceRef.current.start();
                }
              }, 6000);
            } catch (err) {
              setErrorMessage(err instanceof Error ? err.message : 'Failed to dispatch SOS alert');
              setVoiceState('error');
              triggeringRef.current = false;
            }
          }, isFinal ? 120 : 300);
        }
      },
      onError: (error: string) => {
        console.error('[VoicePage] Voice Error:', error);
        if (error.includes('denied') || error.includes('permission')) {
          listeningRef.current = false;
          setErrorMessage('Microphone access was denied. Please click the padlock/microphone icon in your browser URL bar to allow access.');
          setVoiceState('error');
        }
      },
      onEnd: () => {
        console.log('[VoicePage] Speech recognition session cycle completed');
      },
    });

    return () => {
      listeningRef.current = false;
      voiceService.abort();
      if (detectionTimeoutRef.current) {
        globalThis.clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [savedWord, selectedLang, selectedDevice]);

  // Audio wave animation dynamically driven by live mic volume
  useEffect(() => {
    let interval: ReturnType<typeof globalThis.setInterval> | undefined;
    if (voiceState === 'listening') {
      interval = globalThis.setInterval(() => {
        const factor = micVolume > 3 ? micVolume / 65 : 0.2;
        setWaveAmplitudes((prev) => prev.map(() => Math.min(1, factor * (0.35 + Math.random() * 0.8))));
      }, 80);
    }
    return () => {
      if (interval !== undefined) globalThis.clearInterval(interval);
    };
  }, [voiceState, micVolume]);

  const handleLangChange = (lang: SpeechLang) => {
    setSelectedLang(lang);
    if (voiceServiceRef.current) {
      voiceServiceRef.current.setLanguage(lang);
      toast.success(
        `Language switched to: ${
          lang === 'hi-IN' ? 'Hindi (हिन्दी)' : lang === 'en-IN' ? 'Indian English (Hinglish)' : 'English (US)'
        }`
      );
    }
  };

  const handleDeviceChange = async (devId: string) => {
    setSelectedDevice(devId);
    if (voiceServiceRef.current) {
      voiceServiceRef.current.setDeviceId(devId);
      if (voiceState === 'listening') {
        await voiceServiceRef.current.startAudioMeter(setMicVolume);
      }
    }
  };

  /**
   * Start / Stop Microphone Listening & Web Audio Meter
   */
  const toggleListening = async () => {
    if (!voiceServiceRef.current) {
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (voiceState === 'idle' || voiceState === 'error') {
        setErrorMessage('');
        setLastTranscript('');

        // 1. Start live audio volume meter with AudioContext.resume()
        const meterStarted = await voiceServiceRef.current.startAudioMeter((vol) => {
          setMicVolume(vol);
        });

        if (!meterStarted) {
          toast.warning('Microphone permission needed. Please click Allow.');
        }

        // 2. Start speech recognition engine
        listeningRef.current = true;
        setVoiceState('listening');
        voiceServiceRef.current.start();
        toast.success('Microphone Live! Speak "Help", "Madad Karo", or "Bachao".');
      } else if (voiceState === 'listening') {
        listeningRef.current = false;
        voiceServiceRef.current.stop();
        setMicVolume(0);
        setVoiceState('idle');
        toast.info('Voice shield paused.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown microphone error';
      setErrorMessage(msg);
      setVoiceState('error');
    }
  };

  // Fetch saved trigger word from backend
  useEffect(() => {
    api.voice
      .getConfig()
      .then((res) => {
        if (res.success && res.config?.triggerWord) {
          setSavedWord(res.config.triggerWord);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSecretWord = async () => {
    if (secretWord.trim()) {
      const newWord = secretWord.trim().toUpperCase();
      setSavedWord(newWord);
      setSecretWord('');
      setSaved(true);

      try {
        await api.voice.updateConfig({ triggerWord: newWord });
        toast.success(`Secret voice trigger updated to "${newWord}"`);
      } catch {
        toast.error('Failed to sync trigger word with server');
      }

      globalThis.setTimeout(() => setSaved(false), 2000);
    }
  };

  /**
   * Manual Trigger Simulation
   */
  const triggerKeywordSimulation = useCallback(async (keyword: string) => {
    if (triggeringRef.current) return;
    setLastTranscript(keyword);
    setMatchedTrigger(keyword);
    triggeringRef.current = true;
    setVoiceState('detected');
    toast.info(`Trigger word registered: "${keyword}"`);

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Emergency Alert Activated');
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }
    } catch {}

    detectionTimeoutRef.current = globalThis.setTimeout(async () => {
      setVoiceState('triggered');
      try {
        const userPhone = localStorage.getItem('emergencyPhone') || '+918874047462';
        await sendSOSEmergency(userPhone, keyword);
        toast.error(`🚨 Emergency SOS Alert Dispatched via "${keyword}"!`);
        globalThis.setTimeout(() => {
          setVoiceState('idle');
          setMatchedTrigger(null);
          triggeringRef.current = false;
        }, 6000);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to dispatch SOS');
        setVoiceState('error');
        triggeringRef.current = false;
      }
    }, 350);
  }, []);

  const stateConfig = {
    idle: {
      color: 'bg-slate-700 hover:bg-slate-600',
      border: 'border-slate-500',
      text: 'text-slate-400',
      label: 'Tap to Activate Microphone',
    },
    listening: {
      color: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/50',
      border: 'border-blue-400',
      text: 'text-blue-300',
      label: 'Microphone Active — Listening...',
    },
    detected: {
      color: 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/50',
      border: 'border-yellow-400',
      text: 'text-yellow-300',
      label: 'Trigger Word Recognized!',
    },
    triggered: {
      color: 'bg-red-600 hover:bg-red-500 shadow-red-500/50',
      border: 'border-red-400',
      text: 'text-red-300',
      label: 'Emergency SOS Broadcast Dispatched!',
    },
    error: {
      color: 'bg-red-700 hover:bg-red-600',
      border: 'border-red-500',
      text: 'text-red-300',
      label: 'Microphone Error — Tap to Retry',
    },
  };
  const cfg = stateConfig[voiceState];

  return (
    <>
      <title>Voice Emergency Trigger — JanSuraksha AI</title>
      <meta name="description" content="AI Multi-Lingual voice-triggered emergency alerts for Help, Bachao, Suraksha, and Madad." />

      <div className="pt-20 pb-24 px-4 min-h-screen">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' as const }}
            className="text-center mb-8 pt-4"
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
              <Mic size={12} className="text-blue-400" />
              <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">Voice Activation Shield</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Voice Emergency Trigger
            </h1>
            <p className="text-slate-400 text-base">
              Speak <strong className="text-white">&quot;Help&quot;</strong>, <strong className="text-white">&quot;Madad Karo&quot;</strong>, <strong className="text-white">&quot;Bachao&quot;</strong>, or <strong className="text-white">&quot;Suraksha&quot;</strong> into your microphone to trigger instant SOS.
            </p>
          </motion.div>

          {/* Controls Bar: Language + Device Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            {/* Language Selector */}
            <div className="flex items-center gap-1">
              <Globe size={14} className="text-slate-400 ml-1 mr-1" />
              <button
                type="button"
                onClick={() => handleLangChange('en-IN')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLang === 'en-IN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇳 Hinglish
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('hi-IN')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLang === 'hi-IN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇳 हिन्दी
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('en-US')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLang === 'en-US' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🌐 English (US)
              </button>
            </div>

            {/* Input Device Picker */}
            {devices.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 w-full sm:w-auto">
                <Sliders size={13} className="text-slate-500" />
                <select
                  value={selectedDevice}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="bg-black/50 text-white text-xs border border-white/10 rounded-lg px-2 py-1 outline-none max-w-[180px] truncate"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Voice Activation Center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' as const }}
            className="flex flex-col items-center mb-8"
          >
            {/* Live Audio dB & Sound Wave Visualizer */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <div className="flex items-center gap-1.5 h-16">
                {waveAmplitudes.map((amp, i) => (
                  <motion.div
                    key={i}
                    className={`w-1.5 rounded-full ${
                      voiceState === 'listening'
                        ? micVolume > 10
                          ? 'bg-green-400'
                          : 'bg-blue-400'
                        : voiceState === 'detected'
                        ? 'bg-yellow-400'
                        : voiceState === 'triggered'
                        ? 'bg-red-400'
                        : 'bg-slate-700'
                    }`}
                    animate={{ height: voiceState === 'listening' ? `${amp * 50 + 10}px` : '8px' }}
                    transition={{ duration: 0.08, ease: 'easeOut' as const }}
                  />
                ))}
              </div>

              {voiceState === 'listening' && (
                <div className="flex items-center gap-2 bg-black/60 border border-white/15 px-3.5 py-1.5 rounded-full text-xs text-slate-300 shadow-md">
                  <Activity size={13} className={micVolume > 5 ? 'text-green-400 animate-pulse' : 'text-slate-500'} />
                  <span>
                    Microphone Input Level:{' '}
                    <strong className={micVolume > 10 ? 'text-green-400 font-mono font-bold' : 'text-slate-300 font-mono'}>
                      {micVolume}%
                    </strong>
                  </span>
                  <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden ml-1 border border-white/10">
                    <div
                      className={`h-full transition-all duration-75 ${
                        micVolume > 35 ? 'bg-red-500' : micVolume > 15 ? 'bg-green-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Main Mic Button */}
            <div className="relative">
              {voiceState === 'listening' && (
                <>
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border-2 border-blue-400/50"
                      style={{
                        width: `${120 + i * 40}px`,
                        height: `${120 + i * 40}px`,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%,-50%)',
                        animation: `voice-pulse ${1 + i * 0.4}s ease-out infinite`,
                        animationDelay: `${i * 0.25}s`,
                      }}
                    />
                  ))}
                </>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative z-10 w-28 h-28 rounded-full ${cfg.color} border-4 ${cfg.border} flex flex-col items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer active:scale-95`}
              >
                {voiceState === 'idle' ? (
                  <Mic size={36} className="text-white" />
                ) : voiceState === 'listening' ? (
                  <Mic size={36} className="text-white animate-pulse" />
                ) : (
                  <AlertTriangle size={36} className="text-white" />
                )}
              </button>
            </div>

            {/* Status Label */}
            <AnimatePresence mode="wait">
              <motion.div
                key={voiceState}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-5 text-center"
              >
                <div className={`text-base font-bold ${cfg.text}`}>{cfg.label}</div>
                <div className="text-slate-400 text-xs mt-1">
                  {voiceState === 'idle'
                    ? 'Click the microphone button to activate speech detection'
                    : voiceState === 'listening'
                    ? 'Speak clearly into your microphone now'
                    : voiceState === 'detected'
                    ? `Dispatching emergency alert for: "${matchedTrigger}"`
                    : 'Alert transmitted to emergency services & contacts'}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Error Banner */}
            {voiceState === 'error' && errorMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-center gap-2 bg-red-600/20 border border-red-500/50 rounded-xl px-4 py-2.5 text-center max-w-md"
              >
                <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-xs font-semibold leading-relaxed">{errorMessage}</span>
              </motion.div>
            )}

            {/* Real-Time Live Microphone Transcript Stream */}
            {voiceState === 'listening' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex flex-col items-center gap-2 max-w-md w-full bg-[#0a0f1e]/90 border border-blue-500/30 rounded-xl p-3.5 shadow-xl"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                    <Volume2 size={14} className="animate-pulse text-blue-400" />
                    <span>Live Speech Recognition Feed</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono font-bold">
                    ACTIVE
                  </span>
                </div>
                <div className="text-white text-xs font-mono font-bold bg-white/5 px-3 py-2 rounded-lg border border-white/10 w-full text-center min-h-[36px] flex items-center justify-center break-words">
                  {lastTranscript ? (
                    <span className="text-yellow-300">&quot;{lastTranscript}&quot;</span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">
                      Listening... Say &quot;Help&quot;, &quot;Madad Karo&quot;, or &quot;Bachao&quot;
                    </span>
                  )}
                </div>

                {transcriptLog.length > 0 && (
                  <div className="w-full flex flex-col gap-1 mt-1 border-t border-white/10 pt-2">
                    <span className="text-[10px] text-slate-500 font-semibold">Recent utterances:</span>
                    {transcriptLog.map((log, idx) => (
                      <div key={idx} className="text-[11px] text-slate-400 font-mono truncate">
                        • &quot;{log}&quot;
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Trigger Words & Interactive Instant Test Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' as const }}
            className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-green-400" />
                <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                  Active Emergency Triggers
                </h3>
              </div>
              <span className="text-slate-400 text-[10px]">Click any card to test trigger</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
              {[
                { label: 'Help / हेल्प', keyword: 'help', subtitle: 'English & Hindi' },
                { label: 'Madad / मदद करो', keyword: 'madad karo', subtitle: 'Madad Karo / Madad' },
                { label: 'Bachao / बचाओ', keyword: 'bachao', subtitle: 'Bacho / Bachao' },
                { label: 'Suraksha / सुरक्षा', keyword: 'suraksha', subtitle: 'Safety Shield' },
              ].map((item) => (
                <button
                  key={item.keyword}
                  type="button"
                  onClick={() => triggerKeywordSimulation(item.keyword)}
                  className="flex flex-col items-start p-3 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 border border-blue-500/25 rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-blue-300 font-bold text-xs group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                    <Zap size={13} className="text-blue-400 group-hover:text-yellow-400 transition-colors" />
                  </div>
                  <span className="text-[10px] text-slate-400">{item.subtitle}</span>
                </button>
              ))}
            </div>

            {savedWord && (
              <div className="flex items-center justify-between p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-orange-400 font-bold">Custom Secret Phrase:</span>
                  <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{savedWord}</span>
                </div>
                <button
                  type="button"
                  onClick={() => triggerKeywordSimulation(savedWord)}
                  className="text-[11px] bg-orange-600 hover:bg-orange-500 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Test Secret Trigger
                </button>
              </div>
            )}

            <p className="text-slate-400 text-xs leading-relaxed">
              These trigger words are monitored continuously with multi-lingual audio recognition. Say <strong className="text-white">&quot;Help&quot;</strong>, <strong className="text-white">&quot;Madad Karo&quot;</strong>, <strong className="text-white">&quot;Bacho&quot;</strong>, <strong className="text-white">&quot;Bachao&quot;</strong>, or <strong className="text-white">&quot;Suraksha&quot;</strong> to instantly activate emergency broadcast mode.
            </p>
          </motion.div>

          {/* Secret Word Config */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: 'easeOut' as const }}
            className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 mb-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} className="text-orange-400" />
              <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                Configure Custom Secret Trigger Word
              </h3>
            </div>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Set a custom secret word that only you know. This phrase will not be obvious to others but will instantly trigger emergency mode when spoken into the microphone.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secretWord}
                  onChange={(e) => setSecretWord(e.target.value)}
                  placeholder="Enter your secret word..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveSecretWord}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-4 py-3 rounded-xl transition-all text-sm cursor-pointer"
              >
                {saved ? <CheckCircle size={15} /> : <Save size={15} />}
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-slate-500 text-xs">
              <Shield size={11} />
              Current secret word: <span className="text-orange-400 font-semibold">{savedWord}</span>
            </div>
          </motion.div>

          {/* Quick Action Links */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/emergency"
              className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-semibold py-3 rounded-xl transition-all text-sm"
            >
              <AlertTriangle size={15} />
              Instant SOS Screen
            </Link>
            <Link
              to="/contacts"
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/8 border border-white/10 text-slate-300 font-semibold py-3 rounded-xl transition-all text-sm"
            >
              <Shield size={15} />
              Manage Emergency Contacts
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
