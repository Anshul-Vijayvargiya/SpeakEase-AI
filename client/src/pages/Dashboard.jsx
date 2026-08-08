import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Play, BarChart3, Clock,
  ChevronRight, Star, Trophy, Zap, MessageSquare 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import useAuthStore from '../store/authStore';
import useSessionStore from '../store/sessionStore';
import useSidebarStore from '../store/sidebarStore';
import API from '../api';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    bestScore: 0,
    currentStreak: 0,
    recentSessions: [],
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const userId = user?._id || localStorage.getItem("userId");
        if (!userId) return;
        const res = await API.get(`/dashboard/${userId}`);
        setStats(res.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchDashboard();
  }, [user]);

  const statsArray = [
    { label: 'Total Interviews', value: stats.totalInterviews, icon: <Play className="w-5 h-5" />, color: 'bg-blue-500' },
    { label: 'Avg Score', value: `${stats.avgScore}%`, icon: <BarChart3 className="w-5 h-5" />, color: 'bg-emerald-500' },
    { label: 'Best Score', value: `${stats.bestScore}%`, icon: <Trophy className="w-5 h-5" />, color: 'bg-amber-500' },
    { label: 'Current Streak', value: `${stats.currentStreak} ${stats.currentStreak === 1 ? 'Day' : 'Days'}`, icon: <Zap className="w-5 h-5" />, color: 'bg-purple-500' },
  ];

  return (
    <div className="relative min-h-screen bg-[#0c0e14] flex overflow-hidden">
      {/* Ambient gradient mesh — gives the glass panels something colorful to blur against */}
      <div className="pointer-events-none fixed top-[-8%] right-[8%] w-[42rem] h-[42rem] bg-blue-600/30 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed top-[6%] left-[32%] w-[36rem] h-[36rem] bg-purple-600/25 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[15%] w-[32rem] h-[32rem] bg-indigo-600/15 rounded-full blur-3xl" />

      <Sidebar />

      <main className={`relative z-10 flex-1 p-10 transition-all duration-200 ease-in-out ${collapsed ? 'ml-[72px]' : 'ml-72'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-400 font-medium">Ready to master your next interview?</p>
          </div>

        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statsArray.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.06] backdrop-blur-lg border border-white/[0.12] p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.1] hover:border-white/20 transition-all"
            >
              <div className={`${stat.color}/10 ${stat.color.replace('bg-', 'text-')} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <p className="text-slate-400 text-sm font-bold mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Start New Interview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Technical Card */}
          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => navigate('/setup/role?type=technical')}
            className="group relative h-64 bg-gradient-to-br from-blue-600 to-indigo-700 border border-white/[0.12] rounded-[3rem] p-10 flex flex-col justify-between overflow-hidden cursor-pointer shadow-2xl shadow-blue-900/20"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-40 h-40 text-white fill-white" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <Play className="text-white w-6 h-6 fill-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Technical Interview</h2>
              <p className="text-blue-100 font-medium text-sm">Practice system design & conceptual topics.</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-white font-bold text-sm">
              Start Now <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>

          {/* HR Card */}
          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => {
              useSessionStore.getState().setInterviewType('hr');
              useSessionStore.getState().setRole({ title: 'Candidate', id: 'candidate', topics: [] });
              useSessionStore.getState().setExperienceLevel('Any');
              navigate('/setup/resume');
            }}
            className="group relative h-64 bg-gradient-to-br from-purple-600 to-pink-700 border border-white/[0.12] rounded-[3rem] p-10 flex flex-col justify-between overflow-hidden cursor-pointer shadow-2xl shadow-purple-900/20"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <MessageSquare className="w-40 h-40 text-white fill-white" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <Play className="text-white w-6 h-6 fill-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">HR Interview</h2>
              <p className="text-purple-100 font-medium text-sm">Master behavioral questions and cultural fit.</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-white font-bold text-sm">
              Start Now <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>


      </main>
    </div>
  );
};

export default Dashboard;