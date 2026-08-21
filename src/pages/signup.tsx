import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api-client';
import { useAuthStore } from '../lib/authStore';

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Form State
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [useOtpVerification, setUseOtpVerification] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  // OTP State
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, resendCountdown]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Direct Signup or Request Email OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!agreed) {
      toast.error('Please agree to the Terms of Service & Privacy Policy');
      return;
    }

    setLoading(true);

    // Send real SMTP Email OTP (Mandatory verification)
    try {
      const response = await api.auth.registerInitiate({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      });

      if (response.success) {
        toast.success(response.message || `Verification code sent to ${email}!`);
        setStep('otp');
        setResendCountdown(60);
        setOtpValues(['', '', '', '', '', '']);
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration initiate error:', err);
      toast.error(err.message || 'Failed to dispatch verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpValues];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpValues(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');

    if (fullOtp.length !== 6) {
      toast.error('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.registerVerify({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      });

      if (response.success && response.token) {
        setAuth(response.user, response.token);
        toast.success('Account verified & created successfully! Welcome to JanSuraksha AI.');
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Invalid verification code');
      }
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      toast.error(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resending) return;

    setResending(true);
    try {
      const response = await api.auth.registerResendOtp({
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        toast.success('A fresh 6-digit verification code has been dispatched to your email.');
        setResendCountdown(60);
        setOtpValues(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        toast.error(response.message || 'Failed to resend code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <title>Create Account — JanSuraksha AI</title>
      <meta name="description" content="Create your JanSuraksha AI account and activate your personal AI-powered safety network." />

      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0a0a0f]">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-red-900/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[300px] bg-blue-900/10 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-signup" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-signup)" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/40">
                <Shield className="text-white" size={20} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  JanSuraksha
                </span>
                <span className="text-red-400 text-[10px] font-bold tracking-widest uppercase">AI ENTERPRISE</span>
              </div>
            </Link>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {step === 'form' ? 'Create your account' : 'Verify your email'}
            </h1>
            <p className="text-slate-400 text-sm text-center">
              {step === 'form'
                ? 'Join India’s smart emergency & AI safety network'
                : `We sent a 6-digit verification code to ${email}`}
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#0d1b3e]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-8 shadow-2xl">
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.form
                  key="form-step"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  {/* Security notice */}
                  <div className="flex items-center gap-2.5 bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    <span className="text-green-300 text-xs font-semibold">
                      Connected with Live SMTP Email Verification & 256-Bit SSL
                    </span>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1.5 block">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1.5 block">Phone Number (Emergency Broadcast)</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1.5 block">Confirm Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Verification Mode Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Mail size={14} className="text-red-400" /> Verify with Email OTP Code:
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseOtpVerification(!useOtpVerification)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        useOtpVerification ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {useOtpVerification ? 'ON (Email Code)' : 'OFF (Instant Sign Up)'}
                    </button>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAgreed(!agreed)}
                      className={`w-4.5 h-4.5 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                        agreed ? 'bg-red-600 border-red-600' : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {agreed && <CheckCircle size={11} className="text-white" />}
                    </button>
                    <span className="text-slate-400 text-xs leading-relaxed font-medium">
                      I agree to the{' '}
                      <span className="text-red-400 font-semibold">Terms of Service</span> and{' '}
                      <span className="text-red-400 font-semibold">Privacy Policy</span>
                    </span>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !agreed}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/25 text-sm mt-1 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : useOtpVerification ? (
                      <>
                        <Mail size={16} />
                        Get Email Verification Code
                        <ArrowRight size={16} />
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Create Account & Enter Dashboard
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-slate-400 text-sm mt-1">
                    Already have an account?{' '}
                    <Link to="/login" className="text-red-400 hover:text-red-300 font-bold transition-colors">
                      Sign In
                    </Link>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-step"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleVerifyOtp}
                  className="flex flex-col gap-5"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/8 font-medium">
                    <Mail size={16} className="text-red-400 flex-shrink-0" />
                    <span>
                      6-digit security code dispatched to <strong className="text-white">{email}</strong>
                    </span>
                  </div>

                  {/* 6-Digit OTP Box inputs */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-3 block text-center">
                      Verification Code
                    </label>
                    <div className="flex justify-between gap-2 sm:gap-2.5">
                      {otpValues.map((val, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={val}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white/5 border border-white/15 focus:border-red-500 focus:bg-white/10 rounded-xl text-white outline-none transition-all font-mono"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend button */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={13} />
                      Edit Details
                    </button>

                    <button
                      type="button"
                      disabled={resendCountdown > 0 || resending}
                      onClick={handleResendOtp}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                      {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend Code'}
                    </button>
                  </div>

                  {/* Submit OTP */}
                  <button
                    type="submit"
                    disabled={loading || otpValues.join('').length !== 6}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/25 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound size={15} />
                        Verify & Activate Account
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-5 mt-6">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <Lock size={12} />
              Secure 256-bit Encryption
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <Shield size={12} />
              24/7 AI Threat Radar
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
