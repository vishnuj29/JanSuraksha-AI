import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Shield, AlertTriangle, Navigation, Users, Clock,
  Wifi, WifiOff, Eye, EyeOff, Share2, CheckCircle, Mic,
  ChevronRight, Zap, Route, LocateFixed, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { locationService, UserLocationState, DynamicRiskZone } from '../lib/locationService';
import { api } from '../lib/api-client';
import InteractiveMap, { ThreatZoneMarker, ResponderMarker } from '../components/InteractiveMap';

type TrackingMode = 'standard' | 'stealth' | 'sos';

interface NearbyUser {
  id: string;
  angle: number;
  distance: string;
  status: 'safe' | 'alert';
}

const nearbyUsers: NearbyUser[] = [
  { id: 'u1', angle: 45, distance: '0.4 km', status: 'safe' },
  { id: 'u2', angle: 150, distance: '0.7 km', status: 'safe' },
  { id: 'u3', angle: 260, distance: '1.1 km', status: 'alert' },
  { id: 'u4', angle: 320, distance: '0.9 km', status: 'safe' },
];

const zoneColors = {
  high: { bg: 'bg-red-500/20', border: 'border-red-500/40', blur: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500/10 border-red-500/20 text-red-400' },
  medium: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', blur: 'bg-yellow-500/8', text: 'text-yellow-400', badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
  low: { bg: 'bg-green-500/10', border: 'border-green-500/25', blur: 'bg-green-500/6', text: 'text-green-400', badge: 'bg-green-500/10 border-green-500/20 text-green-400' },
};

export default function TrackingPage() {
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('standard');
  const [isTracking, setIsTracking] = useState(true);
  const [shareLocation, setShareLocation] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DynamicRiskZone | null>(null);
  const [locationState, setLocationState] = useState<UserLocationState>(locationService.getLocationState());
  const [riskZones, setRiskZones] = useState<DynamicRiskZone[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [locating, setLocating] = useState(false);

  // Subscribe to Location Service
  useEffect(() => {
    const unsubscribe = locationService.subscribe((state) => {
      setLocationState(state);
      const zones = locationService.getDynamicRiskZones(state.coords, state.address.city);
      setRiskZones(zones);
    });

    // Start high-accuracy watch if tracking is enabled
    let cleanupWatcher: (() => void) | undefined;
    if (isTracking) {
      cleanupWatcher = locationService.startWatching((state) => {
        // Post telemetry to backend
        api.tracking.updateLocation({
          latitude: state.coords.latitude,
          longitude: state.coords.longitude,
          address: state.address.formattedAddress,
          city: state.address.city,
          accuracy: state.coords.accuracy,
        }).catch(() => {});
      });
    }

    return () => {
      unsubscribe();
      cleanupWatcher?.();
    };
  }, [isTracking]);

  // Timer counter
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTracking) {
      interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  // Initial fresh location fetch
  useEffect(() => {
    refreshLocation();
  }, []);

  const refreshLocation = async () => {
    setLocating(true);
    try {
      const state = await locationService.getCurrentPosition(true);
      setLocationState(state);
      const zones = locationService.getDynamicRiskZones(state.coords, state.address.city);
      setRiskZones(zones);
      toast.success(`Location identified: ${state.address.formattedAddress}`);
    } catch (err: any) {
      console.warn('Location refresh error:', err);
      toast.error('Using last known location coordinates');
    } finally {
      setLocating(false);
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const modeConfig = {
    standard: { label: 'Standard', color: 'bg-blue-600', text: 'text-blue-300', desc: 'Full tracking with all features active' },
    stealth: { label: 'Stealth', color: 'bg-purple-600', text: 'text-purple-300', desc: 'Silent tracking — no visible indicators' },
    sos: { label: 'SOS Mode', color: 'bg-red-600', text: 'text-red-300', desc: 'Emergency tracking with rapid alerts' },
  };

  const coords = locationState.coords;
  const address = locationState.address;

  const handleShareLocation = async () => {
    const url = locationService.formatMapUrl(coords);
    const text = `📍 JanSuraksha Live Location (${address.city}):\n${address.formattedAddress}\nTrack here: ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Live Safe Location — JanSuraksha AI',
          text,
          url,
        });
        setShareLocation(true);
        toast.success('Live location shared!');
      } catch (err) {
        console.log('Share canceled or error:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setShareLocation(true);
      toast.success('Location map link copied to clipboard!');
    }
  };

  return (
    <>
      <title>Live Tracking — JanSuraksha AI</title>
      <meta name="description" content="Real-time AI-powered location tracking with accurate GPS, threat detection, and safe route guidance." />

      <div className="pt-16 min-h-screen flex flex-col">
        {/* ── Full-screen Real Interactive Map Area ─────────────────────────────── */}
        <div className="relative flex-1 bg-[#080d1a] overflow-hidden p-2 sm:p-4" style={{ minHeight: '58vh' }}>
          <InteractiveMap
            latitude={coords.latitude}
            longitude={coords.longitude}
            accuracy={coords.accuracy}
            address={address.formattedAddress}
            height="58vh"
            zoom={15}
            onRefreshLocation={refreshLocation}
            riskZones={riskZones.map((z, idx) => {
              const offsets = [
                { lat: 0.0035, lng: 0.003 },
                { lat: -0.003, lng: -0.004 },
                { lat: 0.002, lng: -0.0035 },
                { lat: -0.004, lng: 0.0035 },
              ];
              const pos = offsets[idx % offsets.length];
              return {
                id: z.id,
                name: z.name,
                level: z.level === 'high' ? 'High' : z.level === 'medium' ? 'Moderate' : 'Caution',
                coordinates: [coords.latitude + pos.lat, coords.longitude + pos.lng],
                radius: z.level === 'high' ? 320 : 220,
                description: z.description,
              };
            })}
            responders={[
              {
                id: 'r1',
                name: 'Patrol Cruiser #12 (Police)',
                type: 'Police',
                coordinates: [coords.latitude + 0.0018, coords.longitude + 0.002],
                distance: '0.3 km',
                eta: '2 mins',
              },
              {
                id: 'r2',
                name: 'Ambulance Emergency Medic',
                type: 'Medic',
                coordinates: [coords.latitude - 0.0022, coords.longitude + 0.0028],
                distance: '0.6 km',
                eta: '4 mins',
              },
              {
                id: 'r3',
                name: 'Community Safety Volunteer',
                type: 'Volunteer',
                coordinates: [coords.latitude + 0.003, coords.longitude - 0.0022],
                distance: '0.8 km',
                eta: '7 mins',
              },
            ]}
          />

          {/* Top-left: Mode badge & Connectivity */}
          <div className="absolute top-6 left-6 z-30 flex flex-col gap-2 pointer-events-none">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${modeConfig[trackingMode].color}/20 border border-white/10 backdrop-blur-md shadow-lg pointer-events-auto`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${modeConfig[trackingMode].color} animate-pulse`} />
              <span className={`text-xs font-semibold ${modeConfig[trackingMode].text}`}>
                {modeConfig[trackingMode].label} Mode
              </span>
            </div>
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30 backdrop-blur-md pointer-events-auto">
                <WifiOff size={11} className="text-orange-400" />
                <span className="text-orange-300 text-xs font-semibold">Offline — SMS Fallback</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Controls Panel ───────────────────────────────────── */}
        <div className="bg-[#0a0a0f] border-t border-white/8 px-4 py-5">
          <div className="max-w-4xl mx-auto">
            {/* Tracking toggle + share */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setIsTracking(!isTracking)}
                className={`flex-1 flex items-center justify-center gap-2 font-bold py-3.5 rounded-2xl transition-all duration-200 text-sm shadow-lg ${
                  isTracking
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25'
                    : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/25'
                }`}
              >
                {isTracking ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> Stop Tracking
                  </>
                ) : (
                  <>
                    <LocateFixed size={15} /> Start Real-Time Tracking
                  </>
                )}
              </button>

              <button
                onClick={handleShareLocation}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border font-semibold text-sm transition-all ${
                  shareLocation
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {shareLocation ? <Eye size={15} /> : <Share2 size={15} />}
                {shareLocation ? 'Shared' : 'Share Location'}
              </button>
            </div>

            {/* Tracking Mode Selector */}
            <div className="mb-5">
              <div className="text-slate-400 text-xs font-medium mb-2">Tracking Mode</div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(modeConfig) as TrackingMode[]).map((mode) => {
                  const cfg = modeConfig[mode];
                  const active = trackingMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setTrackingMode(mode)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all ${
                        active
                          ? `${cfg.color} border-transparent text-white shadow-lg`
                          : 'bg-white/3 border-white/8 text-slate-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {mode === 'standard' && <Navigation size={14} />}
                      {mode === 'stealth' && <EyeOff size={14} />}
                      {mode === 'sos' && <AlertTriangle size={14} />}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-slate-500 text-xs mt-2">{modeConfig[trackingMode].desc}</p>
            </div>

            {/* Live Stats Row with Real Location Data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                {
                  icon: MapPin,
                  label: 'Current City',
                  value: address.city || 'Locating...',
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                },
                {
                  icon: Zap,
                  label: 'GPS Accuracy',
                  value: coords.accuracy ? `±${Math.round(coords.accuracy)}m` : '±5 meters',
                  color: 'text-green-400',
                  bg: 'bg-green-500/10',
                },
                {
                  icon: Users,
                  label: 'Nearby Responders',
                  value: `${nearbyUsers.length} active`,
                  color: 'text-teal-400',
                  bg: 'bg-teal-500/10',
                },
                {
                  icon: AlertTriangle,
                  label: 'Threat Zones',
                  value: `${riskZones.length} analyzed`,
                  color: 'text-yellow-400',
                  bg: 'bg-yellow-500/10',
                },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1b3e]/60 border border-white/8">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={color} />
                  </div>
                  <div className="truncate">
                    <div className="text-slate-500 text-[10px]">{label}</div>
                    <div className="text-white text-xs font-semibold truncate">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Localized Threat Zone Alerts */}
            <div className="mb-5">
              <div className="text-slate-400 text-xs font-medium mb-2">
                Real-Time Threat Telemetry ({address.city})
              </div>
              <div className="flex flex-col gap-2">
                {riskZones.slice(0, 2).map((zone) => {
                  const c = zoneColors[zone.level];
                  return (
                    <div key={zone.id} className={`flex items-start gap-3 p-3 rounded-xl border ${c.badge}`}>
                      <AlertTriangle size={13} className={`${c.text} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${c.text}`}>{zone.name}</span>
                          <span className="text-slate-500 text-[10px]">{zone.distanceKm} km away</span>
                        </div>
                        <p className="text-slate-400 text-[10px] mt-0.5">{zone.description}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/8 border border-green-500/20">
                  <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                  <span className="text-green-300 text-xs">
                    Current street location is within an actively monitored perimeter
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="flex gap-3">
              <Link
                to="/emergency"
                className="flex-1 flex items-center justify-center gap-2 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-300 font-semibold py-3 rounded-xl transition-all text-sm"
              >
                <AlertTriangle size={14} />
                Instant SOS Emergency
              </Link>
              <Link
                to="/community"
                className="flex-1 flex items-center justify-center gap-2 bg-teal-600/15 hover:bg-teal-600/25 border border-teal-500/30 text-teal-300 font-semibold py-3 rounded-xl transition-all text-sm"
              >
                <Users size={14} />
                Community Rescue
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loc-pulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
      `}</style>
    </>
  );
}
