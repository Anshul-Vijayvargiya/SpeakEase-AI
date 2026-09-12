import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Zap, ChevronRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';

const ModeSelectionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'technical';
  const { setSkipResume, setInterviewType, setRole, setExperienceLevel } = useSessionStore();

  const handleChoice = (withResume) => {
    setSkipResume(!withResume);

    if (type === 'hr') {
      // HR has no role-selection step — mirrors Dashboard.jsx's existing HR click logic
      setInterviewType('hr');
      setRole({ title: 'Candidate', id: 'candidate', topics: [] });
      setExperienceLevel('Any');
      navigate(withResume ? '/setup/resume' : '/setup/check');
    } else {
      // Technical still needs role selection either way — resume upload is what's skipped
      navigate(`/setup/role?type=${type}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0c0e14] text-white p-6 md:p-12 overflow-hidden">
      {/* Ambient gradient mesh — same visual language as Dashboard.jsx */}
      <div className="pointer-events-none fixed top-[-8%] right-[8%] w-[42rem] h-[42rem] bg-blue-600/30 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed top-[6%] left-[32%] w-[36rem] h-[36rem] bg-purple-600/25 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[15%] w-[32rem] h-[32rem] bg-indigo-600/15 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Before You Start</p>
            <h1 className="text-3xl font-black tracking-tight">How would you like to prepare?</h1>
            <p className="text-slate-400 text-sm mt-2">Choose whether to personalize questions using your resume.</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleChoice(true)}
            className="relative h-72 p-10 rounded-[2.5rem] border cursor-pointer transition-all duration-300 overflow-hidden group bg-white/[0.06] backdrop-blur-lg border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.1] hover:border-blue-500/40 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-2">With Resume</h2>
              <p className="text-slate-400 text-sm font-medium">Personalized questions based on your background</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-blue-400 group-hover:gap-2.5 transition-all">
              Continue <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleChoice(false)}
            className="relative h-72 p-10 rounded-[2.5rem] border cursor-pointer transition-all duration-300 overflow-hidden group bg-white/[0.06] backdrop-blur-lg border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.1] hover:border-emerald-500/40 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-600/20">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-2">Without Resume</h2>
              <p className="text-slate-400 text-sm font-medium">Quick practice with standard role-based questions</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 group-hover:gap-2.5 transition-all">
              Continue <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelectionPage;
