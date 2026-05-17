import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, Code, Server, Database, Globe, 
  Cpu, Layout, Settings, BarChart, Smartphone, 
  ChevronRight, ArrowLeft, Terminal, Briefcase,
  Monitor, Brain, Layers, ShieldCheck, X, 
  Sparkles, Loader2, Tag, BookOpen, Zap, Play
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import API from '../api';
import toast from 'react-hot-toast';

const roles = {
  technical: [
    { id: "frontend",     icon: Monitor,    title: "Frontend Developer",    topics: ["HTML/CSS", "JavaScript", "React/Vue"],         color: "from-blue-500 to-cyan-500" },
    { id: "backend",      icon: Server,     title: "Backend Developer",     topics: ["APIs", "Databases", "Server Architecture"],    color: "from-green-500 to-emerald-500" },
    { id: "fullstack",    icon: Layers,     title: "Full Stack Developer",  topics: ["Frontend", "Backend", "Databases"],            color: "from-violet-500 to-purple-500" },
    { id: "react",        icon: Cpu,        title: "React Developer",       topics: ["React", "Hooks", "State Management"],          color: "from-cyan-500 to-blue-500" },
    { id: "nodejs",       icon: Terminal,   title: "Node.js Developer",     topics: ["Node.js", "Express", "REST APIs"],             color: "from-lime-500 to-green-500" },
    { id: "python",       icon: Code,       title: "Python Developer",      topics: ["Python", "Django/Flask", "OOP"],               color: "from-yellow-500 to-orange-500" },
    { id: "java",         icon: Smartphone, title: "Java Developer",        topics: ["Java", "Spring Boot", "OOP"],                  color: "from-red-500 to-rose-500" },
    { id: "devops",       icon: Settings,   title: "DevOps Engineer",       topics: ["CI/CD", "Docker", "Kubernetes"],               color: "from-slate-400 to-zinc-500" },
    { id: "datascience",  icon: BarChart,   title: "Data Scientist",        topics: ["Python", "ML Models", "Statistics"],           color: "from-pink-500 to-rose-500" },
    { id: "ml",           icon: Brain,      title: "ML Engineer",           topics: ["Deep Learning", "TensorFlow", "NLP"],          color: "from-fuchsia-500 to-violet-500" },
    { id: "android",      icon: Smartphone, title: "Android Developer",     topics: ["Kotlin", "Android SDK", "Jetpack"],            color: "from-green-400 to-teal-500" },
    { id: "ios",          icon: Smartphone, title: "iOS Developer",         topics: ["Swift", "SwiftUI", "Xcode"],                   color: "from-gray-400 to-slate-500" },
  ],
  nontechnical: [
    { id: "pm",           icon: Briefcase,  title: "Product Manager",       topics: ["Roadmaps", "Agile", "Stakeholders"],          color: "from-blue-400 to-indigo-500" },
    { id: "ba",           icon: BarChart,   title: "Business Analyst",      topics: ["Requirements", "SQL", "Process Mapping"],     color: "from-teal-400 to-cyan-500" },
    { id: "uiux",         icon: Layout,     title: "UI/UX Designer",        topics: ["Figma", "User Research", "Wireframing"],      color: "from-pink-400 to-rose-500" },
    { id: "marketing",    icon: Globe,      title: "Digital Marketing",     topics: ["SEO", "Analytics", "Campaigns"],              color: "from-orange-400 to-amber-500" },
    { id: "dataanalyst",  icon: Search,     title: "Data Analyst",          topics: ["Excel", "SQL", "Power BI"],                   color: "from-purple-400 to-violet-500" },
    { id: "projectmgr",   icon: Briefcase,  title: "Project Manager",       topics: ["Planning", "Risk", "Team Management"],        color: "from-indigo-400 to-blue-500" },
  ]
};

const difficultyColors = {
  Beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Advanced: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const categoryColors = {
  Technical: 'text-blue-400 bg-blue-400/10',
  Behavioral: 'text-purple-400 bg-purple-400/10',
  'Project Deep-Dive': 'text-emerald-400 bg-emerald-400/10',
  'System Design': 'text-orange-400 bg-orange-400/10',
};

const QuestionPreviewModal = ({ role, experience, onClose, onContinue }) => {
  const { resumeData } = useSessionStore();
  const [questions, setQuestions] = useState([]);
  const [roleSummary, setRoleSummary] = useState('');
  const [keyTopics, setKeyTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchPreview = async () => {
      try {
        const payload = {
          targetRole: role.title,
          targetRoleId: role.id,
          experienceLevel: experience,
        };
        if (resumeData?.rawText || resumeData?.skills) {
          payload.resumeText = resumeData.rawText || 
            `Skills: ${(resumeData.skills || []).join(', ')}. Projects: ${(resumeData.projects || []).map(p => p.name).join(', ')}. Education: ${(resumeData.education || []).map(e => e.institution).join(', ')}.`;
        }
        const res = await API.post('/resume-analysis/questions-preview', payload);
        setQuestions(res.data.questions || []);
        setRoleSummary(res.data.roleSummary || '');
        setKeyTopics(res.data.keyTopics || []);
      } catch (err) {
        toast.error('Could not load question preview');
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [role]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl bg-[#111420] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className={`p-8 bg-gradient-to-r ${role.color} relative`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {React.createElement(role.icon, { className: 'w-5 h-5 text-white' })}
                </div>
                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">Question Preview</span>
              </div>
              <h2 className="text-2xl font-black text-white">{role.title}</h2>
              <p className="text-sm text-white/70 mt-1">{experience} Level • {questions.length} Sample Questions</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          {keyTopics.length > 0 && (
            <div className="relative z-10 flex flex-wrap gap-2 mt-4">
              {keyTopics.map((t, i) => (
                <span key={i} className="px-3 py-1 bg-white/20 text-white text-[11px] font-bold rounded-full border border-white/20">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full" />
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full absolute inset-0 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-bold text-white">Generating Questions</p>
                <p className="text-sm text-slate-400 mt-1">AI is crafting role-specific + resume-based questions…</p>
              </div>
            </div>
          ) : (
            <>
              {roleSummary && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Role Insight</span>
                  </div>
                  <p className="text-sm text-slate-300">{roleSummary}</p>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sample Interview Questions</span>
              </div>

              {questions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center text-[11px] font-black text-slate-400 shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${difficultyColors[q.difficulty] || 'text-slate-400 bg-white/5 border-white/10'}`}>
                        {q.difficulty}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${categoryColors[q.category] || 'text-slate-400 bg-white/5'}`}>
                        {q.category}
                      </span>
                      {q.type === 'resume-based' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-fuchsia-400 bg-fuchsia-400/10">
                          📄 Resume-Based
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 font-medium pl-9">{q.question}</p>
                </motion.div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0c0e14] flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/5"
          >
            Change Role
          </button>
          <button
            onClick={onContinue}
            className={`flex-1 py-4 bg-gradient-to-r ${role.color} text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
          >
            Start Interview <Play className="w-4 h-4 fill-white" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TargetRolePage = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'technical';
  const navigate = useNavigate();
  const { setRole, setExperienceLevel, setInterviewType } = useSessionStore();

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [experience, setExperience] = useState('Junior');
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    if (type === 'hr') {
      setInterviewType('hr');
      setRole({ title: 'Candidate', id: 'candidate', topics: [] });
      setExperienceLevel('Any');
      navigate('/setup/resume');
    }
  }, [type, navigate, setRole, setExperienceLevel, setInterviewType]);

  const allRoles = [...roles.technical, ...roles.nontechnical];
  const filteredRoles = allRoles.filter(role =>
    role.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setInterviewType(type);
    setRole(role);
    setExperienceLevel(experience);
    setShowModal(true);
  };

  const handleContinue = () => {
    setShowModal(false);
    navigate('/setup/resume');
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Step 1 of 3</p>
            <h1 className="text-3xl font-black tracking-tight">Select Your Target Role</h1>
            <p className="text-slate-400 text-sm mt-2">Click any role to preview AI-generated questions</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Experience Level - moved above roles */}
        <div className="max-w-2xl mx-auto bg-[#151821] border border-white/5 rounded-[2rem] p-6 mb-8 flex flex-wrap items-center gap-4 justify-between">
          <span className="text-sm font-black text-slate-300">Experience Level:</span>
          <div className="flex flex-wrap gap-3">
            {['Fresher (0-1 yrs)', 'Junior (1-3 yrs)', 'Mid (3-5 yrs)', 'Senior (5+ yrs)'].map((level) => {
              const key = level.split(' ')[0];
              return (
                <button
                  key={level}
                  onClick={() => setExperience(key)}
                  className={`
                    px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-300
                    ${experience === key
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'}
                  `}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search roles (e.g. React Developer)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-blue-500/50 transition-all font-medium"
          />
        </div>

        {/* Click hint banner */}
        <div className="flex items-center gap-3 justify-center mb-8 text-sm text-slate-400">
          <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
          <span>Click any role card to see AI-generated questions <span className="text-blue-400 font-bold">tailored to that role + your resume</span></span>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {filteredRoles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleClick(role)}
                className="relative p-7 rounded-[2rem] border cursor-pointer transition-all duration-300 overflow-hidden group bg-[#151821] border-white/5 hover:border-white/10 hover:shadow-xl"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-[2rem]`} />
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${role.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-black mb-3 group-hover:text-white transition-colors">{role.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {role.topics.map((topic, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/5 text-slate-400 group-hover:bg-white/10">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                    Preview Questions <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Question Preview Modal */}
      <AnimatePresence>
        {showModal && selectedRole && (
          <QuestionPreviewModal
            role={selectedRole}
            experience={experience}
            onClose={() => setShowModal(false)}
            onContinue={handleContinue}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TargetRolePage;
