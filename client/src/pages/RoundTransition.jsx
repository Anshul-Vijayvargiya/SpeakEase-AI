import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Users, ArrowRight } from 'lucide-react';

const RoundTransition = ({ from, to, onContinue }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0f1117] flex flex-col items-center justify-center p-6 text-white text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-24 h-24 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center mb-8 border border-emerald-500/30"
      >
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">
          {from} Round Completed!
        </h2>
        <p className="text-slate-400 mb-12 max-w-md mx-auto text-lg leading-relaxed">
          Great job. You've completed the technical assessment. Now, let's move to the 
          <span className="text-purple-400 font-bold uppercase ml-1">{to} Round</span> 
          to evaluate your behavioral fit.
        </p>

        <div className="grid grid-cols-2 gap-6 mb-12 max-w-sm mx-auto">
          <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
            <Zap className="w-6 h-6 text-blue-500 mb-2 mx-auto" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</p>
            <p className="text-sm font-bold">{from}</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <Users className="w-6 h-6 text-purple-500 mb-2 mx-auto" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Up</p>
            <p className="text-sm font-bold">{to}</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="group h-16 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all mx-auto"
        >
          Begin {to} Round <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] opacity-10" />
    </div>
  );
};

export default RoundTransition;
