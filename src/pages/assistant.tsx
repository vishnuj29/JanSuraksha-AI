import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Send, Mic, Shield, AlertTriangle, MapPin, Users,
  Zap, ChevronRight, ThumbsUp, ThumbsDown, Copy, CheckCircle,
  Navigation, Clock, Star, TrendingUp, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api-client';
import { locationService } from '../lib/locationService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  typing?: boolean;
}

const QUICK_PROMPTS = [
  { icon: MapPin, label: 'Is my area safe right now?', color: 'text-blue-400' },
  { icon: Navigation, label: 'Suggest a safe route home', color: 'text-green-400' },
  { icon: AlertTriangle, label: 'What to do in an emergency?', color: 'text-red-400' },
  { icon: Users, label: 'How to use community rescue?', color: 'text-teal-400' },
  { icon: Mic, label: 'Set up voice trigger word', color: 'text-purple-400' },
  { icon: Shield, label: 'Improve my safety score', color: 'text-orange-400' },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: `Hello! I am your **JanSuraksha AI Safety Assistant**, actively monitoring safety telemetry in your area.\n\nI can provide:\n- Real-time threat assessments for your location\n- Well-lit and CCTV-monitored safe transit routes\n- Emergency action protocols and drills\n- Tips to optimize your personal safety score\n\nHow can I help protect you today?`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput('');
    setLoading(true);

    const loc = locationService.getLocationState();

    try {
      const res = await api.assistant.chat({
        message: textToSend.trim(),
        location: {
          city: loc.address.city,
          address: loc.address.formattedAddress,
        },
        coordinates: loc.coords,
      });

      const assistantMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: res.reply || 'I am currently monitoring your safety. Please stay on main well-lit routes.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: `⚠️ Safety guidance is offline. Remember that national emergency assistance is available at **112** and **1091** (Women Helpline).`,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Guidance copied to clipboard');
  };

  return (
    <>
      <title>AI Safety Assistant — JanSuraksha AI</title>
      <meta name="description" content="24/7 intelligent safety advisor for real-time risk assessment, route navigation, and emergency protocols." />

      <div className="pt-20 pb-24 px-4 min-h-screen flex flex-col">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pt-4 border-b border-white/8 pb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  JanSuraksha AI Assistant
                </h1>
                <span className="bg-green-500/15 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Active Telemetry
                </span>
              </div>
              <p className="text-slate-400 text-xs">Real-time crime analytics & personalized safety guidance</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1" style={{ minHeight: '40vh' }}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm ${
                    m.role === 'user'
                      ? 'bg-red-600 text-white rounded-br-none shadow-lg shadow-red-600/20'
                      : 'bg-[#0d1b3e]/80 border border-white/10 text-slate-200 rounded-bl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                    {m.text}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10 text-[10px] text-slate-400">
                    <span>{m.time}</span>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => copyText(m.text)}
                        className="hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Copy"
                      >
                        <Copy size={11} /> Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Bot size={15} />
                </div>
                <div className="bg-[#0d1b3e]/80 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-slate-400 text-xs ml-1">Analyzing safety data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSend(p.label)}
                className="flex items-center gap-2 bg-[#0d1b3e]/60 hover:bg-[#0d1b3e] border border-white/8 hover:border-white/20 p-2.5 rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all truncate cursor-pointer"
              >
                <p.icon size={13} className={`${p.color} flex-shrink-0`} />
                <span className="truncate">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask safety assistant anything about your area, route, or emergency steps..."
              className="w-full bg-[#0d1b3e]/90 border border-white/12 rounded-2xl pl-4 pr-12 py-3.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 shadow-xl"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
