import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, AlertTriangle, Shield, Settings,
  Bell, Search,
  Activity, MapPin, Mic, Camera, Lock,
  CheckCircle, Clock, Eye, Trash2, Ban,
  UserCheck, Download, RefreshCw, Filter,
  Globe, Cpu, Database, Wifi, WifiOff, LogOut,
  ArrowUpRight, ArrowDownRight, Menu, X,
  Zap, Star, AlertOctagon,
  ToggleLeft, ToggleRight, Save, Mail, Key, Server,
} from 'lucide-react';
import { api } from '../lib/api-client';

// ── Types ────────────────────────────────────────────────────
type AdminTab = 'overview' | 'users' | 'alerts' | 'vault' | 'settings';

interface StatCard {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: 'Free' | 'Premium';
  status: 'Active' | 'Suspended' | 'Pending';
  joined: string;
  lastSeen: string;
  sosCount: number;
  location: string;
}

interface SOSAlert {
  id: string;
  user: string;
  type: 'Manual SOS' | 'Voice Trigger' | 'Auto-Detect' | 'Fall Detection';
  time: string;
  location: string;
  status: 'Resolved' | 'Active' | 'False Alarm' | 'Escalated';
  responders: number;
}

interface VaultEntry {
  id: string;
  user: string;
  type: 'photo' | 'video' | 'audio';
  size: string;
  date: string;
  emergency: boolean;
}

// ── Mock Data ─────────────────────────────────────────────────
const USERS: User[] = [
  { id: 'U001', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43210', plan: 'Premium', status: 'Active', joined: 'Jan 12, 2026', lastSeen: '2 min ago', sosCount: 3, location: 'Mumbai, MH' },
  { id: 'U002', name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91 87654 32109', plan: 'Free', status: 'Active', joined: 'Feb 3, 2026', lastSeen: '1 hr ago', sosCount: 1, location: 'Delhi, DL' },
  { id: 'U003', name: 'Ananya Singh', email: 'ananya@example.com', phone: '+91 76543 21098', plan: 'Premium', status: 'Active', joined: 'Feb 18, 2026', lastSeen: '5 min ago', sosCount: 0, location: 'Bengaluru, KA' },
  { id: 'U004', name: 'Vikram Nair', email: 'vikram@example.com', phone: '+91 65432 10987', plan: 'Free', status: 'Suspended', joined: 'Mar 1, 2026', lastSeen: '3 days ago', sosCount: 7, location: 'Chennai, TN' },
  { id: 'U005', name: 'Meera Patel', email: 'meera@example.com', phone: '+91 54321 09876', plan: 'Premium', status: 'Active', joined: 'Mar 14, 2026', lastSeen: '30 min ago', sosCount: 2, location: 'Ahmedabad, GJ' },
  { id: 'U006', name: 'Arjun Reddy', email: 'arjun@example.com', phone: '+91 43210 98765', plan: 'Free', status: 'Pending', joined: 'Apr 1, 2026', lastSeen: 'Never', sosCount: 0, location: 'Hyderabad, TS' },
  { id: 'U007', name: 'Kavya Iyer', email: 'kavya@example.com', phone: '+91 32109 87654', plan: 'Premium', status: 'Active', joined: 'Apr 4, 2026', lastSeen: '10 min ago', sosCount: 1, location: 'Pune, MH' },
];

const SOS_ALERTS: SOSAlert[] = [
  { id: 'A001', user: 'Priya Sharma', type: 'Manual SOS', time: 'Apr 7, 2026 · 10:42 PM', location: 'Andheri West, Mumbai', status: 'Resolved', responders: 3 },
  { id: 'A002', user: 'Meera Patel', type: 'Voice Trigger', time: 'Apr 7, 2026 · 09:15 PM', location: 'SG Highway, Ahmedabad', status: 'Active', responders: 2 },
  { id: 'A003', user: 'Vikram Nair', type: 'Auto-Detect', time: 'Apr 6, 2026 · 11:30 PM', location: 'T Nagar, Chennai', status: 'Escalated', responders: 5 },
  { id: 'A004', user: 'Rahul Verma', type: 'Manual SOS', time: 'Apr 6, 2026 · 08:00 PM', location: 'Connaught Place, Delhi', status: 'False Alarm', responders: 1 },
  { id: 'A005', user: 'Kavya Iyer', type: 'Fall Detection', time: 'Apr 5, 2026 · 07:22 PM', location: 'Koregaon Park, Pune', status: 'Resolved', responders: 2 },
  { id: 'A006', user: 'Ananya Singh', type: 'Voice Trigger', time: 'Apr 5, 2026 · 06:45 PM', location: 'Indiranagar, Bengaluru', status: 'Resolved', responders: 4 },
];

const VAULT_ENTRIES: VaultEntry[] = [
  { id: 'V001', user: 'Priya Sharma', type: 'video', size: '18.7 MB', date: 'Apr 7, 2026', emergency: true },
  { id: 'V002', user: 'Meera Patel', type: 'audio', size: '1.2 MB', date: 'Apr 7, 2026', emergency: true },
  { id: 'V003', user: 'Vikram Nair', type: 'photo', size: '3.1 MB', date: 'Apr 6, 2026', emergency: true },
  { id: 'V004', user: 'Kavya Iyer', type: 'photo', size: '2.4 MB', date: 'Apr 5, 2026', emergency: false },
  { id: 'V005', user: 'Ananya Singh', type: 'audio', size: '0.9 MB', date: 'Apr 5, 2026', emergency: true },
  { id: 'V006', user: 'Rahul Verma', type: 'video', size: '22.3 MB', date: 'Apr 4, 2026', emergency: false },
];

// ── Helpers ───────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  Active: 'bg-green-500/15 text-green-400 border-green-500/25',
  Suspended: 'bg-red-500/15 text-red-400 border-red-500/25',
  Pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  Resolved: 'bg-green-500/15 text-green-400 border-green-500/25',
  'False Alarm': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  Escalated: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const alertTypeColors: Record<string, string> = {
  'Manual SOS': 'text-red-400',
  'Voice Trigger': 'text-purple-400',
  'Auto-Detect': 'text-blue-400',
  'Fall Detection': 'text-orange-400',
};

const planColors: Record<string, string> = {
  Free: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
  Premium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
};

// ── Sub-components ────────────────────────────────────────────

function OverviewTab() {
  const [liveStats, setLiveStats] = useState<any>(null);

  useEffect(() => {
    api.admin
      .getStats()
      .then((res) => {
        if (res.success && res.stats) {
          setLiveStats(res.stats);
        }
      })
      .catch(() => {});
  }, []);

  const stats: StatCard[] = [
    { label: 'Total Users', value: liveStats?.totalUsers ? String(liveStats.totalUsers) : '12,847', change: '+18.4%', up: true, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active SOS Today', value: liveStats?.activeSOS != null ? String(liveStats.activeSOS) : '34', change: '+6 from yesterday', up: true, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Evidence Files', value: liveStats?.evidenceFiles != null ? String(liveStats.evidenceFiles) : '9,312', change: '+241 this week', up: true, icon: Camera, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Avg Response Time', value: liveStats?.avgResponseTime || '1m 42s', change: '-12s improved', up: false, icon: Clock, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Premium Users', value: '4,203', change: '+9.1%', up: true, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'AI Predictions', value: '98.2%', change: '+0.4% accuracy', up: true, icon: Cpu, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  ];

  const recentActivity = [
    { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', text: 'SOS triggered by Meera Patel in Ahmedabad', time: '2 min ago' },
    { icon: UserCheck, color: 'text-green-400', bg: 'bg-green-500/10', text: 'New user registered: Arjun Reddy', time: '18 min ago' },
    { icon: Camera, color: 'text-purple-400', bg: 'bg-purple-500/10', text: 'Emergency video uploaded by Priya Sharma', time: '34 min ago' },
    { icon: CheckCircle, color: 'text-teal-400', bg: 'bg-teal-500/10', text: 'SOS alert A001 resolved successfully', time: '1 hr ago' },
    { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', text: 'AI risk zone updated: Andheri West flagged', time: '2 hr ago' },
    { icon: AlertOctagon, color: 'text-orange-400', bg: 'bg-orange-500/10', text: 'Alert A003 escalated to law enforcement', time: '3 hr ago' },
  ];

  const systemHealth = [
    { label: 'API Server', status: true, latency: '12ms' },
    { label: 'AI Engine', status: true, latency: '84ms' },
    { label: 'Location Service', status: true, latency: '23ms' },
    { label: 'Evidence Storage', status: true, latency: '45ms' },
    { label: 'SMS Gateway', status: false, latency: '—' },
    { label: 'Push Notifications', status: true, latency: '31ms' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' as const }}
            className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 hover:border-white/15 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? 'text-green-400' : 'text-blue-400'}`}>
                {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {s.change}
              </span>
            </div>
            <div className="text-white text-2xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Recent Activity</h3>
            <button className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg ${a.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <a.icon size={13} className={a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-xs leading-relaxed">{a.text}</p>
                  <p className="text-slate-600 text-[10px] mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>System Health</h3>
            <span className="flex items-center gap-1 text-green-400 text-[10px] font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              5/6 Online
            </span>
          </div>
          <div className="space-y-2.5">
            {systemHealth.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {s.status
                    ? <Wifi size={12} className="text-green-400" />
                    : <WifiOff size={12} className="text-red-400" />}
                  <span className="text-slate-300 text-xs">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px] font-mono">{s.latency}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${s.status ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="mt-5 pt-4 border-t border-white/6 grid grid-cols-2 gap-3">
            {[
              { label: 'Uptime', value: '99.97%', color: 'text-green-400' },
              { label: 'DB Size', value: '4.2 GB', color: 'text-blue-400' },
              { label: 'CPU', value: '23%', color: 'text-teal-400' },
              { label: 'Memory', value: '61%', color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/4 rounded-xl p-2.5 text-center">
                <div className={`text-sm font-bold ${s.color}`} style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</div>
                <div className="text-slate-500 text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOS Heatmap placeholder */}
      <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>SOS Activity — Last 7 Days</h3>
          <span className="text-slate-500 text-xs">Apr 1 – Apr 7, 2026</span>
        </div>
        <div className="flex items-end gap-2 h-24">
          {[18, 24, 31, 14, 42, 38, 34].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-red-600/60 to-red-400/40 border border-red-500/20 transition-all"
                style={{ height: `${(v / 42) * 100}%` }}
              />
              <span className="text-slate-600 text-[9px]">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [usersList, setUsersList] = useState<User[]>(USERS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    api.admin
      .getUsers()
      .then((res) => {
        if (res.success && Array.isArray(res.users) && res.users.length > 0) {
          const mapped: User[] = res.users.map((u: any, idx: number) => ({
            id: u.id || `U00${idx + 1}`,
            name: u.name || 'JanSuraksha User',
            email: u.email,
            phone: u.phone || '+91 98765 43210',
            plan: u.plan || (u.role === 'admin' ? 'Premium' : 'Free'),
            status: u.status || 'Active',
            joined: u.joinedDate || '2026',
            lastSeen: u.role === 'admin' ? 'Online Now' : 'Active Today',
            sosCount: u.sosCount || 0,
            location: u.location || 'India',
          }));
          setUsersList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = usersList.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Suspended', 'Pending'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterStatus === s ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white border border-white/8'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0d1b3e]/60 border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Last Seen</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">SOS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/4 hover:bg-white/3 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold flex items-center gap-2">
                          {user.name}
                          {user.email === 'ec23019@glbitm.ac.in' && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] px-1.5 py-0.2 rounded font-bold">ADMIN</span>
                          )}
                        </div>
                        <div className="text-slate-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      <MapPin size={10} />{user.location}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${planColors[user.plan]}`}>{user.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${statusColors[user.status]}`}>{user.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-slate-400 text-xs">{user.lastSeen}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs font-bold ${user.sosCount > 3 ? 'text-red-400' : 'text-slate-400'}`}>{user.sosCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedUser(user)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all" title="View">
                        <Eye size={13} />
                      </button>
                      <button className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all" title="Suspend">
                        <Ban size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/6 flex items-center justify-between">
          <span className="text-slate-500 text-xs">{filtered.length} of {usersList.length} users</span>
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setSelectedUser(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-md bg-[#0a0d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                  <h3 className="text-white font-bold" style={{ fontFamily: 'var(--font-heading)' }}>User Profile</h3>
                  <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-xl bg-white/8 text-slate-400 hover:text-white transition-all"><X size={15} /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white text-xl font-black">
                      {selectedUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{selectedUser.name}</div>
                      <div className="text-slate-400 text-sm">{selectedUser.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${planColors[selectedUser.plan]}`}>{selectedUser.plan}</span>
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${statusColors[selectedUser.status]}`}>{selectedUser.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'User ID', value: selectedUser.id },
                      { label: 'Phone', value: selectedUser.phone },
                      { label: 'Location', value: selectedUser.location },
                      { label: 'Joined', value: selectedUser.joined },
                      { label: 'Last Seen', value: selectedUser.lastSeen },
                      { label: 'SOS Count', value: String(selectedUser.sosCount) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/4 rounded-xl p-3">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-white text-sm font-semibold">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertsTab() {
  const [alertsList, setAlertsList] = useState<SOSAlert[]>(SOS_ALERTS);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.admin
      .getAlerts()
      .then((res) => {
        if (res.success && Array.isArray(res.alerts) && res.alerts.length > 0) {
          const mapped: SOSAlert[] = res.alerts.map((a: any, idx: number) => ({
            id: a.id || `A00${idx + 1}`,
            user: a.user || 'JanSuraksha User',
            type: a.type || 'Voice Trigger',
            time: a.time || 'Just now',
            location: a.location || 'Live Area',
            status: a.status || 'Active',
            responders: a.responders || 3,
          }));
          setAlertsList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = filter === 'All' ? alertsList : alertsList.filter(a => a.status === filter);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: String(alertsList.length), color: 'text-white', bg: 'bg-white/5' },
          { label: 'Active Now', value: String(alertsList.filter(a => a.status === 'Active' || a.status === 'Escalated').length), color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Resolved', value: String(alertsList.filter(a => a.status === 'Resolved').length), color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Escalated', value: String(alertsList.filter(a => a.status === 'Escalated').length), color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl ${s.bg} border border-white/8 text-center`}>
            <div className={`text-2xl font-black ${s.color}`} style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Active', 'Resolved', 'Escalated', 'False Alarm'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === f ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white border border-white/8'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filtered.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease: 'easeOut' as const }}
            className="p-4 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 hover:border-white/15 transition-colors group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.status === 'Active' ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/8'}`}>
                  <AlertTriangle size={16} className={alert.status === 'Active' ? 'text-red-400' : 'text-slate-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white text-sm font-semibold">{alert.user}</span>
                    <span className={`text-xs font-semibold ${alertTypeColors[alert.type]}`}>{alert.type}</span>
                    <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${statusColors[alert.status]}`}>{alert.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={10} />{alert.location}</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{alert.time}</span>
                    <span className="flex items-center gap-1"><Users size={10} />{alert.responders} responders</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(alert.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <MapPin size={12} /> View Map
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}



function VaultTab() {
  const typeIcon = { photo: Camera, video: Activity, audio: Mic };
  const typeColor = { photo: 'text-purple-400', video: 'text-blue-400', audio: 'text-green-400' };
  const typeBg = { photo: 'bg-purple-500/10', video: 'bg-blue-500/10', audio: 'bg-green-500/10' };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Files', value: '9,312', icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Storage Used', value: '48.2 GB', icon: Server, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Emergency Files', value: '6,841', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div>
              <div className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* File list */}
      <div className="rounded-2xl bg-[#0d1b3e]/60 border border-white/8 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Recent Evidence Files</h3>
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors">
            <Filter size={11} /> Filter
          </button>
        </div>
        <div className="divide-y divide-white/4">
          {VAULT_ENTRIES.map((entry, i) => {
            const Icon = typeIcon[entry.type];
            return (
              <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/3 transition-colors group">
                <div className={`w-9 h-9 rounded-xl ${typeBg[entry.type]} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={15} className={typeColor[entry.type]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">{entry.user}</span>
                    {entry.emergency && (
                      <span className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 text-[9px] text-red-400 font-semibold">
                        <AlertTriangle size={8} />EMERGENCY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs mt-0.5">
                    <span className="capitalize">{entry.type}</span>
                    <span>{entry.size}</span>
                    <span className="flex items-center gap-1"><Clock size={9} />{entry.date}</span>
                    <span className="flex items-center gap-1 text-green-400/70"><Lock size={9} />Encrypted</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Eye size={13} /></button>
                  <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Download size={13} /></button>
                  <button className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"><Trash2 size={13} /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [notifications, setNotifications] = useState(true);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [aiPrediction, setAiPrediction] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} className="transition-all">
      {value
        ? <ToggleRight size={28} className="text-red-400" />
        : <ToggleLeft size={28} className="text-slate-600" />}
    </button>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      {/* General */}
      <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
        <h3 className="text-white font-bold text-sm mb-4" style={{ fontFamily: 'var(--font-heading)' }}>General Settings</h3>
        <div className="space-y-4">
          {[
            { label: 'Push Notifications', desc: 'Send push alerts for new SOS events', value: notifications, onChange: setNotifications },
            { label: 'Auto-Escalate Alerts', desc: 'Automatically escalate unresolved SOS after 5 minutes', value: autoEscalate, onChange: setAutoEscalate },
            { label: 'AI Risk Prediction', desc: 'Enable AI-powered safety zone risk scoring', value: aiPrediction, onChange: setAiPrediction },
            { label: 'Maintenance Mode', desc: 'Temporarily disable user access for maintenance', value: maintenanceMode, onChange: setMaintenanceMode },
            { label: 'Two-Factor Auth (Admin)', desc: 'Require 2FA for all admin logins', value: twoFactor, onChange: setTwoFactor },
          ].map(({ label, desc, value, onChange }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <div>
                <div className="text-white text-sm font-semibold">{label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
              </div>
              <Toggle value={value} onChange={onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* Admin Credentials */}
      <div className="p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8">
        <h3 className="text-white font-bold text-sm mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Admin Credentials</h3>
        <div className="space-y-3">
          {[
            { label: 'Admin Email', placeholder: 'admin@jansuraksha.ai', icon: Mail, type: 'email' },
            { label: 'Current Password', placeholder: '••••••••••••', icon: Key, type: 'password' },
            { label: 'New Password', placeholder: 'Enter new password', icon: Key, type: 'password' },
          ].map(({ label, placeholder, icon: Icon, type }) => (
            <div key={label}>
              <label className="text-slate-400 text-xs font-semibold mb-1.5 block">{label}</label>
              <div className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={type}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
        <h3 className="text-red-400 font-bold text-sm mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Danger Zone</h3>
        <div className="space-y-3">
          {[
            { label: 'Clear All SOS Logs', desc: 'Permanently delete all resolved SOS records', btnLabel: 'Clear Logs' },
            { label: 'Reset AI Model', desc: 'Reset AI safety prediction model to defaults', btnLabel: 'Reset Model' },
            { label: 'Wipe Evidence Vault', desc: 'Delete all evidence files older than 90 days', btnLabel: 'Wipe Old Files' },
          ].map(({ label, desc, btnLabel }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <div>
                <div className="text-white text-sm font-semibold">{label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
              </div>
              <button className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-semibold transition-all flex-shrink-0">
                {btnLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25'}`}
      >
        {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
      </button>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users, badge: '12.8K' },
    { id: 'alerts', label: 'SOS Alerts', icon: AlertTriangle, badge: '2' },
    { id: 'vault', label: 'Evidence Vault', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const tabTitles: Record<AdminTab, string> = {
    overview: 'Overview',
    users: 'User Management',
    alerts: 'SOS Alerts',
    vault: 'Evidence Vault',
    settings: 'System Settings',
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? 'w-full' : 'w-56 flex-shrink-0'} flex flex-col`}>
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-black" style={{ fontFamily: 'var(--font-heading)' }}>JanSuraksha</div>
            <div className="text-red-400 text-[10px] font-semibold uppercase tracking-wider">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === id ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' : 'text-slate-400 hover:text-white hover:bg-white/6'}`}
          >
            <Icon size={16} />
            <span className="flex-1 text-left">{label}</span>
            {badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${activeTab === id ? 'bg-white/20 text-white' : id === 'alerts' ? 'bg-red-500/20 text-red-400' : 'bg-white/8 text-slate-400'}`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        <Link to="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/6 text-sm font-semibold transition-all">
          <Globe size={16} />
          View Site
        </Link>
        <Link to="/login" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/8 text-sm font-semibold transition-all">
          <LogOut size={16} />
          Sign Out
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <title>Admin Panel — JanSuraksha AI</title>
      <meta name="description" content="JanSuraksha AI admin panel — manage users, SOS alerts, evidence vault, and system settings." />

      <div className="min-h-screen bg-[#060912] flex pt-16">

        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col bg-[#0a0d1a] border-r border-white/8 fixed left-0 top-16 bottom-0 w-56 z-30">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
              <motion.div initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                transition={{ duration: 0.25, ease: 'easeOut' as const }}
                className="fixed left-0 top-0 bottom-0 w-56 bg-[#0a0d1a] border-r border-white/8 z-50 md:hidden flex flex-col">
                <Sidebar mobile />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 md:ml-56 flex flex-col min-h-full">
          {/* Top bar */}
          <div className="sticky top-16 z-20 bg-[#060912]/90 backdrop-blur-md border-b border-white/8 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl bg-white/6 text-slate-400 hover:text-white transition-all">
                <Menu size={16} />
              </button>
              <div>
                <h1 className="text-white font-black text-lg leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                  {tabTitles[activeTab]}
                </h1>
                <p className="text-slate-500 text-xs mt-0.5">JanSuraksha AI · Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-xl bg-white/6 text-slate-400 hover:text-white transition-all">
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                A
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' as const }}
              >
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'alerts' && <AlertsTab />}
                {activeTab === 'vault' && <VaultTab />}
                {activeTab === 'settings' && <SettingsTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

