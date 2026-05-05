import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../api';

const ProgressPage = () => {
  const [progressData, setProgressData] = useState({ chartData: [], weakAreas: [], totalSessions: 0 });

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const userId = localStorage.getItem("userId") || JSON.parse(localStorage.getItem("user") || "{}")._id;
        if (!userId) return;
        const res = await API.get(`/progress/${userId}`);
        setProgressData(res.data);
      } catch (err) {
        console.error("Progress fetch error:", err);
      }
    };
    fetchProgress();
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0e14] flex text-white">
      <Sidebar />
      <main className="flex-1 ml-72 p-10">
        <h1 className="text-3xl font-black mb-8">Your Progress</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#151821] p-8 rounded-[2.5rem] border border-white/5">
            <h2 className="text-xl font-black mb-4">Total Sessions: {progressData.totalSessions}</h2>
            <div className="text-sm text-slate-400">Chart data points available: {progressData.chartData.length}</div>
            {/* Implement actual charting library later if needed */}
            <div className="mt-4 space-y-2">
              {progressData.chartData.map((d, i) => (
                <div key={i} className="flex justify-between border-b border-white/5 py-2">
                  <span>{d.date}</span>
                  <span className="text-emerald-500 font-bold">{d.overall}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#151821] p-8 rounded-[2.5rem] border border-white/5">
            <h2 className="text-xl font-black mb-4 text-red-400">Areas to Improve</h2>
            <div className="space-y-4">
              {progressData.weakAreas.length > 0 ? progressData.weakAreas.map((area, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                  <span className="font-bold">{area.topic}</span>
                  <span className="text-red-400 font-black">{area.avg}% Avg</span>
                </div>
              )) : (
                <div className="text-slate-500">No weak areas identified yet! Keep up the good work.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProgressPage;
