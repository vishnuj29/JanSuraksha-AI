import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Shield, AlertTriangle, MapPin, Users, Mic, Camera, Bot, Activity,
  TrendingUp, TrendingDown, Bell, Settings, ChevronRight, Zap,
  Eye, Wifi, WifiOff, Clock, CheckCircle, BarChart2, RefreshCw, Navigation
} from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap';
import { useAuthStore } from '../lib/authStore';
import { locationService, UserLocationState } from '../lib/locationService';
import { toast } from 'sonner';

// ─── Safety Score Gauge ───────────────────────────────────────────────────────
function SafetyGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return { stroke: '#22c55e', text: 'text-green-400', label: 'HIGH', bg: 'bg-green-500/10 border-green-500/30' };
    if (score >= 40) return { stroke: '#f59e0b', text: 'text-yellow-400', label: 'MEDIUM', bg: 'bg-yellow-500/10 border-yellow-500/30' };
    return { stroke: '#ef4444', text: 'text-red-400', label: 'LOW', bg: 'bg-red-500/10 border-red-500/30' };
  };
  const { stroke, text, label, bg } = getColor();

  const radius = 70;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-28">
        <svg viewBox="0 0 160 90" className="w-full h-full" style={{ overflow: 'visible' }}>
          {/* Background arc */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke={stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
          />
          {/* Score text */}
          <text x="80" y="72" textAnchor="middle" fill="white" fontSize="28" fontWeight="900" fontFamily="var(--font-heading)">
            {score}
          </text>
          <text x="80" y="86" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">
            SAFETY SCORE
          </text>
        </svg>
      </div>
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold tracking-wider ${bg} ${text}`}>
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ background: stroke }} />
        {label} SAFETY LEVEL
      </div>
    </div>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, trend, trendUp, sparkData, accent }: {
  icon: React.ElementType; label: string; value: string; trend: string; trendUp: boolean;
  sparkData: number[]; accent: 'red' | 'blue' | 'green' | 'yellow';
}) {
  const colors = {
    red: { icon: 'text-red-400', bg: 'bg-red-500/10', spark: '#ef4444' },
    blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', spark: '#60a5fa' },
    green: { icon: 'text-green-400', bg: 'bg-green-500/10', spark: '#22c55e' },
    yellow: { icon: 'text-yellow-400', bg: 'bg-yellow-500/10', spark: '#f59e0b' },
  };
  const c = colors[accent];

  return (
    <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={16} className={c.icon} />
        </div>
        <Sparkline data={sparkData} color={c.spark} />
      </div>
      <div className="text-2xl font-black text-white mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>{value}</div>
      <div className="text-slate-400 text-xs mb-2">{label}</div>
      <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
        {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {trend}
      </div>
    </div>
  );
}

// ─── Risk Alert Banner ────────────────────────────────────────────────────────
function RiskBanner({ level, message }: { level: 'low' | 'medium' | 'high'; message: string }) {
  const styles = {
    low: 'bg-green-500/8 border-green-500/25 text-green-300',
    medium: 'bg-yellow-500/8 border-yellow-500/25 text-yellow-300',
    high: 'bg-red-500/10 border-red-500/30 text-red-300',
  };
  const icons = { low: CheckCircle, medium: AlertTriangle, high: AlertTriangle };
  const Icon = icons[level];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${styles[level]}`}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="font-semibold text-xs leading-relaxed">{message}</span>
    </motion.div>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, href, accent, subtitle }: { icon: React.ElementType; label: string; href: string; accent: string; subtitle?: string }) {
  return (
    <Link
      to={href}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/3 border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} shadow-md`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="text-center">
        <span className="text-slate-300 text-xs font-bold block group-hover:text-white transition-colors">{label}</span>
        {subtitle && <span className="text-[9px] text-slate-500 block mt-0.5">{subtitle}</span>}
      </div>
    </Link>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [safetyScore] = useState(user?.safetyScore || 78);
  const [isOnline, setIsOnline] = useState(true);
  const [autoDetected, setAutoDetected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationState, setLocationState] = useState<UserLocationState>(locationService.getLocationState());
  const [refreshingLocation, setRefreshingLocation] = useState(false);

  // Subscribe to Location updates
  useEffect(() => {
    const unsub = locationService.subscribe(setLocationState);
    // Start live GPS watching
    const stopWatcher = locationService.startWatching(setLocationState);
    return () => {
      unsub();
      stopWatcher();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefreshLocation = useCallback(async () => {
    setRefreshingLocation(true);
    toast.info('Fetching live GPS coordinates...');
    try {
      const loc = await locationService.fetchLiveLocation();
      setLocationState(loc);
      toast.success(`Location updated: ${loc.address.city || loc.address.formattedAddress}`);
    } catch {
      toast.error('Failed to acquire live GPS fix');
    } finally {
      setRefreshingLocation(false);
    }
  }, []);

  const scoreHistory = [65, 70, 68, 75, 72, 78, 74, 72];
  const alertHistory = [2, 1, 3, 0, 1, 2, 1, 0];

  return (
    <>
      <title>Enterprise Safety Dashboard — JanSuraksha AI</title>
      <meta name="description" content="Your personal AI safety dashboard with real-time monitoring and risk detection." />

      <div className="pt-20 pb-24 px-4 min-h-screen">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-xs font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                  {isOnline ? 'JanSuraksha AI Shield Active' : 'Offline Mode Active'}
                </span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                  ENTERPRISE v2.4
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Hello, {user?.name || 'JanSuraksha User'} 👋
              </h1>
              <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                <Navigation size={12} className="text-blue-400 flex-shrink-0" />
                <span className="truncate max-w-sm sm:max-w-md font-semibold">
                  {locationState.address.formattedAddress || 'Acquiring satellite position...'}
                </span>
                <span>·</span>
                <span>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRefreshLocation}
                disabled={refreshingLocation}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all cursor-pointer"
                title="Refresh Live GPS Position"
              >
                <RefreshCw size={13} className={refreshingLocation ? 'animate-spin' : ''} />
                <span>{refreshingLocation ? 'Locating...' : 'Refresh GPS'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                title="Toggle connectivity"
              >
                {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              </button>
              <button
                type="button"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors relative cursor-pointer"
              >
                <Bell size={16} />
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>
              <Link
                to="/contacts"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
                title="Emergency Contacts"
              >
                <Users size={16} />
              </Link>
            </div>
          </div>

          {/* Offline Banner */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3"
            >
              <WifiOff size={16} className="text-orange-400 flex-shrink-0" />
              <div>
                <span className="text-orange-300 text-sm font-semibold">Switching to Offline Protection Mode</span>
                <p className="text-orange-400/70 text-xs mt-0.5">SMS-based emergency alerts are active as fallback</p>
              </div>
            </motion.div>
          )}

          {/* Auto Detection Banner */}
          {autoDetected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3"
            >
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <span className="text-red-300 text-sm font-semibold">Emergency detected automatically</span>
                <p className="text-red-400/70 text-xs mt-0.5">Unusual inactivity detected — emergency mode triggered</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoDetected(false)}
                className="text-red-400 text-xs border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Safety Score Card */}
            <div className="lg:col-span-1 p-6 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-4">
                <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>AI Safety Score</h2>
                <span className="text-slate-500 text-xs font-bold">Real-Time</span>
              </div>
              <SafetyGauge score={safetyScore} />
              <div className="w-full mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Time of Day</span>
                  <span className="text-yellow-400 font-bold">Medium Risk</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Location Risk</span>
                  <span className="text-green-400 font-bold">Low Risk Area</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">GPS Accuracy</span>
                  <span className="text-green-400 font-bold">±{Math.round(locationState.coords.accuracy || 15)}m</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs text-center mt-4 leading-relaxed font-semibold">
                Your current safety level is <span className={safetyScore >= 70 ? 'text-green-400 font-bold' : safetyScore >= 40 ? 'text-yellow-400 font-bold' : 'text-red-400 font-bold'}>
                  {safetyScore >= 70 ? 'HIGH' : safetyScore >= 40 ? 'MEDIUM' : 'LOW'}
                </span>
              </p>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Risk Alerts */}
              <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Predictive Threat Alerts</h2>
                  <span className="text-blue-400 text-xs font-bold">AI Satellite Sentinel</span>
                </div>
                <div className="flex flex-col gap-2">
                  <RiskBanner level="low" message={`✓ You are currently in ${locationState.address.city || 'your registered safe sector'}`} />
                  <RiskBanner level="medium" message="⚠ Stay aware of surroundings after 10 PM in unmonitored sectors" />
                  <RiskBanner level="high" message="⚠ Keep voice trigger activated for instant SOS emergency broadcasting" />
                </div>
              </div>

              {/* Real Map Visual */}
              <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-red-500" />
                    <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                      Live GPS Satellite Positioning
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-green-400 font-bold">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Tracking Active
                    </div>
                    <Link
                      to="/tracking"
                      className="text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center ml-2"
                    >
                      Full Radar <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
                <InteractiveMap
                  latitude={locationState.coords.latitude}
                  longitude={locationState.coords.longitude}
                  accuracy={locationState.coords.accuracy}
                  address={locationState.address.formattedAddress}
                  height="230px"
                  zoom={15}
                  showControls={true}
                  onRefreshLocation={handleRefreshLocation}
                />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Shield} label="Days Protected" value="127" trend="+3 this week" trendUp sparkData={[80,85,82,90,88,92,89,95]} accent="green" />
            <StatCard icon={AlertTriangle} label="Alerts Broadcasted" value="3" trend="-2 vs last week" trendUp={false} sparkData={alertHistory} accent="red" />
            <StatCard icon={Activity} label="AI Safety Score" value="78" trend="+6 this month" trendUp sparkData={scoreHistory} accent="blue" />
            <StatCard icon={Clock} label="SOS Response Speed" value="1.8s" trend="Rapid dispatch" trendUp sparkData={[3.2,2.8,2.5,2.9,2.3,2.1,2.4,1.8]} accent="yellow" />
          </div>

          {/* Quick Actions (Enterprise Modules) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                Enterprise Security Modules
              </h2>
              <span className="text-slate-400 text-xs font-bold">All Subsystems Online</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <QuickAction icon={AlertTriangle} label="Emergency SOS" subtitle="Instant Distress" href="/emergency" accent="bg-red-600" />
              <QuickAction icon={Mic} label="Voice Trigger" subtitle="Microphone Shield" href="/voice" accent="bg-blue-600" />
              <QuickAction icon={MapPin} label="Live Tracking" subtitle="Satellite Radar" href="/tracking" accent="bg-indigo-600" />
              <QuickAction icon={Camera} label="Evidence Vault" subtitle="Encrypted Cloud" href="/vault" accent="bg-purple-600" />
              <QuickAction icon={Users} label="Community" subtitle="Helper Network" href="/community" accent="bg-teal-600" />
              <QuickAction icon={Bot} label="AI Assistant" subtitle="Legal & Safety Bot" href="/ai-assistant" accent="bg-orange-600" />
            </div>
          </div>

          {/* Bottom Row: AI Coach + Emergency Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Safety Coach */}
            <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Bot size={16} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>AI Safety Sentinel</h2>
                  <p className="text-slate-500 text-xs font-semibold">Real-time intelligent recommendations</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { icon: MapPin, text: 'Keep satellite GPS tracking active during late evening transit', color: 'text-blue-400' },
                  { icon: Eye, text: 'Voice emergency shield is armed for "Help", "Madad Karo", "Bachao", and "Suraksha"', color: 'text-yellow-400' },
                  { icon: CheckCircle, text: 'Encrypted Evidence Vault is ready for automatic emergency capture', color: 'text-green-400' },
                  { icon: Zap, text: 'Community helpers within 1.5 km are standing by for emergency assistance', color: 'text-teal-400' },
                ].map(({ icon: Icon, text, color }, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/3 border border-white/5">
                    <Icon size={14} className={`${color} mt-0.5 flex-shrink-0`} />
                    <span className="text-slate-300 text-xs leading-relaxed font-semibold">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Users size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Emergency Circle</h2>
                    <p className="text-slate-500 text-xs font-semibold">3 priority responders active</p>
                  </div>
                </div>
                <Link to="/contacts" className="text-red-400 text-xs hover:text-red-300 font-bold flex items-center gap-1">
                  Manage <ChevronRight size={13} />
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { name: 'Priya Kumar', relation: 'Family · Sister', phone: '+91 98765 43210', status: 'active' },
                  { name: 'Amit Sharma', relation: 'Trusted Contact · Friend', phone: '+91 87654 32109', status: 'active' },
                  { name: 'Dr. Meena Patel', relation: 'Medical Responder · Doctor', phone: '+91 76543 21098', status: 'active' },
                ].map((contact) => (
                  <div key={contact.name} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-white text-xs font-bold">
                        {contact.name[0]}
                      </div>
                      <div>
                        <div className="text-white text-xs font-bold">{contact.name}</div>
                        <div className="text-slate-500 text-[10px] font-semibold">{contact.relation} · {contact.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-green-400 text-[10px] font-bold">Ready</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAutoDetected(true)}
                className="w-full mt-3 text-xs text-slate-500 hover:text-slate-300 border border-white/5 rounded-xl py-2 font-bold transition-colors cursor-pointer"
              >
                Test Automated Threat Simulation
              </button>
            </div>
          </div>

          {/* Safety Analytics */}
          <div className="mt-6 p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={16} className="text-blue-400" />
              <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Enterprise Safety Telemetry</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Safety Score Trend */}
              <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                <div className="text-slate-400 text-xs mb-3 font-bold">Daily Safety Score (7 days)</div>
                <div className="flex items-end gap-1 h-16">
                  {[65, 70, 68, 75, 72, 78, 74].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${(v / 100) * 56}px`,
                          background: v >= 70 ? '#22c55e' : v >= 40 ? '#f59e0b' : '#ef4444',
                          opacity: 0.85,
                        }}
                      />
                      <span className="text-slate-600 text-[8px] font-bold">{['M','T','W','T','F','S','S'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Emergency History */}
              <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                <div className="text-slate-400 text-xs mb-3 font-bold">Emergency History (7 days)</div>
                <div className="flex items-end gap-1 h-16">
                  {[2, 1, 3, 0, 1, 2, 0].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm bg-red-500"
                        style={{ height: `${Math.max(4, (v / 3) * 56)}px` }}
                      />
                      <span className="text-slate-600 text-[8px] font-bold">{['M','T','W','T','F','S','S'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Risk Exposure */}
              <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                <div className="text-slate-400 text-xs mb-3 font-bold">Risk Exposure Distribution</div>
                <div className="flex flex-col gap-2 mt-2">
                  {[
                    { label: 'Low Risk', pct: 65, color: 'bg-green-500' },
                    { label: 'Medium Risk', pct: 28, color: 'bg-yellow-500' },
                    { label: 'High Risk', pct: 7, color: 'bg-red-500' },
                  ].map(({ label, pct, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[10px] mb-1 font-bold">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-slate-300">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0f]/95 backdrop-blur-md border-t border-white/8">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { icon: Shield, label: 'Home', href: '/' },
            { icon: MapPin, label: 'Track', href: '/tracking' },
            { icon: AlertTriangle, label: 'SOS', href: '/emergency', sos: true },
            { icon: Bot, label: 'AI', href: '/ai-assistant' },
            { icon: Users, label: 'Profile', href: '/dashboard' },
          ].map(({ icon: Icon, label, href, sos }) => (
            <Link
              key={label}
              to={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${sos ? 'relative -top-4' : ''}`}
            >
              {sos ? (
                <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl shadow-red-600/50 border-4 border-[#0a0a0f]">
                  <Icon size={22} className="text-white" />
                </div>
              ) : (
                <Icon size={20} className="text-slate-400" />
              )}
              {!sos && <span className="text-slate-500 text-[10px] font-bold">{label}</span>}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
