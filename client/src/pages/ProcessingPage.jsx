import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Zap, Brain, CheckCircle2, Search } from 'lucide-react';
import API from '../api';

const ProcessingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Analysing your interview transcript...');

  const steps = [
    { threshold: 25, text: 'Analysing technical accuracy...' },
    { threshold: 50, text: 'Evaluating behavioral responses...' },
    { threshold: 75, text: 'Calculating confidence scores...' },
    { threshold: 90, text: 'Finalizing your performance report...' },
  ];

  useEffect(() => {
    let interval;
    
    const checkStatus = async () => {
      try {
        const res = await API.get(`/interview/${id}/status`);
        if (res.data.status === 'done' || res.data.status === 'Completed') {
          setProgress(100);
          setStatusText('Report ready! Redirecting...');
          setTimeout(() => navigate(`/report/${id}`), 1500);
          clearInterval(interval);
        } else {
          // Increment progress artificially while polling
          setProgress(prev => {
            const next = prev + (Math.random() * 5);
            return next > 95 ? 95 : next;
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    interval = setInterval(checkStatus, 3000);
    checkStatus(); // Initial check

    return () => clearInterval(interval);
  }, [id, navigate]);

  useEffect(() => {
    const step = steps.find(s => progress <= s.threshold);
    if (step) setStatusText(step.text);
  }, [progress]);

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-10 text-white overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10 max-w-lg w-full"
      >
        <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] border border-blue-500/20 flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-blue-500/20 relative">
          <Brain className="w-10 h-10 text-blue-500" />
          <div className="absolute inset-0 border-4 border-t-blue-500 border-white/5 rounded-[2.5rem] animate-spin" />
        </div>

        <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">
          AI is generating your report
        </h1>
        <p className="text-slate-400 font-bold mb-12 flex items-center justify-center gap-2">
          {progress < 100 ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {statusText}
        </p>

        {/* Progress Bar Container */}
        <div className="space-y-4">
          <div className="h-4 bg-white/5 rounded-full border border-white/5 p-1 relative overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-lg shadow-blue-500/40"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>Analysing</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-4">
          {[
            { icon: <Zap className="w-4 h-4" />, label: 'Technical Accuracy' },
            { icon: <Search className="w-4 h-4" />, label: 'Iris Gaze Analysis' },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="text-blue-500">{item.icon}</div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingPage;
