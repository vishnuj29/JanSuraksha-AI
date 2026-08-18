import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowRight, RefreshCw, KeyRound, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api-client';
import { useAuthStore } from '../lib/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (otpStep && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpStep, resendTimer]);

  // Direct Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success && response.token) {
        setAuth(response.user, response.token);
        toast.success(`Welcome back, ${response.user?.name || 'User'}!`);
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Invalid email or password');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Initiate OTP Login (Optional 2FA)
  const handleOtpInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.loginInitiate({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success) {
        setOtpStep(true);
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        toast.success(response.message || 'Verification code sent to your email inbox');

        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 200);
      } else {
        toast.error(response.message || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('OTP login initiate error:', err);
      toast.error(err.message || 'Failed to dispatch verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (i < 6) newOtp[i] = d;
        });
        setOtp(newOtp);
        const nextIndex = Math.min(digits.length, 5);
        otpInputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter the full 6-digit security code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.loginVerify({
        email: email.trim().toLowerCase(),
        otp: otpString,
      });

      if (response.success && response.token) {
        setAuth(response.user, response.token);
        toast.success('Login verified! Welcome back to JanSuraksha AI.');
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Invalid OTP code');
      }
    } catch (err: any) {
      console.error('Verify error:', err);
      toast.error(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);

    try {
      const response = await api.auth.resendOtp({ email: email.trim().toLowerCase() });
      if (response.success) {
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        toast.success('A new 6-digit verification code has been dispatched to your email.');
        otpInputRefs.current[0]?.focus();
      } else {
        toast.error(response.message || 'Failed to resend code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <title>Sign In — JanSuraksha AI</title>
      <meta name="description" content="Sign in to your JanSuraksha AI account and stay protected." />

      <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0a0a0f]">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-900/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-blue-900/10 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-login" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-login)" />
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
              {otpStep ? 'Verify Security Code' : 'Welcome back'}
            </h1>
            <p className="text-slate-400 text-sm text-center">
              {otpStep
                ? `Enter the 6-digit code sent to ${email}`
                : 'Sign in to access your AI safety shield and satellite radar'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#0d1b3e]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-8 shadow-2xl">
            <AnimatePresence mode="wait">
              {!otpStep ? (
                <motion.form
                  key="password-login"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  onSubmit={mode === 'password' ? handlePasswordLogin : handleOtpInitiate}
                  className="flex flex-col gap-5"
                >
                  {/* Security notice */}
                  <div className="flex items-center gap-2.5 bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    <span className="text-green-300 text-xs font-semibold">
                      Direct Password Sign-In & 256-Bit SSL Protection
                    </span>
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
                        placeholder="Enter your registered email"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-400 text-xs font-bold">Password</label>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
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

                  {/* Remember me */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRemember(!remember)}
                      className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                        remember ? 'bg-red-600 border-red-600' : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {remember && <CheckCircle size={10} className="text-white" />}
                    </button>
                    <span className="text-slate-400 text-xs font-semibold">Keep me authenticated on this device</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/25 text-sm mt-1 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn size={16} />
                        Sign In Directly
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-slate-500 text-xs font-semibold">or</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>

                  {/* Toggle between Direct Password & Email OTP */}
                  <button
                    type="button"
                    onClick={() => {
                      if (mode === 'password') {
                        setMode('otp');
                        toast.info('Switched to 2-Factor Email OTP authentication');
                      } else {
                        setMode('password');
                        toast.info('Switched to Direct Password authentication');
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 text-center font-bold transition-colors cursor-pointer"
                  >
                    {mode === 'password'
                      ? 'Prefer 2-Factor Email Code? Click here'
                      : 'Switch back to Direct Password Sign-In'}
                  </button>

                  {/* Sign up link */}
                  <p className="text-center text-slate-400 text-sm mt-2 font-medium">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-red-400 hover:text-red-300 font-bold transition-colors">
                      Create Account
                    </Link>
                  </p>
                </motion.form>
              ) : (
                /* OTP Step */
                <motion.form
                  key="otp-login"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleVerifyOtp}
                  className="flex flex-col gap-5"
                >
                  <div className="flex items-center gap-2.5 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
                    <Mail size={14} className="text-blue-400 flex-shrink-0" />
                    <span className="text-blue-300 text-xs">
                      6-digit code dispatched to <strong>{email}</strong>
                    </span>
                  </div>

                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpInputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center bg-white/5 border border-white/10 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all font-mono"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/25 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield size={15} />
                        Verify & Enter Dashboard
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                    >
                      ← Back to password login
                    </button>

                    <button
                      type="button"
                      disabled={!canResend || loading}
                      onClick={handleResendOtp}
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        canResend
                          ? 'text-red-400 hover:text-red-300 cursor-pointer'
                          : 'text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                      {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-5 mt-6">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <Lock size={12} />
              End-to-End Encrypted
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
