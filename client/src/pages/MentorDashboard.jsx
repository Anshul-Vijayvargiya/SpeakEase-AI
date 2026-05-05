// components/MentorDashboard.jsx
import React from 'react';
import { Lightbulb, MessageSquare, Zap, Target, TrendingUp, AlertCircle } from 'lucide-react';

const MentorDashboard = ({ analysis, messages, isRecording }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto p-6">
      
      {/* LEFT: The AI Interviewer (One-to-One) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 flex flex-col h-[600px] overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Simulation</span>
            {isRecording && <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> <span className="text-xs font-black text-red-500 uppercase">AI is Listening</span></div>}
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-5 rounded-[2rem] text-sm font-bold ${m.role === "user" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-800"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: The Mentor Insight Panel */}
      <div className="lg:col-span-4 space-y-6 animate-in slide-in-from-right-8 duration-500">
        
        {/* Real-time Improvement Card */}
        <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} className="text-yellow-300" />
            <span className="text-[10px] font-black uppercase tracking-widest">Mentor's Suggestion</span>
          </div>
          <p className="text-sm font-bold italic leading-relaxed">
            {analysis?.quickFix || "Speak clearly. I'll provide real-time rephrasing here as you answer technical questions."}
          </p>
        </div>

        {/* Multi-Way Answer Suggestions */}
        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
            <MessageSquare size={14} /> Rephrase Your Answer
          </h3>
          <div className="space-y-4">
            <ImprovementPill type="Professional" text={analysis?.proVersion || "Waiting for your response..."} />
            <ImprovementPill type="Technical" text={analysis?.techVersion || "Waiting for your response..."} />
          </div>
        </div>

        {/* Emotion & Confidence Tracking */}
        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4">Confidence Analysis</h3>
          <div className="space-y-4">
             <MetricBar label="Fluency" value={analysis?.fluency || 0} color="bg-emerald-500" />
             <MetricBar label="Emotion" value={analysis?.emotionScore || 0} labelValue={analysis?.emotionType || "Neutral"} color="bg-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ImprovementPill = ({ type, text }) => (
  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-500 transition-colors">
    <p className="text-[8px] font-black uppercase text-blue-600 mb-1">{type} Way</p>
    <p className="text-xs font-bold text-slate-700 leading-snug">{text}</p>
  </div>
);

const MetricBar = ({ label, value, color, labelValue }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500">{label}</span><span className="text-[10px] font-black text-slate-800">{labelValue || `${value}%`}</span></div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} /></div>
  </div>
);

export default MentorDashboard;