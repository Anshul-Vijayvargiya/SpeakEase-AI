import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Zap, Star, Sparkles, TrendingUp, Info } from 'lucide-react';

const ResumeInsights = ({ analysis }) => {
    if (!analysis) return (
        <div className="h-full flex items-center justify-center p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div>
                <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Resume analysis will appear here after upload.</p>
            </div>
        </div>
    );

    const { score, summary, strengths, improvements, missingKeywords, formattingTips } = analysis;

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-20 h-20 text-blue-600" />
                </div>
                
                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32" cy="32" r="28"
                                stroke="currentColor" strokeWidth="4" fill="transparent"
                                className="text-blue-100"
                            />
                            <circle
                                cx="32" cy="32" r="28"
                                stroke="currentColor" strokeWidth="4" fill="transparent"
                                strokeDasharray={176}
                                strokeDashoffset={176 - (176 * score) / 100}
                                className="text-blue-600 transition-all duration-1000"
                            />
                        </svg>
                        <span className="absolute text-lg font-black text-blue-700">{score}</span>
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800">Resume Score</h4>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> AI Analysis Complete
                        </p>
                    </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium relative z-10">
                    {summary}
                </p>
            </div>

            <div className="grid gap-4">
                {/* Strengths */}
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Top Strengths
                    </h5>
                    <div className="space-y-2">
                        {strengths?.slice(0, 3).map((s, i) => (
                            <div key={i} className="flex gap-3 items-start p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-xs font-bold text-slate-700">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                {s}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Improvements */}
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap className="w-3 h-3 text-blue-500 fill-blue-500" /> How to Improve
                    </h5>
                    <div className="space-y-2">
                        {improvements?.slice(0, 3).map((imp, i) => (
                            <div key={i} className="flex gap-3 items-start p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 text-xs font-bold text-slate-700">
                                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                {imp}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keywords */}
                {missingKeywords?.length > 0 && (
                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Keywords to Add</h5>
                        <div className="flex flex-wrap gap-2">
                            {missingKeywords.map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-white text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 shadow-sm">
                                    + {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ResumeInsights;
