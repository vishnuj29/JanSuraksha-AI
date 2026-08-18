import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <title>Contact — JanSuraksha AI</title>
      <meta name="description" content="Get in touch with the JanSuraksha AI team for support, partnerships, or inquiries." />

      <section className="pt-28 pb-20 px-4 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-red-300 text-xs font-semibold tracking-wider uppercase">Get In Touch</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Contact Us
            </h1>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">
              Have questions? We're here to help. Reach out to our team anytime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' as const }}
              className="lg:col-span-2 flex flex-col gap-4"
            >
              {[
                { icon: Mail, label: 'Email', value: 'support@jansuraksha.ai', href: 'mailto:support@jansuraksha.ai' },
                { icon: Phone, label: 'Phone', value: '1800-000-0000 (Toll Free)', href: 'tel:+911800000000' },
                { icon: MapPin, label: 'Address', value: 'New Delhi, India', href: '#' },
              ].map(({ icon: Icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 hover:border-white/15 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-red-400" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-1">{label}</div>
                    <div className="text-white text-sm font-medium">{value}</div>
                  </div>
                </a>
              ))}

              <div className="p-5 rounded-2xl bg-red-600/10 border border-red-500/20 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={16} className="text-red-400" />
                  <span className="text-white text-sm font-semibold">Emergency Support</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  For life-threatening emergencies, always call 112 (India Emergency Services) first.
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' as const }}
              className="lg:col-span-3"
            >
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center p-10 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                    <Send size={24} className="text-green-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Message Sent!</h3>
                  <p className="text-slate-400 text-sm">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[#0d1b3e]/60 border border-white/8 flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1.5 block">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-medium mb-1.5 block">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="How can we help?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block">Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell us more..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/25 text-sm"
                  >
                    <Send size={15} />
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

