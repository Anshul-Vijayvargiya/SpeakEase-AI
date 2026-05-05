import React, { useState } from 'react';
import { Layers, Building2 } from 'lucide-react';

const Sidebar = ({ activeTopic, setActiveTopic, topics, activeMode, setActiveMode, companies, targetCompanies }) => {
    const isTarget = (companyTitle) => targetCompanies.some(tc => tc.toLowerCase() === companyTitle.toLowerCase());
    return (
        <aside className="w-72 bg-white/60 backdrop-blur-md border-r border-slate-200 h-screen sticky top-0 flex flex-col py-6 px-4 shrink-0 overflow-y-auto hidden md:flex z-10">
            <div className="mb-8 px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    P
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Practice
                </h1>
            </div>

            <div className="flex bg-slate-100 p-1 mb-6 rounded-xl">
                <button
                    onClick={() => setActiveMode('topics')}
                    className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition ${activeMode === 'topics' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layers className="w-4 h-4" /> Topics
                </button>
                <button
                    onClick={() => setActiveMode('companies')}
                    className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition ${activeMode === 'companies' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Building2 className="w-4 h-4" /> Companies
                </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
                {activeMode === 'topics' && topics.map((topic) => (
                    <button
                        key={topic.id}
                        onClick={() => setActiveTopic(topic.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm font-medium ${activeTopic === topic.id
                            ? 'bg-blue-50/80 text-blue-700 font-semibold shadow-sm border border-blue-100 border-l-4 border-l-blue-500'
                            : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 border border-transparent'
                            }`}
                    >
                        <span className="text-lg">{topic.icon}</span>
                        <span className="truncate">{topic.title}</span>
                    </button>
                ))}

                {activeMode === 'companies' && companies.map((company) => {
                    const targeted = isTarget(company.title);
                    return (
                        <button
                            key={company.id}
                            onClick={() => setActiveTopic(company.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group border ${activeTopic === company.id
                                ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-sm border-indigo-100 border-l-4 border-l-indigo-500'
                                : targeted
                                    ? 'bg-amber-50/50 text-amber-700 border-amber-200/50 hover:bg-amber-50'
                                    : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-lg">{company.icon}</span>
                                <span className="truncate">{company.title}</span>
                            </div>
                            {targeted && (
                                <span className="text-[9px] font-black uppercase tracking-tighter bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded leading-none">Targeted</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="mt-auto px-4 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium text-center">SpeakEase Learning &copy; 2026</p>
            </div>
        </aside>
    );
};

export default Sidebar;
