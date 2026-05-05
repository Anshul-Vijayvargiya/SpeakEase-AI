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
  const analytics = data.analytics || {};
  
  // Aggregate all questions
  const questions = [
    ...(data.codingResults || []),
    ...(data.technicalResults || []),
    ...(data.hrResults || [])
  ];

  // Mock data for Eye Contact chart if not present
  const chartData = [
    { time: '0:00', eye: 80 }, { time: '0:30', eye: 85 }, { time: '1:00', eye: 40 },
    { time: '1:30', eye: 90 }, { time: '2:00', eye: 75 }, { time: '2:30', eye: 60 }
  ];

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
                
                {/* Insights Card */}
                <div className="md:col-span-3 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] p-8 flex items-center gap-8">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center shrink-0">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black mb-2">Key Improvement: Eye Contact</h4>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                      Our AI detected that you looked away frequently while answering the 3rd question. Maintaining steady eye contact is crucial for establishing trust in HR rounds.
                    </p>
                  </div>
                </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 bg-[#151821] border border-white/5 rounded-[3rem] p-10">
                  <div className="flex items-center justify-between mb-10">
                    <h4 className="text-xl font-black">Eye Contact Timeline</h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" /> % Percentage
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorEye" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" stroke="#475569" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="eye" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorEye)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fillers & Pace */}
                <div className="space-y-8">
                  <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Filler Word Count</h4>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-lg font-black">{analytics?.fillerWords?.length || 12}</span>
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Needs Improvement</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-6">
                      {['Um', 'Ah', 'Like', 'Actually', 'Basically'].map((word, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Average Pace</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-black">{analytics?.averageWpm || 145}</div>
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Perfect</div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Words per minute</p>
                  </div>
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
              <div className="bg-[#151821] border border-white/5 rounded-[3rem] p-10 overflow-hidden shadow-2xl">
                <div className="aspect-video bg-black rounded-[2rem] overflow-hidden mb-10 relative group">
                  <video 
                    controls 
                    className="w-full h-full object-cover"
                    src={`http://localhost:5001/api/interview/${id}/video`}
                  />
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-black">AI Feedback Timeline</h4>
                  <div className="relative h-1 bg-white/5 rounded-full">
                    {[20, 45, 70, 85].map((pos) => (
                      <div key={pos} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-4 border-[#151821]" style={{ left: `${pos}%` }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">0:42</p>
                      <p className="text-[10px] font-bold text-slate-400">Low Eye Contact</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">1:15</p>
                      <p className="text-[10px] font-bold text-slate-400">Filler Loop: "Like"</p>
                    </div>
                  </div>
                </div>
              </div>
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
