import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import API from '../api';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Loader2, X, ChevronDown, ChevronUp,
  Shield, CheckCircle2
} from 'lucide-react';

// ── Circular progress ring ──────────────────────────────────────────────────
const CircleScore = ({ score, max, size = 80, color = '#6366f1', label, sublabel }) => {
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
      {label && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>}
      {sublabel && <p className="text-[9px] text-slate-600">{sublabel}</p>}
    </div>
  );
};

// ── Big ATS score ring ──────────────────────────────────────────────────────
const BigCircle = ({ score }) => {
  const size = 130;
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
        <motion.span
          className="text-3xl font-black"
          style={{ color }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-slate-500 font-bold">/100</span>
      </div>
    </div>
  );
};

const breakdownColors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const breakdownKeys = ['keywords','experience','achievements','format','skills','education','contact'];

// ── AI Resume Analysis Panel ────────────────────────────────────────────────
const STEPS = [
  { label: 'Reading PDF…',         icon: '📄' },
  { label: 'Extracting text…',     icon: '🔍' },
  { label: 'Running ATS scan…',    icon: '🤖' },
  { label: 'Scoring resume…',      icon: '📊' },
  { label: 'Building report…',     icon: '✅' },
];

const ResumeAnalysisPanel = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const fileRef = useRef();
  const stepTimerRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    if (!['application/pdf'].includes(f.type)) { toast.error('Only PDF supported'); return; }
    setFile(f);
    setAnalysis(null);
  };

  const advanceSteps = () => {
    setStep(0);
    let current = 0;
    // Steps 0-3 auto-advance; step 4 is set when API returns
    stepTimerRef.current = setInterval(() => {
      current += 1;
      if (current >= STEPS.length - 1) {
        clearInterval(stepTimerRef.current);
      } else {
        setStep(current);
      }
    }, 1200);
  };

  const runAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setStep(0);
    advanceSteps();
    try {
      const toBase64 = (f) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload  = () => resolve(r.result.split(',')[1]);
        r.onerror = reject;
      });
      const base64 = await toBase64(file);
      const res = await API.post('/resume-analysis/ats', { resumeBase64: base64, fileName: file.name });
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

  const atsColor = analysis
    ? analysis.atsScore >= 75 ? '#10b981' : analysis.atsScore >= 50 ? '#f59e0b' : '#ef4444'
    : '#6366f1';

  return (
    <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] overflow-hidden">
      {/* Section header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Shield className="w-6 h-6 text-violet-400" /> AI Resume Analysis
          </h2>
          <p className="text-slate-400 text-sm mt-1">Upload your resume for an instant ATS score &amp; improvement tips</p>
        </div>
        {analysis && (
          <button
            onClick={() => { setFile(null); setAnalysis(null); }}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Start Fresh
          </button>
        )}
      </div>

      <div className="p-8">
        {/* Upload zone (hidden when analysis ready) */}
        {!analysis && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div
              onClick={() => !analyzing && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center gap-4 cursor-pointer transition-all
                ${file ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/5'}`}
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <>
                  <FileText className="w-12 h-12 text-violet-400" />
                  <p className="font-bold text-white">{file.name}</p>
                  <p className="text-sm text-slate-400">{(file.size/1024/1024).toFixed(2)} MB</p>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-red-400 text-sm font-bold flex items-center gap-1">
                    <X className="w-4 h-4" /> Remove
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-violet-600/10 rounded-2xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-violet-400" />
                  </div>
                  <p className="text-lg font-bold text-white">Drop your resume here</p>
                  <p className="text-sm text-slate-400">PDF only • Max 5MB</p>
                </>
              )}
            </div>

            {file && (
              <div className="mt-6 space-y-4">
                {analyzing ? (
                  <div className="w-full bg-white/3 border border-white/10 rounded-2xl p-6 space-y-3">
                    {STEPS.map((s, i) => (
                      <motion.div
                        key={i}
                        className={`flex items-center gap-3 transition-all duration-300 ${
                          i < step ? 'opacity-40' : i === step ? 'opacity-100' : 'opacity-20'
                        }`}
                      >
                        <span className="text-lg">{s.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${
                            i === step ? 'text-violet-300' : 'text-slate-400'
                          }`}>{s.label}</p>
                          {i === step && (
                            <motion.div
                              className="h-1 bg-violet-500/30 rounded-full mt-1.5 overflow-hidden"
                            >
                              <motion.div
                                className="h-full bg-violet-500 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1.1, ease: 'linear' }}
                              />
                            </motion.div>
                          )}
                        </div>
                        {i < step && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {i === step && (
                          <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={runAnalysis}
                    className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
                  >
                    <Shield className="w-5 h-5" /> Run ATS Analysis
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {analysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

              {/* ─ ATS Score Banner ─ */}
              <div className="rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap"
                style={{ background: `linear-gradient(135deg, ${atsColor}22, ${atsColor}08)`, border: `1px solid ${atsColor}33` }}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: atsColor }}>ATS Compatibility Score</p>
                  <p className="text-slate-300 text-sm mt-1">{analysis.scoreLabel}</p>
                  <div className="mt-4 w-64 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: atsColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.atsScore}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Overall ATS Score</p>
                </div>
                <BigCircle score={analysis.atsScore} />
              </div>

              {/* ─ Score Breakdown ─ */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5">Score Breakdown</h3>
                <div className="flex flex-wrap gap-6 justify-center">
                  {breakdownKeys.map((key, i) => {
                    const item = analysis.scoreBreakdown?.[key];
                    if (!item) return null;
                    return (
                      <CircleScore
                        key={key}
                        score={item.score}
                        max={item.max}
                        size={80}
                        color={breakdownColors[i % breakdownColors.length]}
                        label={key}
                      />
                    );
                  })}
                </div>
              </div>

              {/* ─ Resume Quality ─ */}
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

              {/* ─ Strengths ─ */}
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

              {/* ─ Missing Keywords ─ */}
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

              {/* ─ Improvement Suggestions ─ */}
              {analysis.improvements?.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Improvement Suggestions</h3>
                  <div className="space-y-3">
                    {(showAll ? analysis.improvements : analysis.improvements.slice(0, 3)).map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-4 bg-white/3 border border-white/5 rounded-xl p-4"
                      >
                        <span className="w-6 h-6 bg-violet-600/20 text-violet-400 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
                      </motion.div>
                    ))}
                  </div>
                  {analysis.improvements.length > 3 && (
                    <button
                      onClick={() => setShowAll(v => !v)}
                      className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {showAll ? <><ChevronUp className="w-4 h-4" /> Show Less</> : <><ChevronDown className="w-4 h-4" /> Show {analysis.improvements.length - 3} More</>}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ResumeAnalysisPage = () => {
  return (
    <div className="min-h-screen bg-[#0c0e14] flex text-white">
      <Sidebar />
      <main className="flex-1 ml-72 p-10 space-y-10">
        <ResumeAnalysisPanel />
      </main>
    </div>
  );
};

export default ResumeAnalysisPage;
