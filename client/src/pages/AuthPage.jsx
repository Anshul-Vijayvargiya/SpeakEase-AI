import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Mail, Lock, User, School, GraduationCap,
  ArrowRight, Loader2, Eye, EyeOff, CheckCircle2,
  Mic, Brain, TrendingUp, Award
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

/* ─────────────── Particle Background ─────────────── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.4,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

/* ─────────────── Features List ─────────────── */
const features = [
  { icon: Mic,        text: 'AI-powered voice interview practice' },
  { icon: Brain,      text: 'Real-time feedback & smart coaching' },
  { icon: TrendingUp, text: 'Track progress across every session' },
  { icon: Award,      text: 'Land your dream job faster' },
];

/* ─────────────── Google SVG Icon ─────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ─────────────── Input Field ─────────────── */
const InputField = ({ icon: Icon, type = 'text', name, placeholder, value, onChange, required, rightSlot }) => (
  <div className="relative group">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors duration-200">
      <Icon className="w-[18px] h-[18px]" />
    </span>
    <input
      id={`auth-${name}`}
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={onChange}
      autoComplete={name === 'password' ? 'current-password' : name === 'email' ? 'email' : 'off'}
      className="
        w-full bg-white/[0.04] border border-white/10
        rounded-xl py-3.5 pl-11 pr-12
        text-sm font-medium text-white placeholder-slate-500
        outline-none transition-all duration-200
        focus:border-violet-500/60 focus:bg-violet-500/[0.05] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]
      "
    />
    {rightSlot && (
      <span className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</span>
    )}
  </div>
);

/* ─────────────── Divider ─────────────── */
const Divider = ({ label }) => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-white/10" />
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <div className="flex-1 h-px bg-white/10" />
  </div>
);

/* ═══════════════ MAIN PAGE ═══════════════ */
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', college: '', yearOfStudy: '1st Year',
  });

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const switchMode = (mode) => {
    setIsLogin(mode);
    setShowPassword(false);
  };

  /* ── Email / Password submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      const res = await login(formData.email, formData.password);
      if (res.success) { toast.success('Welcome back! 🎉'); navigate('/dashboard'); }
      else toast.error(res.message);
    } else {
      const res = await signup(formData);
      if (res.success) { toast.success('Account created! 🚀'); navigate('/dashboard'); }
      else toast.error(res.message);
    }
  };

  /* ── Google OAuth ── */
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      // Send idToken to backend for verification & session setup
      const { default: API } = await import('../api');
      const res = await API.post('/auth/google', { idToken });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      useAuthStore.setState({ user, token, isAuthenticated: true });
      toast.success(`Welcome, ${user.name || result.user.displayName}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ────────────── RENDER ────────────── */
  return (
    <div className="min-h-screen flex bg-[#09090f]">

      {/* ═══ LEFT PANEL (hidden on mobile) ═══ */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/70 via-indigo-900/50 to-[#09090f]" />
        <div className="absolute top-[-120px] left-[-80px] w-[420px] h-[420px] rounded-full bg-violet-600/30 blur-[90px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-80px] right-[-60px] w-[340px] h-[340px] rounded-full bg-indigo-500/20 blur-[80px] animate-[pulse_10s_ease-in-out_2s_infinite]" />
        <ParticleCanvas />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">SpeakEase AI</span>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping inline-block" />
              AI Interview Coach
            </div>
            <h1 className="text-5xl font-black text-white leading-tight">
              Ace every<br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                interview
              </span>{' '}with<br />
              confidence.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              Practice with an AI that gives you real feedback — just like the real thing, but without the pressure.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {features.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-3 text-slate-300 text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-violet-400" />
                </span>
                {text}
              </motion.li>
            ))}
          </motion.ul>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {['AK', 'SR', 'MJ', 'PV'].map((initials, i) => (
                <div
                  key={initials}
                  className="w-8 h-8 rounded-full border-2 border-[#09090f] flex items-center justify-center text-[10px] font-bold"
                  style={{ background: `hsl(${240 + i * 30},60%,50%)` }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs">
              <span className="text-white font-semibold">2,400+</span> students landed their dream jobs
            </p>
          </motion.div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Subtle bg glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[260px] h-[260px] rounded-full bg-indigo-600/10 blur-[90px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-extrabold text-lg">SpeakEase AI</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-1.5">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isLogin
                ? 'Sign in to continue your interview prep journey'
                : 'Join thousands of students acing their interviews'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex p-1 bg-white/[0.04] border border-white/[0.07] rounded-xl mb-7">
            {[['Login', true], ['Sign Up', false]].map(([label, val]) => (
              <button
                key={label}
                onClick={() => switchMode(val)}
                className={`
                  flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-250
                  ${isLogin === val
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-slate-400 hover:text-slate-200'}
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Google button */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="
              w-full flex items-center justify-center gap-3
              bg-white/[0.06] hover:bg-white/[0.10] border border-white/10
              text-white text-sm font-semibold
              py-3.5 rounded-xl mb-5
              transition-all duration-200 disabled:opacity-50
            "
          >
            {googleLoading
              ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              : <><GoogleIcon /><span>Continue with Google</span></>
            }
          </motion.button>

          <Divider label="or continue with email" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-4 overflow-hidden"
                >
                  <InputField
                    icon={User} name="name" placeholder="Full Name"
                    value={formData.name} onChange={handleChange} required={!isLogin}
                  />
                  <InputField
                    icon={School} name="college" placeholder="College / University"
                    value={formData.college} onChange={handleChange} required={!isLogin}
                  />
                  {/* Year select */}
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors">
                      <GraduationCap className="w-[18px] h-[18px]" />
                    </span>
                    <select
                      id="auth-yearOfStudy"
                      name="yearOfStudy"
                      value={formData.yearOfStudy}
                      onChange={handleChange}
                      className="
                        w-full bg-[#09090f] border border-white/10
                        rounded-xl py-3.5 pl-11 pr-6
                        text-sm font-medium text-white
                        outline-none transition-all duration-200 appearance-none cursor-pointer
                        focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]
                      "
                    >
                      {['1st Year','2nd Year','3rd Year','4th Year','Graduated'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              icon={Mail} type="email" name="email" placeholder="Email Address"
              value={formData.email} onChange={handleChange} required
            />
            <InputField
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Forgot password (login only) */}
            <AnimatePresence>
              {isLogin && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-right -mt-1"
                >
                  <button
                    type="button"
                    className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || googleLoading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className="
                w-full flex items-center justify-center gap-2
                bg-gradient-to-r from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white font-bold text-sm
                py-4 rounded-xl mt-1
                transition-all duration-200
                shadow-xl shadow-violet-600/30
              "
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch mode link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              onClick={() => switchMode(!isLogin)}
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              {isLogin ? 'Sign up for free' : 'Sign in'}
            </button>
          </p>

          {/* Trust badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-600 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
            Secure login · Your data is encrypted
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
