import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Zap, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('This reset link is invalid or has expired.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Password updated! You can now sign in.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090f] p-6 relative">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[260px] h-[260px] rounded-full bg-indigo-600/10 blur-[90px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-extrabold text-lg">SpeakEase AI</span>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          {!token ? (
            <p className="text-sm text-slate-400 text-center">
              This reset link is invalid or has expired. Please request a new one from the login page.
            </p>
          ) : done ? (
            <div className="text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-black text-white mb-2">Password updated</h2>
              <p className="text-sm text-slate-400 mb-6">Your password has been reset successfully.</p>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm py-3 rounded-xl transition-all duration-200"
              >
                Go to sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-white mb-1.5">Set a new password</h2>
              <p className="text-sm text-slate-400 mb-5">Choose a new password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors">
                    <Lock className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-violet-500/60 focus:bg-violet-500/[0.05] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors">
                    <Lock className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-violet-500/60 focus:bg-violet-500/[0.05] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
