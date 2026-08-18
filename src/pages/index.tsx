import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'motion/react';
import {
  Shield,
  Mic,
  MapPin,
  AlertTriangle,
  Users,
  Camera,
  Bot,
  ChevronRight,
  Zap,
  Brain,
  Lock,
  Database,
  Globe,
  Phone,
  Activity,
  Eye,
  CheckCircle,
  X,
  Play,
  Volume2,
  Maximize,
} from 'lucide-react';

// ─── Animated Radar Background ───────────────────────────────────────────────
function RadarBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Radar rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-red-500/10"
            style={{
              width: `${i * 180}px`,
              height: `${i * 180}px`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        {/* Sweeping radar line */}
        <div
          className="absolute w-px origin-bottom"
          style={{
            height: '360px',
            top: '-360px',
            left: '0',
            background: 'linear-gradient(to top, rgba(220,38,38,0.4), transparent)',
            animation: 'radar-sweep 4s linear infinite',
          }}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-[#0a0a0f]" />
      {/* Blue glow center */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-900/10 rounded-full blur-3xl" />
    </div>
  );
}

// ─── SOS Button ───────────────────────────────────────────────────────────────
function SOSButton() {
  return (
    <div className="relative flex items-center justify-center w-44 h-44 mx-auto">
      {/* Pulsing rings */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 border-red-500"
          style={{
            width: `${100 + i * 40}px`,
            height: `${100 + i * 40}px`,
            animation: `sos-pulse ${1.5 + i * 0.5}s ease-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      {/* Main button */}
      <button
        className="relative z-10 w-28 h-28 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all duration-150 flex flex-col items-center justify-center shadow-2xl shadow-red-600/50 cursor-pointer border-4 border-red-400/30"
        aria-label="SOS Emergency Button"
      >
        <AlertTriangle className="text-white mb-0.5" size={28} />
        <span className="text-white font-black text-xs tracking-widest">SOS</span>
        <span className="text-red-200 text-[9px] font-semibold tracking-wider">EMERGENCY</span>
      </button>
    </div>
  );
}

// ─── Trust Badge ──────────────────────────────────────────────────────────────
function TrustBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <Icon size={14} className="text-red-400 flex-shrink-0" />
      <span className="text-xs font-medium whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accent?: 'red' | 'blue';
  large?: boolean;
  delay?: number;
}

function FeatureCard({ icon: Icon, title, description, accent = 'red', large = false, delay = 0 }: FeatureCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const accentColor = accent === 'red' ? 'text-red-400' : 'text-blue-400';
  const accentBg = accent === 'red' ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20';
  const glowColor = accent === 'red' ? 'hover:border-red-500/30 hover:shadow-red-500/10' : 'hover:border-blue-500/30 hover:shadow-blue-500/10';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: 'easeOut' as const }}
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl border border-white/8 bg-gradient-to-br from-[#0d1b3e]/60 to-[#0a0a0f]/80 backdrop-blur-sm p-6 hover:border-white/15 hover:shadow-xl transition-all duration-300 ${glowColor} ${large ? 'md:col-span-2' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${accentBg}`}>
        <Icon size={20} className={accentColor} />
      </div>
      <h3 className="text-white font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      {large && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-red-400 group-hover:gap-2.5 transition-all">
          Learn more <ChevronRight size={12} />
        </div>
      )}
    </motion.div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ number, title, description, delay }: { number: string; title: string; description: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: 'easeOut' as const }}
      className="relative flex flex-col items-center text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center mb-4 shadow-lg shadow-red-500/10">
        <span className="text-red-400 font-black text-xl" style={{ fontFamily: 'var(--font-heading)' }}>{number}</span>
      </div>
      <h3 className="text-white font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed max-w-[200px]">{description}</p>
    </motion.div>
  );
}

// ─── Security Badge ───────────────────────────────────────────────────────────
function SecurityBadge({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-blue-400" />
      </div>
      <div>
        <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
        <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <title>JanSuraksha AI — Real-Time AI Emergency Response System</title>
      <meta name="description" content="JanSuraksha AI provides instant SOS alerts, voice-triggered emergency detection, live tracking, and intelligent risk prediction to keep you safe." />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">
        <RadarBackground />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const }}
            className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-full px-4 py-1.5 mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-300 text-xs font-semibold tracking-wider uppercase">AI-Powered Safety Platform</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' as const }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Real-Time AI<br />
            <span className="text-red-500">Emergency</span> Response<br />
            System
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' as const }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Instant SOS alerts, voice-triggered emergency detection, live tracking, and intelligent risk prediction — protecting you 24/7.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' as const }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
          >
            <Link
              to="/signup"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-red-600/30 hover:shadow-red-500/40 text-sm"
            >
              Get Started Free
              <ChevronRight size={16} />
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              className="flex items-center gap-2 text-slate-300 hover:text-white border border-white/15 hover:border-white/30 px-7 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium"
            >
              <Eye size={16} />
              View Demo
            </button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4, ease: 'easeOut' as const }}
            className="flex flex-wrap items-center justify-center gap-5 mb-14"
          >
            <TrustBadge icon={Shield} label="Secure Platform" />
            <div className="w-px h-4 bg-white/10" />
            <TrustBadge icon={Zap} label="Real-Time Response" />
            <div className="w-px h-4 bg-white/10" />
            <TrustBadge icon={Brain} label="AI Powered Safety" />
          </motion.div>

          {/* SOS Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' as const }}
          >
            <SOSButton />
            <p className="text-slate-500 text-xs mt-4">Tap once to send instant emergency alert</p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/20" />
          <div className="w-1 h-1 rounded-full bg-white/30" />
        </motion.div>
      </section>

      {/* ── FEATURES BENTO ───────────────────────────────────────────────── */}
      <section id="features" ref={featuresRef} className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: 'easeOut' as const }}
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4"
            >
              <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">Core Features</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' as const }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Everything You Need<br />to Stay Safe
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' as const }}
              className="text-slate-400 text-lg max-w-xl mx-auto"
            >
              Powered by advanced AI to detect, respond, and protect in real-time.
            </motion.p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Large card 1 */}
            <FeatureCard
              icon={Mic}
              title="Voice Activation"
              description="Say 'Help' or 'Bachao' to instantly trigger an emergency alert. Our AI understands multiple languages and dialects, even in noisy environments."
              accent="red"
              large
              delay={0}
            />
            {/* Small card 1 */}
            <FeatureCard
              icon={MapPin}
              title="Live Tracking"
              description="Real-time GPS tracking with nearby police stations, hospitals, and safe zones highlighted on your map."
              accent="blue"
              delay={0.05}
            />
            {/* Small card 2 */}
            <FeatureCard
              icon={Activity}
              title="AI Risk Detection"
              description="Proactive risk analysis based on location, time, and patterns. Get warned before entering danger zones."
              accent="red"
              delay={0.1}
            />
            {/* Small card 3 */}
            <FeatureCard
              icon={Users}
              title="Emergency Contacts"
              description="Instantly alert your trusted contacts with your live location and status during emergencies."
              accent="blue"
              delay={0.15}
            />
            {/* Small card 4 */}
            <FeatureCard
              icon={Camera}
              title="Incident Recording"
              description="Auto-capture photos and video evidence during emergencies, securely stored and shareable with authorities."
              accent="red"
              delay={0.2}
            />
            {/* Large card 2 */}
            <FeatureCard
              icon={Bot}
              title="AI Safety Assistant"
              description="24/7 intelligent chatbot providing real-time safety guidance, emergency protocols, and situational advice in your language."
              accent="blue"
              large
              delay={0.25}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1b3e]/20 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: 'easeOut' as const }}
              className="text-3xl sm:text-4xl font-black text-white mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              How It Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' as const }}
              className="text-slate-400 text-base"
            >
              Three steps. Seconds to safety.
            </motion.p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {/* Connector lines (desktop) */}
            <div className="hidden md:block absolute top-7 left-[calc(33%+28px)] right-[calc(33%+28px)] h-px">
              <div className="w-full h-px bg-gradient-to-r from-red-500/40 via-red-500/60 to-red-500/40" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
            </div>

            <StepCard
              number="01"
              title="Trigger Alert"
              description="Press SOS button or say the trigger word. Alert fires in under 1 second."
              delay={0}
            />
            <StepCard
              number="02"
              title="AI Detects & Notifies"
              description="AI analyzes your situation and instantly notifies emergency contacts and nearby responders."
              delay={0.1}
            />
            <StepCard
              number="03"
              title="Help Arrives"
              description="Real-time coordination ensures the fastest possible response to your location."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────────── */}
      <section id="about" ref={aboutRef} className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: 'easeOut' as const }}
            >
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="text-red-300 text-xs font-semibold tracking-wider uppercase">About Us</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Built to Protect.<br />
                <span className="text-red-500">Powered by AI.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-6">
                JanSuraksha AI is an intelligent personal safety platform designed to provide real-time emergency support using AI, voice recognition, and location tracking to protect lives.
              </p>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                We believe safety is a fundamental right. Our platform bridges the gap between danger and help — making emergency response accessible to everyone, everywhere in India.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/25 text-sm"
              >
                Start Protecting Yourself
                <ChevronRight size={15} />
              </Link>
            </motion.div>

            {/* Right: Stats */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' as const }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: '2M+', label: 'Users Protected', icon: Users, accent: 'red' },
                { value: '<3s', label: 'Avg Response Time', icon: Zap, accent: 'blue' },
                { value: '99.9%', label: 'Platform Uptime', icon: Activity, accent: 'red' },
                { value: '24/7', label: 'AI Monitoring', icon: Eye, accent: 'blue' },
              ].map(({ value, label, icon: Icon, accent }) => (
                <div
                  key={label}
                  className="p-6 rounded-2xl bg-gradient-to-br from-[#0d1b3e]/60 to-[#0a0a0f]/80 border border-white/8 hover:border-white/15 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${accent === 'red' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                    <Icon size={16} className={accent === 'red' ? 'text-red-400' : 'text-blue-400'} />
                  </div>
                  <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{value}</div>
                  <div className="text-slate-400 text-xs">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECURITY & TRUST ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Blue glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-900/15 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: 'easeOut' as const }}
              className="text-3xl sm:text-4xl font-black text-white mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Security You Can Trust
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' as const }}
              className="text-slate-400 text-base max-w-lg mx-auto"
            >
              Your data and safety are our top priorities. Built with enterprise-grade security from day one.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <SecurityBadge
              icon={Lock}
              title="End-to-End Encrypted"
              description="All communications and data are encrypted using AES-256 military-grade encryption."
            />
            <SecurityBadge
              icon={Database}
              title="Secure Data Storage"
              description="Your data is stored in ISO 27001 certified data centers with zero-knowledge architecture."
            />
            <SecurityBadge
              icon={Globe}
              title="GDPR Compliant"
              description="Full compliance with GDPR and India's PDPB data protection regulations."
            />
          </motion.div>

          {/* Trust indicators row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' as const }}
            className="flex flex-wrap items-center justify-center gap-6 mt-10"
          >
            {['ISO 27001 Certified', 'SOC 2 Type II', 'PDPB Compliant', 'Zero Data Breach'].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-slate-400">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs font-medium">{badge}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
            className="relative rounded-3xl overflow-hidden border border-white/8"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3e] via-[#0a0a0f] to-[#1a0505]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/8 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/8 rounded-full blur-3xl" />

            <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Phone size={16} className="text-red-400" />
                  <span className="text-red-300 text-xs font-semibold tracking-wider uppercase">Get Protected Today</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Start Protecting<br />
                  <span className="text-red-500">Yourself Today</span>
                </h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  Join over 2 million users who trust JanSuraksha AI to keep them safe. Free to get started — no credit card required.
                </p>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <Link
                  to="/signup"
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-red-600/30 hover:shadow-red-500/40 text-sm whitespace-nowrap"
                >
                  <Shield size={16} />
                  Get Started Free
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center justify-center gap-2 text-slate-300 hover:text-white border border-white/15 hover:border-white/30 px-8 py-4 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Radar sweep animation */}
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sos-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* ── Demo Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showDemo && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              onClick={() => setShowDemo(false)}
            />

            {/* Modal — full-height scroll container on mobile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="fixed inset-0 z-50 flex items-start sm:items-center justify-center sm:p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full max-w-3xl bg-[#0a0d1a] border-0 sm:border border-white/10 sm:rounded-3xl shadow-2xl shadow-black/60 flex flex-col h-full sm:h-auto sm:max-h-[92vh]"
                onClick={e => e.stopPropagation()}
              >
                {/* ── Sticky top bar with close button (always visible) */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/8 flex-shrink-0 bg-[#0a0d1a] sm:rounded-t-3xl">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                      <Play size={11} className="text-red-400 ml-0.5" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-bold leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                        JanSuraksha AI Demo
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">Product walkthrough</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDemo(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-slate-300 hover:text-white transition-all text-xs font-semibold border border-white/10"
                  >
                    <X size={13} />
                    Close
                  </button>
                </div>

                {/* ── Scrollable body */}
                <div className="overflow-y-auto flex-1 sm:flex-none">

                  {/* Title block */}
                  <div className="px-4 sm:px-6 pt-5 pb-4">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 mb-2">
                      <Play size={10} className="text-red-400" />
                      <span className="text-red-300 text-[10px] font-semibold tracking-wider uppercase">Product Demo</span>
                    </div>
                    <h2 className="text-white text-xl font-black leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                      Watch How JanSuraksha AI Works
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      See how our AI-powered emergency system detects danger, sends alerts, and protects users in real-time.
                    </p>
                  </div>

                  {/* Video Player */}
                  <div className="px-4 sm:px-6">
                    <div className="relative w-full rounded-2xl overflow-hidden bg-[#060912] border border-white/8 shadow-inner" style={{ aspectRatio: '16/9' }}>
                      {/* Demo video */}
                      <video
                        className="absolute inset-0 w-full h-full rounded-2xl"
                        src="https://video.pictory.ai/v2/preview/202604060733174420ffcad71ce454eee9d523e9dcdcca64c"
                        controls
                        playsInline
                        preload="metadata"
                        onError={(e) => {
                          const el = e.currentTarget;
                          el.style.display = 'none';
                          const fallback = el.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 flex-col items-center justify-center gap-3 bg-[#060912] hidden">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <Play size={28} className="text-slate-500 ml-1" />
                        </div>
                        <p className="text-slate-500 text-sm">Demo video currently unavailable</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Features Shown */}
                  <div className="px-4 sm:px-6 pt-5 pb-6">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Key Features Shown in This Demo</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: AlertTriangle, label: 'One-Click SOS Alert', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                        { icon: Mic, label: 'Voice-Triggered Emergency', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                        { icon: MapPin, label: 'Live Location Tracking', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                        { icon: Brain, label: 'AI Safety Prediction', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
                      ].map(({ icon: Icon, label, color, bg, border }) => (
                        <div key={label} className={`flex flex-col items-center gap-2 p-3 rounded-2xl ${bg} border ${border} text-center`}>
                          <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                            <Icon size={16} className={color} />
                          </div>
                          <span className="text-white text-[11px] font-semibold leading-tight">{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA row */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 mt-5 pt-5 border-t border-white/6">
                      <Link
                        to="/signup"
                        onClick={() => setShowDemo(false)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-red-600/25"
                      >
                        Get Started Free
                        <ChevronRight size={15} />
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setShowDemo(false)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/6 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
                      >
                        <Activity size={15} />
                        Explore Dashboard
                      </Link>
                      <div className="hidden sm:flex items-center gap-3 sm:ml-auto text-slate-600 text-xs">
                        <span className="flex items-center gap-1"><Volume2 size={11} />Sound on for best experience</span>
                        <span className="flex items-center gap-1"><Maximize size={11} />Fullscreen available</span>
                      </div>
                    </div>
                  </div>

                </div>{/* end scrollable body */}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

