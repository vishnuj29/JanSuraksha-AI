import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Plus, Phone, MessageSquare, MapPin, Shield, AlertTriangle,
  Trash2, Edit3, CheckCircle, X, Star, Bell, Mic,
  ChevronDown, ChevronUp, Search, UserCheck, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api-client';

type Relation = 'Family' | 'Friend' | 'Colleague' | 'Neighbor' | 'Other';
type NotifyLevel = 'always' | 'sos_only' | 'never';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: Relation;
  isPrimary: boolean;
  notifyLevel: NotifyLevel;
  shareLocation: boolean;
  verified: boolean;
  avatar: string;
}

const RELATION_OPTIONS: Relation[] = ['Family', 'Friend', 'Colleague', 'Neighbor', 'Other'];

const NOTIFY_LABELS: Record<NotifyLevel, { label: string; desc: string; color: string }> = {
  always: { label: 'Always', desc: 'All alerts & location updates', color: 'text-green-400' },
  sos_only: { label: 'SOS Only', desc: 'Only during emergencies', color: 'text-yellow-400' },
  never: { label: 'Never', desc: 'No notifications sent', color: 'text-slate-400' },
};

const RELATION_COLORS: Record<Relation, string> = {
  Family: 'bg-red-500/15 text-red-400 border-red-500/20',
  Friend: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Colleague: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Neighbor: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  Other: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

interface FormState {
  name: string;
  phone: string;
  relation: Relation;
  notifyLevel: NotifyLevel;
  shareLocation: boolean;
  isPrimary?: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  relation: 'Family',
  notifyLevel: 'always',
  shareLocation: true,
  isPrimary: false,
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await api.contacts.getAll();
      if (res.success && Array.isArray(res.contacts)) {
        setContacts(res.contacts);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (c: Contact) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      relation: c.relation,
      notifyLevel: c.notifyLevel,
      shareLocation: c.shareLocation,
      isPrimary: c.isPrimary,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        const res = await api.contacts.update({
          id: editingId,
          ...form,
        });
        if (res.success) {
          setContacts((prev) => prev.map((c) => (c.id === editingId ? res.contact : c)));
          toast.success('Contact updated successfully');
        }
      } else {
        const res = await api.contacts.add(form);
        if (res.success) {
          setContacts((prev) => [res.contact, ...prev]);
          toast.success('Emergency contact added');
        }
      }
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.contacts.delete(id);
      if (res.success) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        toast.success('Contact removed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete contact');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSendTestAlert = async (c: Contact) => {
    try {
      await api.sos.trigger({
        phone: c.phone,
        message: `[TEST ALERT] Hi ${c.name}, this is a test notification from JanSuraksha AI. Your contact is verified for emergency alerts.`,
        triggerWord: 'Test Notification',
      });
      toast.success(`Test verification dispatched to ${c.name} (${c.phone})`);
    } catch (err: any) {
      toast.error('Failed to send test alert');
    }
  };

  return (
    <>
      <title>Emergency Contacts — JanSuraksha AI</title>
      <meta name="description" content="Manage your trusted emergency contacts for instant automatic SOS alerts." />

      <div className="pt-20 pb-24 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pt-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-2">
                <Users size={12} className="text-blue-400" />
                <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">
                  Safety Network
                </span>
              </div>
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Emergency Contacts
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                These trusted contacts will receive immediate WhatsApp & SMS alerts with your live location during an SOS.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-600/25 text-sm cursor-pointer"
            >
              <Plus size={16} />
              Add Contact
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name or phone..."
              className="w-full bg-[#0d1b3e]/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* Contact List */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-[#0d1b3e]/40 border border-white/8 rounded-2xl p-8">
              <Users size={36} className="mx-auto text-slate-600 mb-3" />
              <h3 className="text-white font-semibold text-base mb-1">No emergency contacts found</h3>
              <p className="text-slate-400 text-xs mb-4">Add your close family members and friends to stay protected.</p>
              <button
                onClick={openAdd}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs"
              >
                Add Your First Contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0d1b3e]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                          {c.avatar || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-base">{c.name}</span>
                            {c.isPrimary && (
                              <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                Primary
                              </span>
                            )}
                          </div>
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border mt-0.5 ${RELATION_COLORS[c.relation] || RELATION_COLORS.Family}`}>
                            {c.relation}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          title="Edit contact"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                          title="Delete contact"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                      <div className="flex items-center gap-2 font-mono text-slate-300">
                        <Phone size={12} className="text-slate-500" />
                        {c.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell size={12} className="text-slate-500" />
                        <span>Notification: <strong className={NOTIFY_LABELS[c.notifyLevel]?.color}>{NOTIFY_LABELS[c.notifyLevel]?.label}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-slate-500" />
                        <span>Live Location Sharing: <strong className={c.shareLocation ? 'text-green-400' : 'text-slate-500'}>{c.shareLocation ? 'Enabled' : 'Disabled'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendTestAlert(c)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={12} />
                    Send Test Alert
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 16 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 16 }}
                  className="bg-[#0d1b3e] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {editingId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                    </h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSave} className="flex flex-col gap-4">
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1 block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Priya Sharma"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1 block">Phone Number (with country code)</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-xs font-medium mb-1 block">Relationship</label>
                        <select
                          value={form.relation}
                          onChange={(e) => setForm({ ...form, relation: e.target.value as Relation })}
                          className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500/50"
                        >
                          {RELATION_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 text-xs font-medium mb-1 block">Notify Level</label>
                        <select
                          value={form.notifyLevel}
                          onChange={(e) => setForm({ ...form, notifyLevel: e.target.value as NotifyLevel })}
                          className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="always">Always (All Alerts)</option>
                          <option value="sos_only">SOS Emergency Only</option>
                          <option value="never">Never</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="shareLoc"
                        checked={form.shareLocation}
                        onChange={(e) => setForm({ ...form, shareLocation: e.target.checked })}
                        className="rounded bg-white/5 border-white/20"
                      />
                      <label htmlFor="shareLoc" className="text-slate-300 text-xs cursor-pointer">
                        Share live GPS coordinates during emergency
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPrimary"
                        checked={form.isPrimary}
                        onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                        className="rounded bg-white/5 border-white/20"
                      />
                      <label htmlFor="isPrimary" className="text-slate-300 text-xs cursor-pointer">
                        Mark as Primary Emergency Contact
                      </label>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30"
                      >
                        {submitting ? 'Saving...' : editingId ? 'Update Contact' : 'Save Contact'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-[#0d1b3e] border border-white/15 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl"
                >
                  <AlertTriangle size={36} className="text-red-400 mx-auto mb-3" />
                  <h3 className="text-white font-bold text-base mb-1">Remove Emergency Contact?</h3>
                  <p className="text-slate-400 text-xs mb-5">
                    This person will no longer receive distress alerts when you trigger an SOS.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteId(null)}
                      className="flex-1 bg-white/5 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteId)}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-xs font-bold"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
