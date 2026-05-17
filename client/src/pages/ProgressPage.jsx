import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import API from '../api';
import {
  TrendingUp, Target, CheckCircle2, AlertTriangle
} from 'lucide-react';

// ── Main ProgressPage ───────────────────────────────────────────────────────
const ProgressPage = () => {
  const [progressData, setProgressData] = useState({ chartData: [], weakAreas: [], totalSessions: 0 });

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const userId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user') || '{}')._id;
        if (!userId) return;
        const res = await API.get(`/progress/${userId}`);
        setProgressData(res.data);
      } catch (err) {
        console.error('Progress fetch error:', err);
      }
    };
    fetchProgress();
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0e14] flex text-white">
      <Sidebar />
      <main className="flex-1 ml-72 p-10 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-blue-400" /> Your Progress
          </h1>
          <p className="text-slate-400">Track your interview performance and resume strength over time.</p>
        </div>

        {/* ── Progress Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Session history */}
          <div className="bg-[#151821] p-8 rounded-[2.5rem] border border-white/5">
            <h2 className="text-xl font-black mb-1">Session History</h2>
            <p className="text-slate-500 text-sm mb-6">Total Sessions: <span className="text-white font-black">{progressData.totalSessions}</span></p>
            {progressData.chartData.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-slate-500">
                <Target className="w-10 h-10 opacity-30" />
                <p className="text-sm">No sessions yet. Complete an interview to see data.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {progressData.chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 w-20 shrink-0">{d.date}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${d.overall}%` }}
                        transition={{ delay: i * 0.05, duration: 0.8 }}
                      />
                    </div>
                    <span className="text-emerald-400 font-black text-sm w-10 text-right">{d.overall}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weak areas */}
          <div className="bg-[#151821] p-8 rounded-[2.5rem] border border-white/5">
            <h2 className="text-xl font-black mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Areas to Improve
            </h2>
            <p className="text-slate-500 text-sm mb-6">Topics that need more practice</p>
            {progressData.weakAreas.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-50" />
                <p className="text-sm">No weak areas identified yet! Keep it up 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {progressData.weakAreas.map((area, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="font-bold text-sm">{area.topic}</span>
                    <span className={`font-black text-sm px-3 py-1 rounded-full ${area.avg < 50 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {area.avg}% Avg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default ProgressPage;
