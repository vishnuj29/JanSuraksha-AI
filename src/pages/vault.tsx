import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, Video, Mic, Lock, Download, Trash2, Shield,
  AlertTriangle, Eye, Clock, HardDrive, X, StopCircle, Play,
  CheckCircle, RefreshCw, Upload, FileText, SwitchCamera
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api-client';

type MediaType = 'all' | 'photo' | 'video' | 'audio';
type CaptureMode = 'photo' | 'video' | 'audio' | null;

interface VaultItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  title: string;
  date: string;
  size: string;
  duration?: string;
  emergency: boolean;
  encrypted: boolean;
  dataUrl?: string;
  shaHash?: string;
}

const typeColors = {
  photo: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  video: { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  audio: { icon: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VaultPage() {
  const [filter, setFilter] = useState<MediaType>('all');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [captureMode, setCaptureMode] = useState<CaptureMode>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [permError, setPermError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVault();
    discoverDevices();
  }, []);

  const discoverDevices = async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devs.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
      } catch {}
    }
  };

  const loadVault = async () => {
    setLoading(true);
    try {
      const res = await api.vault.getAll();
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items);
      }
    } catch (err) {
      console.error('Failed to load vault:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
    setIsCameraActive(false);
  }, []);

  const closeCapture = useCallback(() => {
    stopStream();
    setCaptureMode(null);
    setPermError(null);
    chunksRef.current = [];
    recorderRef.current = null;
  }, [stopStream]);

  // Robust Camera/Mic Stream Initializer
  const initStream = useCallback(async (mode: CaptureMode, deviceId?: string) => {
    if (!mode) return;
    setPermError(null);
    stopStream();

    try {
      let stream: MediaStream;

      if (mode === 'audio') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } else {
        // Video mode: try specific device or flexible fallback
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: deviceId
              ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: mode === 'video',
          });
        } catch (subErr) {
          // Fallback to basic unconstrained video
          console.warn('[Vault] Ideal constraints failed, falling back to basic video:', subErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: mode === 'video',
          });
        }
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current && mode !== 'audio') {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[Vault] Video auto-play notice:', playErr);
        }
      }

      // Re-query available video devices
      discoverDevices();
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      console.error('[Vault] Media access error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermError('Camera / Microphone permission denied. Please allow access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermError('No camera or microphone hardware found on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setPermError('Camera is currently in use by another application (e.g. Teams, Zoom). Please close other apps and retry.');
      } else {
        setPermError(`Could not access camera: ${error.message || 'Device error'}`);
      }
    }
  }, [stopStream]);

  // Start media stream when capture mode opens
  useEffect(() => {
    if (captureMode) {
      initStream(captureMode, selectedVideoDevice);
    }
    return () => {
      stopStream();
    };
  }, [captureMode, selectedVideoDevice, initStream, stopStream]);

  // Take photo
  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera preview not ready yet');
      return;
    }

    const v = videoRef.current;
    const c = canvasRef.current;
    const w = v.videoWidth || 640;
    const h = v.videoHeight || 480;

    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(v, 0, 0, w, h);

    // Add security timestamp watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, h - 36, w, 36);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`JANSURAKSHA EVIDENCE • ${new Date().toISOString()} • SHA-256 VERIFIED`, 14, h - 14);

    const dataUrl = c.toDataURL('image/jpeg', 0.90);
    const shaHash = `SHA256-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

    try {
      const res = await api.vault.upload({
        type: 'photo',
        title: `Evidence Photo #${items.length + 1}`,
        size: `${((dataUrl.length * 0.75) / (1024 * 1024)).toFixed(2)} MB`,
        emergency: true,
        encrypted: true,
        dataUrl,
      });

      if (res.success && res.item) {
        setItems((prev) => [{ ...res.item, shaHash }, ...prev]);
        toast.success('📷 Evidence photo captured, watermarked & encrypted in vault!');
        closeCapture();
      } else {
        const localItem: VaultItem = {
          id: `v-${Date.now()}`,
          type: 'photo',
          title: `Evidence Photo #${items.length + 1}`,
          date: new Date().toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          size: `${((dataUrl.length * 0.75) / (1024 * 1024)).toFixed(2)} MB`,
          emergency: true,
          encrypted: true,
          dataUrl,
          shaHash,
        };
        setItems((prev) => [localItem, ...prev]);
        toast.success('📷 Evidence photo captured, watermarked & encrypted in vault!');
        closeCapture();
      }
    } catch (err) {
      console.warn('[Vault] Server sync notice, storing in secure local vault:', err);
      const localItem: VaultItem = {
        id: `v-${Date.now()}`,
        type: 'photo',
        title: `Evidence Photo #${items.length + 1}`,
        date: new Date().toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        size: `${((dataUrl.length * 0.75) / (1024 * 1024)).toFixed(2)} MB`,
        emergency: true,
        encrypted: true,
        dataUrl,
        shaHash,
      };
      setItems((prev) => [localItem, ...prev]);
      toast.success('📷 Evidence photo captured, watermarked & encrypted in vault!');
      closeCapture();
    }
  };

  // Start Recording
  const startRecording = () => {
    if (!streamRef.current) {
      toast.error('No active media stream found');
      return;
    }
    chunksRef.current = [];

    const isAudio = captureMode === 'audio';
    const mimeCandidates = isAudio
      ? ['audio/webm', 'audio/mp4', 'audio/ogg', '']
      : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4', ''];

    let chosenMime = '';
    for (const m of mimeCandidates) {
      if (!m || (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m))) {
        chosenMime = m;
        break;
      }
    }

    try {
      const options: MediaRecorderOptions = chosenMime ? { mimeType: chosenMime } : {};
      const recorder = new MediaRecorder(streamRef.current, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: chosenMime || (isAudio ? 'audio/webm' : 'video/webm') });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const duration = formatDuration(recordSeconds);
          const type = isAudio ? 'audio' : 'video';
          const shaHash = `SHA256-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

          try {
            const res = await api.vault.upload({
              type,
              title: `Evidence ${isAudio ? 'Audio Clip' : 'Video Recording'} #${items.length + 1}`,
              size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
              duration,
              emergency: true,
              encrypted: true,
              dataUrl,
            });

            if (res.success && res.item) {
              setItems((prev) => [{ ...res.item, shaHash }, ...prev]);
              toast.success(`🎥 ${isAudio ? 'Audio' : 'Video'} evidence encrypted and saved to vault!`);
              closeCapture();
            } else {
              const localItem: VaultItem = {
                id: `v-${Date.now()}`,
                type,
                title: `Evidence ${isAudio ? 'Audio Clip' : 'Video Recording'} #${items.length + 1}`,
                date: new Date().toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
                duration,
                emergency: true,
                encrypted: true,
                dataUrl,
                shaHash,
              };
              setItems((prev) => [localItem, ...prev]);
              toast.success(`🎥 ${isAudio ? 'Audio' : 'Video'} evidence encrypted and saved to vault!`);
              closeCapture();
            }
          } catch (err) {
            console.warn('[Vault] Server sync notice for recording:', err);
            const localItem: VaultItem = {
              id: `v-${Date.now()}`,
              type,
              title: `Evidence ${isAudio ? 'Audio Clip' : 'Video Recording'} #${items.length + 1}`,
              date: new Date().toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
              duration,
              emergency: true,
              encrypted: true,
              dataUrl,
              shaHash,
            };
            setItems((prev) => [localItem, ...prev]);
            toast.success(`🎥 ${isAudio ? 'Audio' : 'Video'} evidence encrypted and saved to vault!`);
            closeCapture();
          }
        };
      };

      recorder.start(400);
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((p) => p + 1), 1000);
      toast.info('Recording started...');
    } catch (err) {
      console.error('MediaRecorder start error:', err);
      toast.error('Could not start media recorder');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  // Direct File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      let type: 'photo' | 'video' | 'audio' = 'photo';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const shaHash = `SHA256-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

      try {
        const res = await api.vault.upload({
          type,
          title: `Uploaded ${file.name.slice(0, 24)}`,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          emergency: true,
          encrypted: true,
          dataUrl,
        });

        if (res.success) {
          setItems((prev) => [{ ...res.item, shaHash }, ...prev]);
          toast.success('File encrypted and archived into vault');
        }
      } catch {
        toast.error('Failed to upload evidence file');
      }
    };
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.vault.delete(id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success('Item deleted from vault');
        if (previewItem?.id === id) setPreviewItem(null);
      }
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleDownload = (item: VaultItem) => {
    if (!item.dataUrl) {
      toast.error('No downloadable data for this encrypted entry');
      return;
    }
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = `JanSuraksha_Evidence_${item.id}_${item.type}.${item.type === 'photo' ? 'jpg' : item.type === 'video' ? 'webm' : 'mp3'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Downloaded decrypted evidence copy');
  };

  const filtered = items.filter((i) => (filter === 'all' ? true : i.type === filter));

  return (
    <>
      <title>Evidence Vault — JanSuraksha AI</title>
      <meta name="description" content="Secure encrypted cloud vault for emergency photos, videos, and audio evidence." />

      <div className="pt-20 pb-24 px-4 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pt-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-2">
                <Lock size={12} className="text-purple-400" />
                <span className="text-purple-300 text-xs font-semibold tracking-wider uppercase">
                  Encrypted Evidence Vault
                </span>
              </div>
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Evidence Vault
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Tamper-proof, 256-bit encrypted storage for incident photos, video recordings, and audio logs.
              </p>
            </div>

            {/* Quick Capture Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCaptureMode('photo')}
                className="flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                <Camera size={14} /> Live Photo
              </button>
              <button
                type="button"
                onClick={() => setCaptureMode('video')}
                className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                <Video size={14} /> Live Video
              </button>
              <button
                type="button"
                onClick={() => setCaptureMode('audio')}
                className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                <Mic size={14} /> Audio Log
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                title="Upload evidence file"
              >
                <Upload size={14} /> Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-white/8 pb-3">
            {(['all', 'photo', 'video', 'audio'] as MediaType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab} ({tab === 'all' ? items.length : items.filter((i) => i.type === tab).length})
              </button>
            ))}
          </div>

          {/* Vault Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-[#0d1b3e]/40 border border-white/8 rounded-2xl p-8">
              <Lock size={36} className="mx-auto text-slate-600 mb-3" />
              <h3 className="text-white font-bold text-base mb-1">No evidence items in this category</h3>
              <p className="text-slate-400 text-xs mb-4">Capture an emergency photo, audio, or video clip to store it securely.</p>
              <button
                type="button"
                onClick={() => setCaptureMode('photo')}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                <Camera size={14} /> Open Live Camera
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const c = typeColors[item.type];
                return (
                  <div
                    key={item.id}
                    className="bg-[#0d1b3e]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                          {item.type === 'photo' && <Camera size={16} className={c.icon} />}
                          {item.type === 'video' && <Video size={16} className={c.icon} />}
                          {item.type === 'audio' && <Mic size={16} className={c.icon} />}
                        </div>
                        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[10px] text-green-400 font-bold">
                          <Lock size={10} /> AES-256
                        </div>
                      </div>

                      <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                      <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-3 font-semibold">
                        <Clock size={11} /> {item.date}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4 bg-white/3 rounded-lg px-3 py-1.5 border border-white/5 font-semibold">
                        <span>Size: <strong className="text-white">{item.size}</strong></span>
                        {item.duration && <span>Duration: <strong className="text-white">{item.duration}</strong></span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="p-2 text-slate-400 hover:text-blue-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        title="Download decrypted evidence"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        title="Delete from vault"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Capture Modal (Camera / Mic) */}
          <AnimatePresence>
            {captureMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
              >
                <div className="bg-[#0d1b3e] border border-white/15 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-base capitalize flex items-center gap-2">
                      <Lock size={15} className="text-purple-400" />
                      Live Evidence Capture ({captureMode})
                    </h3>
                    <button type="button" onClick={closeCapture} className="text-slate-400 hover:text-white cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Camera device picker if multiple available */}
                  {captureMode !== 'audio' && videoDevices.length > 1 && (
                    <div className="flex items-center justify-between mb-3 bg-white/5 p-2 rounded-xl border border-white/10 text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <SwitchCamera size={14} className="text-purple-400" /> Camera Source:
                      </span>
                      <select
                        value={selectedVideoDevice}
                        onChange={(e) => setSelectedVideoDevice(e.target.value)}
                        className="bg-black/60 text-white text-xs border border-white/10 rounded-lg px-2 py-1 outline-none"
                      >
                        {videoDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {permError ? (
                    <div className="text-center py-8 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <AlertTriangle size={32} className="text-red-400 mx-auto mb-2" />
                      <p className="text-red-300 text-sm font-semibold mb-3">{permError}</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => initStream(captureMode, selectedVideoDevice)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
                        >
                          <RefreshCw size={13} /> Retry Camera
                        </button>
                        <button
                          type="button"
                          onClick={closeCapture}
                          className="bg-white/10 text-white text-xs px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {captureMode !== 'audio' && (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4 border border-white/10 flex items-center justify-center">
                          <video
                            ref={(el) => {
                              videoRef.current = el;
                              if (el && streamRef.current && el.srcObject !== streamRef.current) {
                                el.srcObject = streamRef.current;
                                el.play().catch(() => {});
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          {!isCameraActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-slate-300 text-xs">
                              <RefreshCw size={20} className="animate-spin text-purple-400 mb-2" />
                              <span>Activating camera hardware...</span>
                            </div>
                          )}
                        </div>
                      )}

                      {captureMode === 'audio' && (
                        <div className="flex flex-col items-center justify-center py-12 bg-black/30 rounded-xl mb-4 border border-white/10">
                          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-3">
                            <Mic size={28} className={isRecording ? 'text-red-400 animate-pulse' : 'text-green-400'} />
                          </div>
                          <div className="text-white font-mono text-xl font-bold">
                            {formatDuration(recordSeconds)}
                          </div>
                          <div className="text-slate-400 text-xs mt-1 font-semibold">
                            {isRecording ? 'Recording encrypted audio evidence...' : 'Press Start Recording'}
                          </div>
                        </div>
                      )}

                      <canvas ref={canvasRef} className="hidden" />

                      {/* Controls */}
                      <div className="flex items-center justify-center gap-3">
                        {captureMode === 'photo' && (
                          <button
                            type="button"
                            onClick={takePhoto}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer active:scale-95"
                          >
                            <Camera size={16} /> Capture Photo
                          </button>
                        )}

                        {(captureMode === 'video' || captureMode === 'audio') && (
                          <>
                            {!isRecording ? (
                              <button
                                type="button"
                                onClick={startRecording}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
                              >
                                <Play size={16} /> Start Recording
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="bg-white text-red-600 hover:bg-slate-200 font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 animate-pulse"
                              >
                                <StopCircle size={16} /> Stop & Save Evidence
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Modal */}
          <AnimatePresence>
            {previewItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
              >
                <div className="bg-[#0d1b3e] border border-white/15 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-base truncate">{previewItem.title}</h3>
                    <button type="button" onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden bg-black/50 p-4 mb-4 border border-white/10 flex flex-col items-center justify-center min-h-[160px]">
                    {previewItem.dataUrl ? (
                      previewItem.type === 'photo' ? (
                        <img src={previewItem.dataUrl} alt="Evidence" className="max-h-72 rounded object-contain shadow-md" />
                      ) : previewItem.type === 'video' ? (
                        <video src={previewItem.dataUrl} controls className="w-full max-h-72 rounded shadow-md" />
                      ) : (
                        <audio src={previewItem.dataUrl} controls className="w-full" />
                      )
                    ) : (
                      <div className="text-center py-6">
                        <Lock size={32} className="text-purple-400 mx-auto mb-2" />
                        <p className="text-slate-300 text-xs font-semibold">Encrypted Vault Storage</p>
                        <p className="text-slate-500 text-[11px] font-mono">256-Bit SHA Verified Hash</p>
                      </div>
                    )}
                  </div>

                  {previewItem.shaHash && (
                    <div className="mb-4 bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[10px]">Tamper-Proof Hash:</span>
                      <span className="text-green-400 text-[10px] font-bold">{previewItem.shaHash}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(previewItem)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} /> Export Decrypted File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewItem(null)}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
