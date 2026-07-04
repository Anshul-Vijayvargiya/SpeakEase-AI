import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Terminal, Cpu, Monitor, Layers, 
  Server, Globe, Database, Settings, Play, ChevronRight, Zap
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import API from '../api';
import toast from 'react-hot-toast';

const topics = [
  { id: "frontend",     icon: Monitor,    title: "Frontend (React, DOM)",    color: "from-blue-500 to-cyan-500" },
  { id: "backend",      icon: Server,     title: "Backend (APIs, DBs)",      color: "from-green-500 to-emerald-500" },
  { id: "dsa",          icon: Terminal,   title: "Data Structures & Algos",  color: "from-purple-500 to-fuchsia-500" },
  { id: "fullstack",    icon: Layers,     title: "Full Stack (MERN)",        color: "from-indigo-500 to-blue-500" },
  { id: "devops",       icon: Settings,   title: "DevOps & Cloud",           color: "from-slate-400 to-zinc-500" }
];

const difficulties = ['Easy', 'Medium', 'Hard'];
const languages = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' }
];

const CodingSetupPage = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState(topics[2]); // Default DSA
  const [difficulty, setDifficulty] = useState('Medium');
  const [language, setLanguage] = useState(languages[0]);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      // Generate problem
      const res = await API.post('/coding/generate', {
        topic: selectedTopic.title,
        difficulty,
        language: language.id
      });
      navigate(`/coding/${res.data.sessionId}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate coding problem');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Coding Round</p>
            <h1 className="text-3xl font-black tracking-tight">Configure Your Session</h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Configuration Sections */}
        <div className="space-y-10">
          
          {/* Topic Selection */}
          <div>
            <h2 className="text-lg font-bold text-slate-300 mb-4">Select Topic</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedTopic.id === topic.id;
                return (
                  <motion.div
                    key={topic.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTopic(topic)}
                    className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'bg-[#1a1f2e] border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'bg-[#151821] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${topic.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-white">{topic.title}</h3>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold text-slate-300 mb-4">Difficulty</h2>
              <div className="flex flex-wrap gap-3">
                {difficulties.map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold border transition-all duration-300 ${
                      difficulty === level
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-[#151821] border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-300 mb-4">Preferred Language</h2>
              <div className="flex flex-wrap gap-3">
                {languages.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold border transition-all duration-300 ${
                      language.id === lang.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-[#151821] border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Start Button */}
        <div className="mt-16 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={loading}
            className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-emerald-900/40 flex items-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Problem...
              </>
            ) : (
              <>
                Start Coding Round <Play className="w-5 h-5 fill-white" />
              </>
            )}
          </motion.button>
        </div>

      </div>
    </div>
  );
};

export default CodingSetupPage;
