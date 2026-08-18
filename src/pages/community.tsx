import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, MapPin, AlertTriangle, Shield, Phone, CheckCircle, Mic, Heart, Clock,
  Plus, MessageSquare, ThumbsUp, Send, RefreshCw, X
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api-client';
import { locationService } from '../lib/locationService';

interface Helper {
  id: string;
  name?: string;
  distance: string;
  status: 'available' | 'busy' | 'responding';
  rating: number;
  verified: boolean;
  responseTime: string;
}

interface EmergencyService {
  id?: string;
  name: string;
  distance: string;
  phone?: string;
  type?: string;
}

interface Incident {
  id: string;
  title: string;
  category: string;
  location: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  upvotes: number;
}

export default function CommunityPage() {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>([
    { name: 'Police Station', distance: '0.6 km', phone: '100' },
    { name: 'City Hospital', distance: '1.2 km', phone: '102' },
    { name: 'Fire Station', distance: '0.9 km', phone: '101' },
  ]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [requested, setRequested] = useState<string | null>(null);
  const [helpRequested, setHelpRequested] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('Hazard');
  const [reportSeverity, setReportSeverity] = useState('medium');
  const [reportDescription, setReportDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      const loc = locationService.getLocationState();
      const coords = loc.coords;

      const [helpersRes, incidentsRes] = await Promise.allSettled([
        api.community.getHelpers(coords.latitude, coords.longitude),
        api.community.getIncidents(),
      ]);

      if (helpersRes.status === 'fulfilled' && helpersRes.value.success) {
        setHelpers(helpersRes.value.helpers || []);
        if (helpersRes.value.emergencyServices?.length) {
          setEmergencyServices(helpersRes.value.emergencyServices);
        }
      }

      if (incidentsRes.status === 'fulfilled' && incidentsRes.value.success) {
        setIncidents(incidentsRes.value.incidents || []);
      }
    } catch (err) {
      console.error('Community data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastHelp = async () => {
    const loc = locationService.getLocationState();
    try {
      await api.community.requestHelp({
        coordinates: loc.coords,
        address: loc.address.formattedAddress,
      });
      setHelpRequested(true);
      toast.success('Distress broadcast dispatched to all nearby verified community responders!');
    } catch (err: any) {
      toast.error('Failed to broadcast help request');
    }
  };

  const handleRequestIndividual = async (helper: Helper) => {
    const loc = locationService.getLocationState();
    try {
      await api.community.requestHelp({
        helperId: helper.id,
        coordinates: loc.coords,
        address: loc.address.formattedAddress,
      });
      setRequested(helper.id);
      toast.success(`Direct distress alert sent to ${helper.name || helper.id}!`);
    } catch (err: any) {
      toast.error('Failed to notify responder');
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) {
      toast.error('Please enter a title for the hazard report');
      return;
    }

    const loc = locationService.getLocationState();

    try {
      const res = await api.community.reportIncident({
        title: reportTitle.trim(),
        category: reportCategory,
        location: loc.address.locality ? `${loc.address.locality}, ${loc.address.city}` : loc.address.city,
        coordinates: loc.coords,
        severity: reportSeverity,
        description: reportDescription.trim(),
      });

      if (res.success) {
        setIncidents((prev) => [res.incident, ...prev]);
        toast.success('Community hazard report posted successfully');
        setShowReportModal(false);
        setReportTitle('');
        setReportDescription('');
      }
    } catch (err: any) {
      toast.error('Failed to post hazard report');
    }
  };

  return (
    <>
      <title>Community Rescue Network — JanSuraksha AI</title>
      <meta name="description" content="Connect with nearby verified community helpers and emergency services in real-time." />

      <div className="pt-20 pb-24 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pt-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-2">
                <Users size={12} className="text-teal-400" />
                <span className="text-teal-300 text-xs font-semibold tracking-wider uppercase">Community Network</span>
              </div>
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Community Rescue Network
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Anonymous verified nearby helpers and local emergency services ready to respond to safety alerts.
              </p>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              <Plus size={14} /> Report Hazard / Incident
            </button>
          </div>

          {/* Map Preview */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' as const }}
            className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 mb-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                Live Responder Radar
              </h3>
              <div className="flex items-center gap-1.5 text-green-400 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {helpers.filter((h) => h.status === 'available').length} verified responders active in your zone
              </div>
            </div>

            <div className="relative h-52 rounded-xl bg-[#0a0f1e] border border-white/5 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="community-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#community-grid)" />
              </svg>

              {/* User location dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping scale-150" />
                  <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50 relative z-10" />
                </div>
              </div>

              {/* Helper radar dots */}
              {[
                { top: '30%', left: '65%', status: 'available' },
                { top: '60%', left: '70%', status: 'available' },
                { top: '25%', left: '35%', status: 'busy' },
                { top: '70%', left: '30%', status: 'available' },
              ].map((pos, i) => (
                <div key={i} className="absolute z-10" style={{ top: pos.top, left: pos.left }}>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md ${
                      pos.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                </div>
              ))}

              <div className="absolute top-3 right-3 flex flex-col gap-1 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> You
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Active Helper
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" /> Responding
                </div>
              </div>
            </div>
          </motion.div>

          {/* Request Help Action */}
          {!helpRequested ? (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' as const }}
              onClick={handleBroadcastHelp}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-red-600/30 text-sm mb-6 cursor-pointer"
            >
              <AlertTriangle size={16} />
              Broadcast Distress Signal to Nearby Responders
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-4"
            >
              <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
              <div>
                <div className="text-green-300 font-semibold text-sm">Distress Signal Active!</div>
                <div className="text-green-400/70 text-xs mt-0.5">
                  4 nearby helpers notified anonymously with live navigation telemetry.
                </div>
              </div>
              <button
                onClick={() => setHelpRequested(false)}
                className="ml-auto text-slate-400 hover:text-white text-xs border border-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancel Broadcast
              </button>
            </motion.div>
          )}

          {/* Nearby Responders Grid */}
          <div className="mb-8">
            <h3 className="text-white font-semibold text-base mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Nearby Active Responders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {helpers.map((helper) => (
                <div
                  key={helper.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 hover:border-white/15 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {helper.id}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-sm font-semibold">{helper.name || `Responder #${helper.id}`}</span>
                      {helper.verified && (
                        <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 text-[9px] text-blue-400 font-semibold">
                          <CheckCircle size={8} /> VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} className="text-slate-500" /> {helper.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-500" /> {helper.responseTime}
                      </span>
                      <span className="text-yellow-400">★ {helper.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRequestIndividual(helper)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        requested === helper.id
                          ? 'bg-green-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                      }`}
                    >
                      {requested === helper.id ? <CheckCircle size={12} /> : <Phone size={12} />}
                      {requested === helper.id ? 'Alerted' : 'Alert'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Services */}
          <div className="mb-8">
            <h3 className="text-white font-semibold text-base mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Nearest Emergency Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {emergencyServices.map((service) => (
                <a
                  key={service.name}
                  href={`tel:${service.phone || '112'}`}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 hover:border-white/15 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">{service.name}</div>
                    <div className="text-slate-500 text-[10px] flex items-center gap-1">
                      <MapPin size={8} /> {service.distance}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Community Incident Reports */}
          <div>
            <h3 className="text-white font-semibold text-base mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Community Hazard Feed
            </h3>
            <div className="flex flex-col gap-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-[#0d1b3e]/60 border border-white/8 rounded-2xl p-4 hover:border-white/12 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{inc.title}</span>
                      <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">
                        {inc.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{inc.time}</span>
                  </div>
                  <p className="text-slate-300 text-xs mb-2">{inc.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px] text-blue-400 font-mono">
                      <MapPin size={11} /> {inc.location}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <ThumbsUp size={11} /> {inc.upvotes} confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Hazard Modal */}
          <AnimatePresence>
            {showReportModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              >
                <div className="bg-[#0d1b3e] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Report Area Hazard</h3>
                    <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleReportIncident} className="flex flex-col gap-4">
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1 block">Hazard Title</label>
                      <input
                        type="text"
                        required
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="e.g. Non-functional street lights"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-xs font-medium mb-1 block">Category</label>
                        <select
                          value={reportCategory}
                          onChange={(e) => setReportCategory(e.target.value)}
                          className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs"
                        >
                          <option value="Hazard">Hazard</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Crowd Risk">Crowd Risk</option>
                          <option value="Poor Lighting">Poor Lighting</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-medium mb-1 block">Severity</label>
                        <select
                          value={reportSeverity}
                          onChange={(e) => setReportSeverity(e.target.value)}
                          className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High Risk</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1 block">Description & Details</label>
                      <textarea
                        rows={3}
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Describe the condition so other community members can stay safe..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-teal-500/50"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowReportModal(false)}
                        className="flex-1 bg-white/5 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-teal-600/30"
                      >
                        Post Report
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
