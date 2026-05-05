import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Edit3, User, Briefcase, Code2, BookOpen, FolderOpen } from 'lucide-react';

const Chip = ({ label, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200',
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        slate: 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colors[color] || colors.blue}`}>
            {label}
        </span>
    );
};

const Section = ({ icon: Icon, title, children, color = 'blue' }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50',
        purple: 'text-purple-600 bg-purple-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50'
    };
    return (
        <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">{title}</h3>
            </div>
            {children}
        </div>
    );
};

const ResumePreview = ({ data, onConfirm, onEdit }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = () => {
        setLoading(true);
        setTimeout(() => onConfirm(data), 300);
    };

    const expBadgeColor = {
        Intern: 'slate',
        Junior: 'emerald',
        'Mid-Level': 'blue',
        Senior: 'purple',
        Lead: 'purple'
    }[data?.experienceLevel] || 'blue';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-white w-full max-w-2xl max-h-[88vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Resume Parsed Successfully</p>
                                <h2 className="text-white font-black text-lg">Preview Your Profile</h2>
                            </div>
                        </div>
                        <button
                            onClick={onEdit}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        {/* Identity */}
                        <div className="flex items-start gap-4 pb-5 mb-5 border-b border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shrink-0">
                                {(data?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-black text-slate-800 truncate">{data?.name || 'Unknown Name'}</h3>
                                <p className="text-slate-500 font-medium text-sm mt-0.5">{data?.role || 'Role not detected'}</p>
                                {data?.summary && (
                                    <p className="text-slate-600 text-sm mt-2 leading-relaxed">{data.summary}</p>
                                )}
                            </div>
                            <Chip label={data?.experienceLevel || 'Mid-Level'} color={expBadgeColor} />
                        </div>

                        {/* Tech Stack */}
                        {(data?.techStack?.length > 0 || data?.skills?.length > 0) && (
                            <Section icon={Code2} title="Tech Stack & Skills" color="blue">
                                <div className="flex flex-wrap gap-2">
                                    {(data?.techStack || []).map((s, i) => (
                                        <Chip key={`ts-${i}`} label={s} color="blue" />
                                    ))}
                                    {(data?.skills || [])
                                        .filter(s => !(data?.techStack || []).includes(s))
                                        .slice(0, 8)
                                        .map((s, i) => (
                                            <Chip key={`sk-${i}`} label={s} color="slate" />
                                        ))}
                                </div>
                            </Section>
                        )}

                        {/* Projects */}
                        {data?.projects?.length > 0 && (
                            <Section icon={FolderOpen} title="Projects" color="purple">
                                <div className="space-y-2">
                                    {data.projects.slice(0, 3).map((p, i) => (
                                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="font-bold text-slate-800 text-sm">{p.title}</p>
                                            {p.description && (
                                                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{p.description}</p>
                                            )}
                                            {p.techStack?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {p.techStack.slice(0, 5).map((t, j) => (
                                                        <Chip key={j} label={t} color="purple" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Experience */}
                        {data?.experience?.length > 0 && (
                            <Section icon={Briefcase} title="Experience" color="emerald">
                                <div className="space-y-2">
                                    {data.experience.slice(0, 2).map((e, i) => (
                                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-800 text-sm">{e.role}</p>
                                                <span className="text-xs text-slate-400 shrink-0 ml-2">{e.duration}</span>
                                            </div>
                                            <p className="text-slate-500 text-xs font-medium">{e.company}</p>
                                            {e.description && (
                                                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{e.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Education */}
                        {data?.education?.length > 0 && (
                            <Section icon={BookOpen} title="Education" color="amber">
                                <div className="space-y-2">
                                    {data.education.slice(0, 2).map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{e.degree}</p>
                                                <p className="text-slate-500 text-xs">{e.institution}</p>
                                            </div>
                                            <span className="text-xs text-slate-400">{e.year}</span>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* No data notice */}
                        {!data?.name && !data?.skills?.length && (
                            <div className="text-center py-8 text-slate-400">
                                <p className="font-medium">Limited data was extracted.</p>
                                <p className="text-sm mt-1">You can continue and fill details manually.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition text-sm"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Manually
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 px-5 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {loading ? 'Confirming...' : 'Looks Good — Continue'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ResumePreview;
