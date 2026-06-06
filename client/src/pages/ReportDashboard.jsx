import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Trophy, CheckCircle2, AlertCircle, Video, 
  Eye, MessageSquare, Zap, Clock, ChevronRight,
  TrendingUp, BarChart3, ArrowLeft, Download
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import API from '../api';
import toast from 'react-hot-toast';

const ReportDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get(`/interview/${id}/report`);
        setData(res.data);
      } catch (err) {
        toast.error("Failed to load report");
      }
    };
    fetchData();
  }, [id]);

  if (!data) return (
    <div className="min-h-screen bg-[#0c0e14] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );

  const overallScore = data.overallScore || 0;

  // Aggregate all questions from all phases
  const questions = [
    ...(data.codingResults || []),
    ...(data.technicalResults || []),
    ...(data.hrResults || [])
  ];

  // ── Real Behavioral Data Derivation ─────────────────────────────────────
  // Build eye-contact chart from actual per-question eyeContactScore
  const chartData = questions.map((q, i) => ({
    time: `Q${i + 1}`,
    eye: q.metrics?.eyeContactScore ?? 0,
    attention: q.metrics?.attentionScore ?? 0,
  }));

  // Fallback: if no real data recorded yet, show flat zero line
  const hasRealEyeData = questions.some(q => (q.metrics?.eyeContactScore ?? 0) > 0);
  const displayChart = hasRealEyeData ? chartData : [
    { time: 'Q1', eye: 0, attention: 0 },
    { time: 'Q2', eye: 0, attention: 0 },
  ];

  // Aggregate filler counts & WPM per question (stored in metrics)
  const totalFillers = questions.reduce((sum, q) => sum + (q.metrics?.fillerCount || 0), 0);
  const fillerWords = questions.reduce((acc, q) => {
    if (q.metrics?.fillerWords && Array.isArray(q.metrics.fillerWords)) {
      q.metrics.fillerWords.forEach(w => acc.add(w));
    }
    return acc;
  }, new Set());
  const displayFillerWords = fillerWords.size > 0
    ? [...fillerWords].slice(0, 6)
    : [];

  const wpmValues = questions.filter(q => (q.metrics?.wpm || 0) > 0).map(q => q.metrics.wpm);
  const avgWpm = wpmValues.length > 0
    ? Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length)
    : null;

  const avgEyeContact = questions.length > 0
    ? Math.round(questions.reduce((s, q) => s + (q.metrics?.eyeContactScore ?? 0), 0) / questions.length)
    : 0;

  const avgAttention = questions.length > 0
    ? Math.round(questions.reduce((s, q) => s + (q.metrics?.attentionScore ?? 0), 0) / questions.length)
    : 0;

  const subScores = [
    { label: 'Technical Accuracy', value: data.technicalScore || 0, color: '#3B82F6' },
    { label: 'Communication', value: data.hrPerformance || 0, color: '#8B5CF6' },
    { label: 'Confidence', value: data.overallScore || 0, color: '#10B981' }
  ];

  return (
    <div className="min-h-screen bg-[#0c0e14] flex text-white">
      <Sidebar />
      
      <main className="flex-1 ml-72 p-10 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Interview Performance Report</h1>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Session ID: {id.slice(-8)}</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-blue-600 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all">
            <Download className="w-5 h-5" /> Export PDF
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl w-fit mb-12 border border-white/5">
          {[
            { id: 'summary', icon: <Trophy />, label: 'Summary' },
            { id: 'answers', icon: <MessageSquare />, label: 'Detailed Answers' },
            { id: 'behavior', icon: <Eye />, label: 'Behavioral Analysis' },
            { id: 'video', icon: <Video />, label: 'Video Playback' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}
              `}
            >
              {React.cloneElement(tab.icon, { size: 16 })}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* SECTION 1: SUMMARY */}
          {activeTab === 'summary' && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Overall Score Circle */}
              <div className="lg:col-span-1 bg-[#151821] border border-white/5 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="88" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    <circle cx="96" cy="96" r="88" fill="transparent" stroke="#3B82F6" strokeWidth="12" 
                      strokeDasharray={552} strokeDashoffset={552 - (552 * overallScore) / 100} strokeLinecap="round" 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black">{overallScore}%</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Overall Score</span>
                  </div>
                </div>
                <h3 className="text-xl font-black mb-2">
                  {overallScore >= 80 ? 'Excellent Work!' : overallScore >= 60 ? 'Ready for Real Interview' : 'Keep Practicing'}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  You performed well in the Technical section, but your behavioral answers could be more structured.
                </p>
              </div>

              {/* Sub-scores Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                {subScores.map((score, i) => (
                  <div key={i} className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6" style={{ background: `${score.color}20`, color: score.color }}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{score.label}</p>
                      <h4 className="text-3xl font-black">{score.value}%</h4>
                    </div>
                    <div className="mt-6 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${score.value}%`, background: score.color }} />
                    </div>
                  </div>
                ))}
                
                {/* Insights Card — data-driven */}
                {(() => {
                  // Find the weakest behavioral metric to surface as top insight
                  let insightTitle = 'Keep Practicing!';
                  let insightBody  = 'Complete an interview session with your camera on to receive personalised behavioral insights.';
                  let insightColor = 'blue';

                  // Find worst eye contact question
                  const eyeScores = questions
                    .map((q, i) => ({ idx: i + 1, score: q.metrics?.eyeContactScore }))
                    .filter(e => e.score != null && e.score >= 0);

                  const attScores = questions
                    .map((q, i) => ({ idx: i + 1, score: q.metrics?.attentionScore }))
                    .filter(e => e.score != null && e.score >= 0);

                  if (eyeScores.length > 0) {
                    const worst = eyeScores.reduce((a, b) => a.score < b.score ? a : b);
                    if (worst.score < 50) {
                      insightTitle = 'Key Improvement: Eye Contact';
                      insightBody  = `Our AI detected low eye contact (${worst.score}%) during Question ${worst.idx}. Maintaining steady eye contact is crucial for establishing trust.`;
                      insightColor = 'red';
                    } else if (totalFillers > 10) {
                      insightTitle = 'Key Improvement: Reduce Fillers';
                      insightBody  = `You used ${totalFillers} filler words across the session. Practice pausing instead of saying "um" or "like" — it projects confidence.`;
                      insightColor = 'amber';
                    } else if (avgWpm && (avgWpm > 170 || avgWpm < 90)) {
                      insightTitle = avgWpm > 170 ? 'Slow Down Your Pace' : 'Pick Up the Pace';
                      insightBody  = `Your average speaking pace was ${avgWpm} WPM. The ideal range is 120–160 WPM for clear communication.`;
                      insightColor = 'amber';
                    } else if (attScores.length > 0) {
                      const worstAtt = attScores.reduce((a, b) => a.score < b.score ? a : b);
                      if (worstAtt.score < 60) {
                        insightTitle = 'Key Improvement: Attention Focus';
                        insightBody  = `Attention dropped to ${worstAtt.score}% during Question ${worstAtt.idx}. Try to face the camera directly and avoid looking around.`;
                        insightColor = 'orange';
                      } else {
                        insightTitle = '✨ Strong Behavioral Performance!';
                        insightBody  = `Great job! Your eye contact averaged ${avgEyeContact}% and attention averaged ${avgAttention}%. Keep it up in real interviews.`;
                        insightColor = 'emerald';
                      }
                    }
                  }

                  const colorStyles = {
                    blue:    { bg: 'rgba(59,130,246,0.05)',  border: 'rgba(59,130,246,0.2)',  icon: '#3B82F6' },
                    red:     { bg: 'rgba(239,68,68,0.05)',   border: 'rgba(239,68,68,0.2)',   icon: '#EF4444' },
                    amber:   { bg: 'rgba(245,158,11,0.05)',  border: 'rgba(245,158,11,0.2)',  icon: '#F59E0B' },
                    orange:  { bg: 'rgba(249,115,22,0.05)',  border: 'rgba(249,115,22,0.2)',  icon: '#F97316' },
                    emerald: { bg: 'rgba(16,185,129,0.05)',  border: 'rgba(16,185,129,0.2)',  icon: '#10B981' },
                  };
                  const cs = colorStyles[insightColor] || colorStyles.blue;

                  return (
                    <div className="md:col-span-3 rounded-[2.5rem] p-8 flex items-center gap-8" style={{ background: cs.bg, border: `1px solid ${cs.border}` }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${cs.icon}30` }}>
                        <TrendingUp className="w-8 h-8" style={{ color: cs.icon }} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black mb-2">{insightTitle}</h4>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                          {insightBody}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* SECTION 2: DETAILED ANSWERS */}
          {activeTab === 'answers' && (
            <motion.div 
              key="answers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {questions.map((q, i) => (
                <div key={i} className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm">
                        {i + 1}
                      </div>
                      <h4 className="text-xl font-black max-w-2xl">{q.questionText}</h4>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Score: {q.metrics?.technicalCorrectness || q.metrics?.communicationSkills || 0}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Answer</p>
                      <div className="p-6 bg-white/5 rounded-2xl italic text-slate-400 text-sm leading-relaxed border border-white/5">
                        "{q.userAnswer || 'No answer recorded.'}"
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">AI Feedback</p>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 flex gap-4">
                          <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <span className="font-bold text-blue-500">Why?</span> {q.resumeContext || "Evaluating technical logic."}
                          </p>
                        </div>
                        <div className="p-4 bg-emerald-600/5 rounded-2xl border border-emerald-500/10 flex gap-4">
                          <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <span className="font-bold text-emerald-500">How to improve?</span> {q.metrics?.feedback || "Structure your answer using the STAR method."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* SECTION 3: BEHAVIORAL ANALYSIS */}
          {activeTab === 'behavior' && (
            <motion.div 
              key="behavior"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Top stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Avg Eye Contact', value: `${avgEyeContact}%`, color: '#3B82F6', note: avgEyeContact >= 70 ? '✓ Good' : avgEyeContact > 0 ? '↑ Improve' : 'No data' },
                  { label: 'Avg Attention',   value: `${avgAttention}%`, color: '#8B5CF6', note: avgAttention >= 70 ? '✓ Good' : avgAttention > 0 ? '↑ Improve' : 'No data' },
                  { label: 'Filler Words',    value: totalFillers,        color: totalFillers > 10 ? '#EF4444' : '#10B981', note: totalFillers > 10 ? 'Needs Work' : totalFillers > 0 ? 'Decent' : 'No data' },
                  { label: 'Avg Pace (WPM)',  value: avgWpm ?? '—',       color: '#F59E0B', note: avgWpm ? (avgWpm >= 120 && avgWpm <= 160 ? '✓ Perfect' : '↑ Adjust') : 'No data' },
                ].map((s, i) => (
                  <div key={i} className="bg-[#151821] border border-white/5 rounded-[2rem] p-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{s.label}</p>
                    <p className="text-3xl font-black mb-2" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] font-bold text-slate-400">{s.note}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Eye Contact Chart - per question */}
                <div className="lg:col-span-2 bg-[#151821] border border-white/5 rounded-[3rem] p-10">
                  <div className="flex items-center justify-between mb-10">
                    <h4 className="text-xl font-black">Eye Contact &amp; Attention — Per Question</h4>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Eye</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-purple-500 rounded-full" /> Attention</div>
                    </div>
                  </div>
                  {hasRealEyeData ? (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayChart}>
                          <defs>
                            <linearGradient id="colorEye" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="time" stroke="#475569" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                          <YAxis stroke="#475569" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(v, name) => [`${v}%`, name === 'eye' ? 'Eye Contact' : 'Attention']}
                          />
                          <Area type="monotone" dataKey="eye" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorEye)" />
                          <Area type="monotone" dataKey="attention" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-72 flex flex-col items-center justify-center text-center gap-4">
                      <Eye className="w-12 h-12 text-slate-600" />
                      <p className="text-sm font-bold text-slate-500">No behavioral data recorded yet.</p>
                      <p className="text-xs text-slate-600 max-w-xs">Eye contact &amp; attention scores are captured during the interview and saved per question.</p>
                    </div>
                  )}
                </div>

                {/* Fillers & Pace */}
                <div className="space-y-6">
                  <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5">Filler Words Detected</h4>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 mb-5">
                      <span className="text-2xl font-black">{totalFillers}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        totalFillers === 0 ? 'text-slate-400' : totalFillers > 10 ? 'text-red-500' : 'text-amber-400'
                      }`}>
                        {totalFillers === 0 ? 'No Data' : totalFillers > 10 ? 'Needs Work' : 'Decent'}
                      </span>
                    </div>
                    {displayFillerWords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {displayFillerWords.map((word, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                            {word}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Filler words not tracked for this session.</p>
                    )}
                  </div>

                  <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5">Average Pace</h4>
                    {avgWpm ? (
                      <>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-3xl font-black">{avgWpm}</div>
                          <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            avgWpm >= 120 && avgWpm <= 160 
                              ? 'text-emerald-500 bg-emerald-500/10' 
                              : avgWpm > 160 
                              ? 'text-red-400 bg-red-500/10' 
                              : 'text-amber-400 bg-amber-500/10'
                          }`}>
                            {avgWpm >= 120 && avgWpm <= 160 ? 'Perfect' : avgWpm > 160 ? 'Too Fast' : 'Slow'}
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Words per minute</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-600 font-bold">WPM not recorded for this session.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Per-Question Behavioral Breakdown */}
              <div className="bg-[#151821] border border-white/5 rounded-[3rem] p-10">
                <h4 className="text-xl font-black mb-8">Per-Question Behavioral Breakdown</h4>
                <div className="space-y-4">
                  {questions.map((q, i) => {
                    const eye = q.metrics?.eyeContactScore ?? null;
                    const att = q.metrics?.attentionScore ?? null;
                    const expr = q.metrics?.behaviorSummary || null;
                    return (
                      <div key={i} className="flex items-center gap-6 p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                        <div className="w-8 h-8 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center text-xs font-black shrink-0">
                          Q{i + 1}
                        </div>
                        <p className="flex-1 text-sm text-slate-400 truncate">{q.questionText}</p>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Eye</p>
                            <p className={`text-sm font-black ${
                              eye === null ? 'text-slate-600' : eye >= 70 ? 'text-emerald-400' : 'text-red-400'
                            }`}>{eye !== null ? `${eye}%` : '—'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Attention</p>
                            <p className={`text-sm font-black ${
                              att === null ? 'text-slate-600' : att >= 70 ? 'text-emerald-400' : 'text-amber-400'
                            }`}>{att !== null ? `${att}%` : '—'}</p>
                          </div>
                          {expr && (
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 border border-white/5">
                              {expr}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 4: VIDEO PLAYBACK */}
          {activeTab === 'video' && (
            <motion.div 
              key="video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {data?.videoUrl ? (
                <>
                  {/* Video Player Card */}
                  <div className="bg-[#151821] border border-white/5 rounded-[3rem] p-10 overflow-hidden shadow-2xl">
                    {/* Player */}
                    <div className="aspect-video bg-black rounded-[2rem] overflow-hidden mb-8 relative group shadow-2xl shadow-black/60">
                      <video
                        id="interview-playback"
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                        src={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : (import.meta.env.PROD ? window.location.origin : 'http://localhost:5001')}${data.videoUrl}`}
                      >
                        Your browser does not support video playback.
                      </video>

                      {/* Overlay gradient (fades at top/bottom for cinematic look) */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-black">Interview Recording</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                          Session ID: {id?.slice(-8)}
                        </p>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : (import.meta.env.PROD ? window.location.origin : 'http://localhost:5001')}${data.videoUrl}`}
                        download={`speakease-interview-${id?.slice(-8)}.webm`}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download .webm
                      </a>
                    </div>
                  </div>

                  {/* AI Feedback Timeline — built from real per-question data */}
                  {(() => {
                    // Generate timeline events from actual per-question behavioral metrics
                    const timelineEvents = [];
                    questions.forEach((q, i) => {
                      const m = q.metrics || {};
                      const tag = `Q${i + 1}`;

                      // Low eye contact
                      if (m.eyeContactScore != null && m.eyeContactScore < 50) {
                        timelineEvents.push({ tag, label: `Low Eye Contact (${m.eyeContactScore}%)`, color: 'red', severity: 3, pos: ((i + 0.5) / questions.length) * 100 });
                      }
                      // Low attention
                      if (m.attentionScore != null && m.attentionScore < 50) {
                        timelineEvents.push({ tag, label: `Low Attention (${m.attentionScore}%)`, color: 'orange', severity: 2, pos: ((i + 0.5) / questions.length) * 100 });
                      }
                      // High filler count
                      if (m.fillerCount != null && m.fillerCount > 5) {
                        timelineEvents.push({ tag, label: `High Fillers (${m.fillerCount})`, color: 'amber', severity: 2, pos: ((i + 0.5) / questions.length) * 100 });
                      }
                      // Pace issues
                      if (m.wpm != null && m.wpm > 0) {
                        if (m.wpm > 170) {
                          timelineEvents.push({ tag, label: `Pace Too Fast (${m.wpm} WPM)`, color: 'orange', severity: 1, pos: ((i + 0.5) / questions.length) * 100 });
                        } else if (m.wpm < 90) {
                          timelineEvents.push({ tag, label: `Pace Too Slow (${m.wpm} WPM)`, color: 'amber', severity: 1, pos: ((i + 0.5) / questions.length) * 100 });
                        }
                      }
                      // Nervous expression
                      if (m.behaviorSummary === 'Nervous') {
                        timelineEvents.push({ tag, label: 'Nervous Expression Detected', color: 'red', severity: 2, pos: ((i + 0.5) / questions.length) * 100 });
                      }
                      // Strong delivery
                      const eye = m.eyeContactScore ?? 0;
                      const att = m.attentionScore ?? 0;
                      if (eye >= 75 && att >= 75 && (m.fillerCount ?? 0) <= 2) {
                        timelineEvents.push({ tag, label: 'Strong Delivery ✓', color: 'emerald', severity: 0, pos: ((i + 0.5) / questions.length) * 100 });
                      }
                    });

                    // Colour map for inline styles (Tailwind dynamic classes don't purge well)
                    const colorMap = {
                      red:     { dot: '#EF4444', text: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                      orange:  { dot: '#F97316', text: '#F97316', bg: 'rgba(249,115,22,0.08)' },
                      amber:   { dot: '#F59E0B', text: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
                      emerald: { dot: '#10B981', text: '#10B981', bg: 'rgba(16,185,129,0.08)' },
                    };

                    return (
                      <div className="bg-[#151821] border border-white/5 rounded-[3rem] p-10">
                        <h4 className="text-xl font-black mb-8">AI Feedback Timeline</h4>

                        {timelineEvents.length > 0 ? (
                          <>
                            {/* Progress bar with dots */}
                            <div className="relative h-2 bg-white/5 rounded-full mb-8">
                              {timelineEvents.map((ev, idx) => (
                                <div
                                  key={idx}
                                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-4 border-[#151821] cursor-pointer hover:scale-125 transition-transform"
                                  style={{ left: `${Math.min(ev.pos, 95)}%`, background: colorMap[ev.color]?.dot || '#3B82F6' }}
                                  title={`${ev.tag}: ${ev.label}`}
                                />
                              ))}
                            </div>

                            {/* Event cards grid */}
                            <div className={`grid gap-4 ${timelineEvents.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                              {timelineEvents.slice(0, 8).map((ev, idx) => {
                                const c = colorMap[ev.color] || colorMap.amber;
                                return (
                                  <div key={idx} className="p-4 rounded-2xl border border-white/5" style={{ background: c.bg }}>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: c.text }}>{ev.tag}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{ev.label}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                            <BarChart3 className="w-10 h-10 text-slate-600" />
                            <p className="text-sm font-bold text-slate-500">No behavioral events recorded for this session.</p>
                            <p className="text-xs text-slate-600 max-w-md">Events like low eye contact, high filler usage, and pace anomalies are detected automatically during the interview.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                /* Empty state — no recording found */
                <div className="bg-[#151821] border border-white/5 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                    <Video className="w-12 h-12 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">No Recording Available</h3>
                  <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                    The interview recording wasn't saved or is still being processed.
                    Recordings are stored automatically when you complete an interview session.
                  </p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

const Loader2 = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default ReportDashboard;
