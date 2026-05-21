import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import API from '../api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import {
  User, Mail, School, GraduationCap, Globe, Bell,
  Shield, Trash2, Save, Lock, Zap, Star, ChevronRight,
  CheckCircle2, Eye, EyeOff, AlertTriangle, CreditCard
} from 'lucide-react';

/* ── helpers ── */
const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

const gradients = [
  'from-violet-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];

/* ── Section wrapper ── */
const Section = ({ icon: Icon, title, subtitle, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-[#13141c] border border-white/[0.07] rounded-2xl overflow-hidden"
  >
    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
      <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-violet-400" />
      </span>
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

/* ── Labelled input ── */
const Field = ({ label, icon: Icon, disabled, hint, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      {hint && <span className="ml-auto normal-case text-[10px] text-slate-600 font-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

const TextInput = ({ icon: Icon, type = 'text', name, value, onChange, placeholder, disabled, rightSlot }) => (
  <div className="relative group">
    {Icon && (
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors">
        <Icon className="w-4 h-4" />
      </span>
    )}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`
        w-full border rounded-xl py-3 text-sm font-medium transition-all duration-200
        ${Icon ? 'pl-10' : 'pl-4'} ${rightSlot ? 'pr-10' : 'pr-4'}
        ${disabled
          ? 'bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed'
          : 'bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 outline-none focus:border-violet-500/60 focus:bg-violet-500/[0.05] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]'}
      `}
    />
    {rightSlot && (
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
    )}
  </div>
);

/* ── Toggle ── */
const Toggle = ({ checked, onChange, name }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${checked ? 'bg-violet-600' : 'bg-white/10'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

/* ── Stat chip ── */
const StatChip = ({ label, value, color }) => (
  <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
    <p className={`text-2xl font-black ${color}`}>{value}</p>
    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{label}</p>
  </div>
);

/* ══════════════════════════════════ PAGE ══════════════════════════════════ */
const SettingsPage = () => {
  const { user: storeUser, logout } = useAuthStore();
  const [avatarGrad, setAvatarGrad] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const [settings, setSettings] = useState({
    name: '', email: '', college: '', yearOfStudy: '1st Year',
    preferredLanguage: 'en-US', notifications: true,
  });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const u = stored?.state?.user || storeUser || {};
    setSettings(prev => ({
      ...prev,
      name: u.name || '',
      email: u.email || '',
      college: u.college || '',
      yearOfStudy: u.yearOfStudy || '1st Year',
      preferredLanguage: u.preferredLanguage || 'en-US',
      notifications: u.notifications !== undefined ? u.notifications : true,
    }));
  }, [storeUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put('/auth/update-profile', settings);
      const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = (e) => setPwForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await API.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password updated!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPwSaving(false);
    }
  };

  const user = storeUser || {};
  const plan = user.plan || 'free';
  const isPro = plan === 'pro';

  return (
    <div className="min-h-screen bg-[#09090f] flex text-white">
      <Sidebar />

      <main className="flex-1 ml-72 p-8 max-w-[1100px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black tracking-tight">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account, preferences and security</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-5">
          {/* ── LEFT column (profile card + plan) ── */}
          <div className="col-span-1 space-y-5">
            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-[#13141c] border border-white/[0.07] rounded-2xl p-6 text-center"
            >
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradients[avatarGrad]} flex items-center justify-center text-2xl font-black text-white shadow-xl mx-auto`}>
                  {initials(settings.name)}
                </div>
                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                  {gradients.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setAvatarGrad(i)}
                      className={`w-3 h-3 rounded-full bg-gradient-to-br ${g} border-2 ${avatarGrad === i ? 'border-white' : 'border-transparent'} transition-all`}
                    />
                  ))}
                </div>
              </div>

              <p className="font-bold text-white text-base">{settings.name || 'Your Name'}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{settings.email}</p>

              {/* Plan badge */}
              <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-bold ${isPro ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-violet-500/15 text-violet-400 border border-violet-500/25'}`}>
                {isPro ? <Star className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                {isPro ? 'Pro Member' : 'Free Plan'}
              </div>

              {/* Quick stats */}
              <div className="flex gap-2 mt-5">
                <StatChip label="Interviews" value={user.totalInterviews ?? 0} color="text-violet-400" />
                <StatChip label="Credits" value={user.credits ?? 10} color="text-indigo-400" />
              </div>
            </motion.div>

            {/* Upgrade card (free users) */}
            {!isPro && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 rounded-2xl p-5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
                <Star className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="font-black text-white text-sm mb-1">Go Pro</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">Unlimited interviews, advanced analytics, and priority AI coaching.</p>
                <button className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Upgrade Now
                </button>
              </motion.div>
            )}

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#13141c] border border-white/[0.07] rounded-2xl overflow-hidden"
            >
              {[
                { icon: Shield, label: 'Privacy Policy' },
                { icon: Bell, label: 'Notification Preferences' },
                { icon: CreditCard, label: 'Billing & Invoices' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all border-b border-white/[0.04] last:border-0">
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-600" />
                    {label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT column ── */}
          <div className="col-span-2 space-y-5">
            {/* Profile info */}
            <Section icon={User} title="Profile Information" subtitle="Update your public profile details" delay={0.05}>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" icon={User}>
                    <TextInput icon={User} name="name" value={settings.name} onChange={handleChange} placeholder="Your full name" />
                  </Field>
                  <Field label="Email Address" icon={Mail} hint="Cannot be changed">
                    <TextInput icon={Mail} type="email" name="email" value={settings.email} disabled />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="College / University" icon={School}>
                    <TextInput icon={School} name="college" value={settings.college || ''} onChange={handleChange} placeholder="Your institution" />
                  </Field>
                  <Field label="Year of Study" icon={GraduationCap}>
                    <div className="relative group">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
                      <select
                        name="yearOfStudy"
                        value={settings.yearOfStudy}
                        onChange={handleChange}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-white outline-none appearance-none cursor-pointer focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
                      >
                        {['1st Year','2nd Year','3rd Year','4th Year','Graduated'].map(y => (
                          <option key={y} value={y} className="bg-[#13141c]">{y}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                </div>

                <Field label="Preferred Interview Language" icon={Globe}>
                  <div className="relative group">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
                    <select
                      name="preferredLanguage"
                      value={settings.preferredLanguage}
                      onChange={handleChange}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-white outline-none appearance-none cursor-pointer focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
                    >
                      <option value="en-US" className="bg-[#13141c]">🇺🇸 English (US)</option>
                      <option value="en-GB" className="bg-[#13141c]">🇬🇧 English (UK)</option>
                      <option value="es-ES" className="bg-[#13141c]">🇪🇸 Spanish</option>
                      <option value="hi-IN" className="bg-[#13141c]">🇮🇳 Hindi</option>
                      <option value="fr-FR" className="bg-[#13141c]">🇫🇷 French</option>
                    </select>
                  </div>
                </Field>

                {/* Notifications toggle */}
                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-semibold text-white">Email Notifications</p>
                      <p className="text-xs text-slate-500">Get tips, reminders and performance updates</p>
                    </div>
                  </div>
                  <Toggle checked={settings.notifications} onChange={handleChange} name="notifications" />
                </div>

                <div className="flex justify-end pt-1">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/25 transition-all"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </motion.button>
                </div>
              </form>
            </Section>

            {/* Change Password */}
            <Section icon={Lock} title="Change Password" subtitle="Use a strong password of at least 8 characters" delay={0.1}>
              <form onSubmit={handlePwSave} className="space-y-4">
                <Field label="Current Password" icon={Lock}>
                  <TextInput
                    icon={Lock}
                    type={showPw ? 'text' : 'password'}
                    name="currentPassword"
                    value={pwForm.currentPassword}
                    onChange={handlePwChange}
                    placeholder="Enter current password"
                    rightSlot={
                      <button type="button" onClick={() => setShowPw(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="New Password" icon={Lock}>
                    <TextInput
                      icon={Lock}
                      type={showConfirmPw ? 'text' : 'password'}
                      name="newPassword"
                      value={pwForm.newPassword}
                      onChange={handlePwChange}
                      placeholder="Min. 8 characters"
                    />
                  </Field>
                  <Field label="Confirm Password" icon={Lock}>
                    <TextInput
                      icon={Lock}
                      type={showConfirmPw ? 'text' : 'password'}
                      name="confirmPassword"
                      value={pwForm.confirmPassword}
                      onChange={handlePwChange}
                      placeholder="Repeat new password"
                      rightSlot={
                        <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                  </Field>
                </div>

                {/* Password strength */}
                {pwForm.newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[8, 12, 16].map(len => (
                        <div key={len} className={`flex-1 h-1 rounded-full transition-colors ${pwForm.newPassword.length >= len ? 'bg-violet-500' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {pwForm.newPassword.length < 8 ? 'Too short' : pwForm.newPassword.length < 12 ? 'Fair' : pwForm.newPassword.length < 16 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all"
                  >
                    {pwSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                    {pwSaving ? 'Updating…' : 'Update Password'}
                  </motion.button>
                </div>
              </form>
            </Section>

            {/* Danger zone */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-rose-950/20 border border-rose-500/20 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-rose-500/15">
                <span className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-rose-300">Danger Zone</h2>
                  <p className="text-xs text-rose-500/70">Irreversible actions — proceed with caution</p>
                </div>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Delete Account</p>
                  <p className="text-xs text-slate-500 mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
                </div>
                <button
                  onClick={() => toast.error('Please contact support to delete your account.')}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-xs font-bold rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Account
                </button>
              </div>
            </motion.div>

            {/* Trust footer */}
            <p className="text-center text-xs text-slate-600 pb-2 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All data is encrypted and securely stored
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
