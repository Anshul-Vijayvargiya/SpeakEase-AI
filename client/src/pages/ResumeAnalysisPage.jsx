import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import API from '../api';
import toast from 'react-hot-toast';
import useSidebarStore from '../store/sidebarStore';
import {
  Upload, FileText, Loader2, X, ChevronDown, ChevronUp,
  Shield, CheckCircle2, Briefcase, BookOpen, Star, Zap,
  AlertTriangle, TrendingUp, Award, Download, Copy, RefreshCw,
  Target, Users, GitBranch, Linkedin, Globe, MessageSquare
} from 'lucide-react';

// ─── Circular progress ring ──────────────────────────────────────────────────
const CircleScore = ({ score, max, size = 80, color = '#6366f1', label }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, score / max);
  const dash = pct * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2436" strokeWidth={8} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black text-white">{score}</span>
          <span className="text-[9px] text-slate-500 font-bold">/{max}</span>
        </div>
      </div>
      {label && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{label}</p>}
    </div>
  );
};

// ─── Big ATS score ring ──────────────────────────────────────────────────────
const BigCircle = ({ score, size = 130 }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const dash = (score / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2436" strokeWidth={10} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-3xl font-black" style={{ color }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {score}
        </motion.span>
        <span className="text-xs text-slate-500 font-bold">/100</span>
      </div>
    </div>
  );
};

// ─── Match Ring ──────────────────────────────────────────────────────────────
const MatchRing = ({ score }) => {
  const size = 160;
  const r = 66;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Strong Match' : score >= 60 ? 'Moderate Match' : 'Weak Match';
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2436" strokeWidth={12} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={12} strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.5, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-4xl font-black" style={{ color }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            {score}%
          </motion.span>
          <span className="text-xs text-slate-400 font-bold">Match</span>
        </div>
      </div>
      <span className="text-sm font-black px-4 py-1.5 rounded-full" style={{ background: `${color}20`, color }}>{label}</span>
    </div>
  );
};

const TARGET_ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'DevOps Engineer', 'Android Developer',
  'ML Engineer', 'Cloud Engineer', 'iOS Developer', 'QA Engineer',
  'Cybersecurity Analyst', 'Data Analyst', 'General Software Engineer'
];

// ─── Student Insights ─────────────────────────────────────────────────────────
const StudentInsights = ({ insights }) => {
  if (!insights) return null;
  const readinessColor = { 'Placement Ready': '#10b981', 'Almost Ready': '#f59e0b', 'Needs Work': '#f97316', 'Not Ready': '#ef4444' };
  const color = readinessColor[insights.fresherReadiness] || '#6366f1';
  const pp = insights.placementProbability || {};
  const tiers = [
    { label: 'Service Companies (TCS, Infosys, Wipro)', key: 'serviceBased', color: '#10b981' },
    { label: 'Mid-tier Product (Zoho, Freshworks)', key: 'midTierProduct', color: '#f59e0b' },
    { label: 'Top Product (Google, Amazon, Flipkart)', key: 'topProduct', color: '#6366f1' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#151821] border border-white/5 rounded-2xl p-6 space-y-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Student Profile Analysis</h3>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[180px] rounded-xl p-4 border" style={{ background: `${color}10`, borderColor: `${color}30` }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>Fresher Readiness</p>
          <p className="text-xl font-black text-white">{insights.fresherReadiness}</p>
          <p className="text-xs text-slate-400 mt-1">{insights.percentileRank}</p>
        </div>
        <div className="flex-1 min-w-[180px] rounded-xl p-4 bg-white/3 border border-white/5 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Profile Links</p>
          {[
            { icon: <GitBranch className="w-3 h-3"/>, label: 'GitHub', has: insights.hasGithub, boost: insights.githubBoost },
            { icon: <Linkedin className="w-3 h-3"/>, label: 'LinkedIn', has: insights.hasLinkedin, boost: insights.linkedinBoost },
            { icon: <Globe className="w-3 h-3"/>, label: 'Portfolio', has: insights.hasPortfolio, boost: insights.portfolioBoost },
          ].map(({ icon, label, has, boost }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1.5 font-bold ${has ? 'text-emerald-400' : 'text-slate-400'}`}>
                {icon}{has ? '✅' : '❌'} {label}
              </span>
              {!has && <span className="text-violet-400 font-black text-[10px]">Add → {boost}</span>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Placement Probability</p>
        <div className="space-y-3">
          {tiers.map(({ label, key, color: c }) => {
            const val = parseInt(pp[key] || '0');
            return (
              <div key={key}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span style={{ color: c }}>{pp[key] || 'N/A'}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: c }}
                    initial={{ width: 0 }} animate={{ width: `${val}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
                {(pp[`${key}_tips`] || []).slice(0,1).map((t, i) => (
                  <p key={i} className="text-[10px] text-slate-500 mt-0.5">→ {t}</p>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Quick Wins ───────────────────────────────────────────────────────────────
const QuickWins = ({ quickWins }) => {
  if (!quickWins) return null;
  const tiers = [
    { key: 'easy', label: '🟢 Easy Fixes', sub: 'Fix today', bg: 'bg-emerald-500/5', border: 'border-emerald-500/15', badge: 'bg-emerald-500/10 text-emerald-400' },
    { key: 'medium', label: '🟡 Medium Fixes', sub: 'Fix this week', bg: 'bg-amber-500/5', border: 'border-amber-500/15', badge: 'bg-amber-500/10 text-amber-400' },
    { key: 'critical', label: '🔴 Critical Fixes', sub: 'Fix before applying', bg: 'bg-red-500/5', border: 'border-red-500/15', badge: 'bg-red-500/10 text-red-400' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#151821] border border-white/5 rounded-2xl p-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">⚡ Quick Wins</h3>
      <div className="space-y-4">
        {tiers.map(({ key, label, sub, bg, border, badge }) => (
          <div key={key} className={`${bg} border ${border} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-black text-white">{label}</p>
              <span className="text-[10px] text-slate-500">— {sub}</span>
            </div>
            <div className="space-y-2">
              {(quickWins[key] || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 mt-0.5 shrink-0">□</span>
                    <p className="text-xs text-slate-300">{item.fix}</p>
                  </div>
                  <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-full ${badge}`}>{item.atsBoost}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Section Feedback ─────────────────────────────────────────────────────────
const SectionFeedback = ({ sectionFeedback }) => {
  const [open, setOpen] = useState('objective');
  if (!sectionFeedback) return null;
  const sf = sectionFeedback;

  const tabs = [
    { key: 'objective', label: '📝 Summary', icon: '📝' },
    { key: 'skills', label: '💡 Skills', icon: '💡' },
    { key: 'projects', label: '🚀 Projects', icon: '🚀' },
    { key: 'experience', label: '💼 Experience', icon: '💼' },
    { key: 'education', label: '🎓 Education', icon: '🎓' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#151821] border border-white/5 rounded-2xl p-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">Section-wise Deep Analysis</h3>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setOpen(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${open === t.key ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {open === 'objective' && sf.objective && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <span className={`px-3 py-1 text-xs font-black rounded-full ${sf.objective.exists ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {sf.objective.exists ? '✅ Found' : '❌ Missing'}
            </span>
            <span className={`px-3 py-1 text-xs font-black rounded-full ${sf.objective.isGeneric ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {sf.objective.isGeneric ? '⚠️ Generic' : '✅ Role-specific'}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{sf.objective.feedback}</p>
          {sf.objective.current && <div className="bg-white/3 border border-white/5 rounded-xl p-4 text-xs text-slate-400 italic">"{sf.objective.current}"</div>}
          {sf.objective.rewrite && (
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">💡 AI Suggested Rewrite</p>
              <p className="text-xs text-slate-300 leading-relaxed">{sf.objective.rewrite}</p>
            </div>
          )}
        </div>
      )}

      {open === 'skills' && sf.skills && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="text-slate-300 font-bold">Total Skills: <span className="text-violet-400">{sf.skills.totalCount}</span></span>
          </div>
          <p className="text-xs text-slate-400">{sf.skills.feedback}</p>
          {sf.skills.categories && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(sf.skills.categories).filter(([,v]) => v?.length).map(([cat, skills]) => (
                <div key={cat} className="bg-white/3 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{cat}</p>
                  <div className="flex flex-wrap gap-1">{skills.map((s,i) => <span key={i} className="px-2 py-0.5 bg-violet-500/10 text-violet-300 text-[10px] font-bold rounded-full">{s}</span>)}</div>
                </div>
              ))}
            </div>
          )}
          {sf.skills.toAdd?.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">➕ Add These Skills</p>
              <div className="flex flex-wrap gap-2">{sf.skills.toAdd.map((s,i) => <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-lg">{s}</span>)}</div>
            </div>
          )}
          {sf.skills.toRemove?.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">➖ Remove/Reframe</p>
              <div className="flex flex-wrap gap-2">{sf.skills.toRemove.map((s,i) => <span key={i} className="px-2 py-1 bg-red-500/10 text-red-300 text-xs font-bold rounded-lg">{s}</span>)}</div>
            </div>
          )}
        </div>
      )}

      {open === 'projects' && (
        <div className="space-y-4">
          {(!sf.projects || sf.projects.length === 0) && <p className="text-sm text-slate-400">No projects detected in resume.</p>}
          {(sf.projects || []).map((proj, i) => (
            <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-black text-white text-sm">{proj.name}</p>
                <div className="flex items-center gap-1">
                  {[...Array(10)].map((_,j) => (
                    <div key={j} className={`w-2 h-2 rounded-full ${j < proj.score ? 'bg-violet-500' : 'bg-white/10'}`} />
                  ))}
                  <span className="text-xs text-violet-400 font-black ml-1">{proj.score}/10</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Description', val: proj.hasDescription },
                  { label: 'Tech Stack', val: proj.hasTechStack },
                  { label: 'Impact/Results', val: proj.hasImpact },
                  { label: 'GitHub Link', val: proj.hasGithubLink },
                ].map(({ label, val }) => (
                  <span key={label} className={`flex items-center gap-1 font-bold ${val ? 'text-emerald-400' : 'text-red-400'}`}>
                    {val ? '✅' : '❌'} {label}
                  </span>
                ))}
              </div>
              {proj.improved && (
                <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg p-3">
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">🤖 AI Improved Version</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{proj.improved}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {open === 'experience' && sf.experience && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Internship', val: sf.experience.hasInternship },
              { label: 'Action Verbs', val: sf.experience.usesActionVerbs },
              { label: 'Quantified', val: sf.experience.hasQuantifiedAchievements },
            ].map(({ label, val }) => (
              <span key={label} className={`px-3 py-1 text-xs font-black rounded-full ${val ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {val ? '✅' : '❌'} {label}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">{sf.experience.feedback}</p>
          {(sf.experience.suggestions || []).map((s, i) => (
            <div key={i} className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-3 text-xs text-slate-300">💡 {s}</div>
          ))}
        </div>
      )}

      {open === 'education' && sf.education && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'CGPA Mentioned', val: sf.education.hasCgpa },
              { label: 'Relevant Coursework', val: sf.education.hasRelevantCoursework },
              { label: 'Certifications', val: sf.education.hasCertifications },
            ].map(({ label, val }) => (
              <span key={label} className={`px-3 py-1 text-xs font-black rounded-full ${val ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {val ? '✅' : '⚠️'} {label}
              </span>
            ))}
          </div>
          {sf.education.degree && <p className="text-sm text-slate-300 font-bold">{sf.education.degree} — {sf.education.institution}</p>}
          <p className="text-xs text-slate-400">{sf.education.feedback}</p>
        </div>
      )}
    </motion.div>
  );
};

// ─── Line Feedback ────────────────────────────────────────────────────────────
const LineFeedback = ({ lineFeedback }) => {
  if (!lineFeedback?.length) return null;
  const statusStyle = { warning: 'text-amber-400 border-amber-500/20 bg-amber-500/5', good: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', error: 'text-red-400 border-red-500/20 bg-red-500/5' };
  const statusIcon = { warning: '⚠️', good: '✅', error: '❌' };
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#151821] border border-white/5 rounded-2xl p-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">🔍 Smart Resume Review</h3>
      <div className="space-y-4">
        {lineFeedback.map((item, i) => (
          <div key={i} className={`border rounded-xl p-4 space-y-2 ${statusStyle[item.status] || statusStyle.warning}`}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest">[{item.section}]</span>
              <span className="text-xs">{statusIcon[item.status]}</span>
              <span className="text-xs font-bold">{item.comment}</span>
            </div>
            {item.original && <p className="text-xs text-slate-400 italic bg-black/20 rounded-lg px-3 py-2">"{item.original}"</p>}
            {item.suggestion && <p className="text-xs text-slate-300">→ 💡 {item.suggestion}</p>}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Job Role Input ───────────────────────────────────────────────────────────
const JobRoleInput = ({ targetRole, setTargetRole, jobDescription, setJobDescription }) => (
  <div className="bg-[#151821] border border-violet-500/20 rounded-2xl p-6 space-y-4">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center">
        <Target className="w-4 h-4 text-violet-400" />
      </div>
      <div>
        <h3 className="text-sm font-black text-white">Match with Job Role</h3>
        <p className="text-[11px] text-slate-500">Select a role or paste a job description for deeper analysis</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Role</label>
        <select
          value={targetRole}
          onChange={e => setTargetRole(e.target.value)}
          className="w-full bg-[#0c0e14] border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition-colors"
        >
          <option value="">Select a role...</option>
          {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Job Description (Optional)</label>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste job description here for precise matching..."
          rows={3}
          className="w-full bg-[#0c0e14] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition-colors resize-none placeholder:text-slate-600"
        />
      </div>
    </div>
  </div>
);

// ─── Job Match Result ─────────────────────────────────────────────────────────
const JobMatchResult = ({ jobMatch }) => {
  if (!jobMatch) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#151821] border border-white/5 rounded-2xl p-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Job Role Match Analysis</h3>
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <MatchRing score={jobMatch.matchScore || 0} />
        <div className="flex-1 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed bg-white/3 border border-white/5 rounded-xl p-4">
            💡 {jobMatch.recommendation}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">✅ Skills You Have</p>
              <div className="space-y-1.5">
                {(jobMatch.matchedSkills || []).map((s, i) => (
                  <div key={i} className="text-xs text-slate-300 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-1.5 font-bold">{s}</div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">❌ Skills You Need</p>
              <div className="space-y-1.5">
                {(jobMatch.missingSkills || []).map((s, i) => (
                  <div key={i} className="text-xs text-slate-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-1.5 font-bold">{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Certification Suggestions ────────────────────────────────────────────────
const CertSuggestions = ({ certs }) => {
  if (!certs?.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#151821] border border-white/5 rounded-2xl p-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">🏆 Certification Suggestions</h3>
      <div className="space-y-3">
        {certs.map((cert, i) => (
          <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-black text-white">{cert.name}</p>
              <p className="text-xs text-slate-400 mt-1">{cert.impact}</p>
              <div className="flex gap-3 mt-2 text-[10px] font-bold text-slate-500">
                <span>📚 {cert.platform}</span>
                <span>⏱ {cert.duration}</span>
                <span className={cert.cost === 'Free' ? 'text-emerald-400' : 'text-amber-400'}>💰 {cert.cost}</span>
              </div>
            </div>
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Interview Questions ──────────────────────────────────────────────────────
const InterviewQuestions = ({ questions }) => {
  if (!questions) return null;
  const sections = [
    { key: 'fromProjects',  label: '🚀 From Your Projects',  color: 'text-violet-400' },
    { key: 'fromSkills',    label: '💡 From Your Skills',    color: 'text-blue-400' },
    { key: 'fromEducation', label: '🎓 From Your Education', color: 'text-emerald-400' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#151821] border border-white/5 rounded-2xl p-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">🎤 Predicted Interview Questions</h3>
      <div className="space-y-5">
        {sections.map(({ key, label, color }) => (
          <div key={key}>
            <p className={`text-xs font-black uppercase tracking-widest mb-3 ${color}`}>{label}</p>
            <div className="space-y-2">
              {(questions[key] || []).map((q, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/5 rounded-xl p-3">
                  <MessageSquare className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300">{q}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Score History ────────────────────────────────────────────────────────────
const ScoreHistory = ({ history }) => {
  if (!history?.length) return null;
  const chartH = 80;
  const w = 100 / Math.max(history.length - 1, 1);
  const pts = history.map((h, i) => ({
    x: i * w,
    y: chartH - (h.score / 100) * chartH,
    score: h.score,
    label: h.label,
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const diff = (history[history.length - 1]?.score || 0) - (history[0]?.score || 0);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#151821] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">📈 Resume Score History</h3>
        {diff > 0 && (
          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">+{diff} pts since start 🎉</span>
        )}
      </div>
      <div className="relative h-24 mb-4">
        <svg viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${chartH} ${polyline} 100,${chartH}`} fill="url(#scoreGrad)" />
          <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill="#6366f1" />)}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
        {history.map((h, i) => (
          <div key={i} className="text-center">
            <div className="text-white font-black">{h.score}</div>
            <div>{h.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Download Report ──────────────────────────────────────────────────────────
const DownloadReport = ({ analysis }) => {
  const handleDownload = () => {
    const lines = [
      'ATS RESUME ANALYSIS REPORT',
      '='.repeat(50),
      `Candidate: ${analysis.candidateName || 'Unknown'}`,
      `ATS Score: ${analysis.atsScore}/100 (${analysis.atsGrade})`,
      '',
      'SCORE BREAKDOWN:',
      ...Object.entries(analysis.scoreBreakdown || {}).map(([k, v]) => `  ${k}: ${v.score}/${v.max} — ${v.feedback || ''}`),
      '',
      'STRENGTHS:',
      ...(analysis.strengths || []).map((s, i) => `  ${i + 1}. ${s}`),
      '',
      'MISSING KEYWORDS:',
      '  ' + (analysis.missingKeywords || []).join(', '),
      '',
      'IMPROVEMENT SUGGESTIONS:',
      ...(analysis.improvements || []).map((s, i) => `  ${i + 1}. ${s}`),
      '',
      'QUICK WINS:',
      ...(analysis.quickWins?.easy     || []).map(w => `  [EASY]     ${w.fix} → ${w.atsBoost}`),
      ...(analysis.quickWins?.medium   || []).map(w => `  [MEDIUM]   ${w.fix} → ${w.atsBoost}`),
      ...(analysis.quickWins?.critical || []).map(w => `  [CRITICAL] ${w.fix} → ${w.atsBoost}`),
      '',
      'INTERVIEW QUESTIONS:',
      ...[
        ...(analysis.predictedInterviewQuestions?.fromProjects  || []),
        ...(analysis.predictedInterviewQuestions?.fromSkills    || []),
        ...(analysis.predictedInterviewQuestions?.fromEducation || []),
      ].map((q, i) => `  Q${i + 1}: ${q}`),
      '',
      'CERTIFICATIONS SUGGESTED:',
      ...(analysis.certificationSuggestions || []).map(c => `  • ${c.name} — ${c.platform} (${c.cost})`),
      '',
      `Generated by SpeakEase AI — ${new Date().toLocaleDateString()}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `resume-analysis-${(analysis.candidateName || 'report').replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  return (
    <button onClick={handleDownload}
      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-xl shadow-emerald-600/20">
      <Download className="w-5 h-5" /> Download Analysis Report
    </button>
  );
};

// ─── Step labels for loading animation ───────────────────────────────────────
const STEPS = [
  { label: 'Reading PDF…',     icon: '📄' },
  { label: 'Extracting text…', icon: '🔍' },
  { label: 'Running ATS scan…',icon: '🤖' },
  { label: 'Scoring resume…',  icon: '📊' },
  { label: 'Building report…', icon: '✅' },
];

const BREAKDOWN_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const BREAKDOWN_KEYS   = ['keywords','experience','achievements','format','skills','education','contact'];

// ─── Main Analysis Panel ──────────────────────────────────────────────────────
const ResumeAnalysisPanel = () => {
  const [file,           setFile]           = useState(null);
  const [analyzing,      setAnalyzing]      = useState(false);
  const [step,           setStep]           = useState(0);
  const [analysis,       setAnalysis]       = useState(null);
  const [showAll,        setShowAll]        = useState(false);
  const [targetRole,     setTargetRole]     = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const fileRef     = useRef();
  const stepTimerRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    if (f.type !== 'application/pdf') { toast.error('Only PDF supported'); return; }
    setFile(f);
    setAnalysis(null);
  };

  const advanceSteps = () => {
    setStep(0);
    let cur = 0;
    stepTimerRef.current = setInterval(() => {
      cur += 1;
      if (cur >= STEPS.length - 1) clearInterval(stepTimerRef.current);
      else setStep(cur);
    }, 1800);
  };

  const runAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    advanceSteps();
    try {
      const toBase64 = (f) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload  = () => resolve(r.result.split(',')[1]);
        r.onerror = reject;
      });
      const base64 = await toBase64(file);
      const res = await API.post('/resume-analysis/ats', {
        resumeBase64: base64,
        fileName:     file.name,
        targetRole:   targetRole     || undefined,
        jobDescription: jobDescription || undefined,
      });
      clearInterval(stepTimerRef.current);
      setStep(STEPS.length - 1);
      await new Promise(r => setTimeout(r, 400));
      setAnalysis(res.data.analysis);
      toast.success('Resume analyzed!');
    } catch (err) {
      clearInterval(stepTimerRef.current);
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
      setStep(0);
    }
  };

  const atsColor = !analysis ? '#6366f1'
    : analysis.atsScore >= 75 ? '#10b981'
    : analysis.atsScore >= 50 ? '#f59e0b'
    : '#ef4444';

  return (
    <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Shield className="w-6 h-6 text-violet-400" /> AI Resume Analyzer
          </h2>
          <p className="text-slate-400 text-sm mt-1">ATS analysis · student insights · interview prep</p>
        </div>
        {analysis && (
          <button onClick={() => { setFile(null); setAnalysis(null); }}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm font-bold rounded-xl transition-all flex items-center gap-2">
            <X className="w-4 h-4" /> Analyze New Resume
          </button>
        )}
      </div>

      <div className="p-8">
        {/* ── Upload zone ── */}
        {!analysis && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <JobRoleInput
              targetRole={targetRole} setTargetRole={setTargetRole}
              jobDescription={jobDescription} setJobDescription={setJobDescription}
            />
            <div
              onClick={() => !analyzing && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center gap-4 cursor-pointer transition-all
                ${file ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/5'}`}
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <>
                  <FileText className="w-12 h-12 text-violet-400" />
                  <p className="font-bold text-white">{file.name}</p>
                  <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="text-red-400 text-sm font-bold flex items-center gap-1">
                    <X className="w-4 h-4" /> Remove
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-violet-600/10 rounded-2xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-violet-400" />
                  </div>
                  <p className="text-lg font-bold text-white">Drop your resume here</p>
                  <p className="text-sm text-slate-400">PDF only · Max 5 MB</p>
                </>
              )}
            </div>

            {file && (
              analyzing ? (
                <div className="w-full bg-white/3 border border-white/10 rounded-2xl p-6 space-y-3">
                  {STEPS.map((s, i) => (
                    <motion.div key={i}
                      className={`flex items-center gap-3 transition-all duration-300
                        ${i < step ? 'opacity-40' : i === step ? 'opacity-100' : 'opacity-20'}`}>
                      <span className="text-lg">{s.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${i === step ? 'text-violet-300' : 'text-slate-400'}`}>{s.label}</p>
                        {i === step && (
                          <motion.div className="h-1 bg-violet-500/30 rounded-full mt-1.5 overflow-hidden">
                            <motion.div className="h-full bg-violet-500 rounded-full"
                              initial={{ width: '0%' }} animate={{ width: '100%' }}
                              transition={{ duration: 1.7, ease: 'linear' }} />
                          </motion.div>
                        )}
                      </div>
                      {i < step  && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {i === step && <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <button onClick={runAnalysis}
                  className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity">
                  <Shield className="w-5 h-5" /> Run Full AI Analysis
                </button>
              )
            )}
          </motion.div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {analysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

              {/* 1. ATS Score Banner */}
              <div className="rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap"
                style={{ background: `linear-gradient(135deg,${atsColor}22,${atsColor}08)`, border: `1px solid ${atsColor}33` }}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: atsColor }}>ATS Compatibility Score</p>
                  <p className="text-slate-300 text-sm mt-1">{analysis.scoreLabel} — {analysis.atsGrade}</p>
                  {analysis.candidateName && analysis.candidateName !== 'Unknown' && (
                    <p className="text-xs text-slate-500 mt-1">👤 {analysis.candidateName}</p>
                  )}
                  <div className="mt-4 w-64 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: atsColor }}
                      initial={{ width: 0 }} animate={{ width: `${analysis.atsScore}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }} />
                  </div>
                </div>
                <BigCircle score={analysis.atsScore} />
              </div>

              {/* 2. Score Breakdown */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">Score Breakdown</h3>
                <div className="flex flex-wrap gap-6 justify-center">
                  {BREAKDOWN_KEYS.map((key, i) => {
                    const item = analysis.scoreBreakdown?.[key];
                    if (!item) return null;
                    return (
                      <div key={key} className="flex flex-col items-center gap-1">
                        <CircleScore score={item.score} max={item.max} size={80}
                          color={BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length]} label={key} />
                        {item.feedback && (
                          <p className="text-[9px] text-slate-600 max-w-[70px] text-center leading-tight">
                            {item.feedback.slice(0, 40)}…
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Job Match */}
              <JobMatchResult jobMatch={analysis.jobMatch} />

              {/* 4. Resume Quality */}
              {analysis.resumeQuality && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">Resume Quality</h3>
                  <div className="flex flex-wrap gap-8 justify-center">
                    {[
                      { key: 'accessibility', label: 'Accessibility', color: '#10b981' },
                      { key: 'readability',   label: 'Readability',   color: '#3b82f6' },
                      { key: 'performance',   label: 'Performance',   color: '#ef4444' },
                    ].map(({ key, label, color }) => (
                      <CircleScore key={key} score={analysis.resumeQuality[key]} max={100} size={100} color={color} label={label} />
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Student Insights */}
              <StudentInsights insights={analysis.studentInsights} />

              {/* 6. Section Feedback */}
              <SectionFeedback sectionFeedback={analysis.sectionFeedback} />

              {/* 7. Line Feedback */}
              <LineFeedback lineFeedback={analysis.lineFeedback} />

              {/* 8. Quick Wins */}
              <QuickWins quickWins={analysis.quickWins} />

              {/* 9. Strengths */}
              {analysis.strengths?.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Strengths</h3>
                  <div className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-300">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. Missing Keywords */}
              {analysis.missingKeywords?.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold rounded-full">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 11. Improvement Suggestions */}
              {analysis.improvements?.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Improvement Suggestions</h3>
                  <div className="space-y-3">
                    {(showAll ? analysis.improvements : analysis.improvements.slice(0, 3)).map((tip, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-4 bg-white/3 border border-white/5 rounded-xl p-4">
                        <span className="w-6 h-6 bg-violet-600/20 text-violet-400 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
                      </motion.div>
                    ))}
                  </div>
                  {analysis.improvements.length > 3 && (
                    <button onClick={() => setShowAll(v => !v)}
                      className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                      {showAll
                        ? <><ChevronUp   className="w-4 h-4" /> Show Less</>
                        : <><ChevronDown className="w-4 h-4" /> Show {analysis.improvements.length - 3} More</>}
                    </button>
                  )}
                </div>
              )}

              {/* 12. Certifications */}
              <CertSuggestions certs={analysis.certificationSuggestions} />

              {/* 13. Interview Questions */}
              <InterviewQuestions questions={analysis.predictedInterviewQuestions} />

              {/* 14. Score History */}
              <ScoreHistory history={analysis.scoreHistory} />

              {/* 15. Download */}
              <DownloadReport analysis={analysis} />

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const ResumeAnalysisPage = () => {
  const { collapsed } = useSidebarStore();
  return (
    <div className="min-h-screen bg-[#0c0e14] flex text-white">
      <Sidebar />
      <main className={`flex-1 p-10 space-y-10 transition-all duration-200 ease-in-out ${collapsed ? 'ml-[72px]' : 'ml-72'}`}>
        <ResumeAnalysisPanel />
      </main>
    </div>
  );
};

export default ResumeAnalysisPage;
