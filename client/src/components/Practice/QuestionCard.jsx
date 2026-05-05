import React from 'react';
import { Bot, Eye } from 'lucide-react';

const QuestionCard = ({ question, companyName, onPractice, onViewAnswer }) => {
    return (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-300 relative overflow-hidden group h-full flex flex-col">
            {/* Subtle Gradient Accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex flex-col h-full pl-2">
                <div className="flex items-start justify-between mb-3 gap-4">
                    <h3 className="text-xl font-bold text-slate-800 leading-snug">{question.title}</h3>
                    <div className="flex gap-2">
                        {companyName && (
                            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full shrink-0 bg-blue-100 text-blue-700">
                                {companyName}
                            </span>
                        )}
                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full shrink-0 ${question.difficulty === 'Hard' ? 'bg-rose-100 text-rose-700' :
                            question.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
                            {question.difficulty}
                        </span>
                    </div>
                </div>

                <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2">
                    {question.explanation}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                    <button
                        onClick={() => onPractice(question)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all text-sm flex justify-center items-center gap-2"
                    >
                        <Bot className="w-4 h-4" /> Practice
                    </button>

                    <button
                        onClick={() => onViewAnswer(question)}
                        className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all text-sm shadow-sm hover:shadow-md flex justify-center items-center gap-2"
                    >
                        <Eye className="w-4 h-4" /> View Answer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionCard;
