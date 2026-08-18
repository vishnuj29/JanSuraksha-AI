import { Link } from 'react-router-dom';
import { Shield, Twitter, Linkedin, Instagram, Mail, Phone } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Emergency SOS', href: '/emergency' },
    { label: 'Live Tracking', href: '/tracking' },
    { label: 'AI Assistant', href: '/ai-assistant' },
  ],
  company: [
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/30">
                <Shield className="text-white" size={18} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-base tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  JanSuraksha
                </span>
                <span className="text-red-400 text-[10px] font-semibold tracking-widest uppercase">AI</span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              Your Safety, Powered by AI. Real-time emergency response, voice detection, and intelligent risk prediction — protecting lives 24/7.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              <a href="mailto:support@jansuraksha.ai" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                <Mail size={14} className="text-red-500" />
                support@jansuraksha.ai
              </a>
              <a href="tel:+911800000000" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                <Phone size={14} className="text-red-500" />
                1800-000-0000 (Toll Free)
              </a>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-600/20 border border-white/8 hover:border-red-500/40 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all duration-200"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Product</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Company</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            © 2026 JanSuraksha AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-500 text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

