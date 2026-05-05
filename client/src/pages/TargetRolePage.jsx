import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, Code, Server, Database, Globe, 
  Cpu, Layout, Settings, BarChart, Smartphone, 
  ChevronRight, ArrowLeft, Terminal, Briefcase,
  Monitor, Brain, Layers, ShieldCheck
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';

const roles = {
  technical: [
    { id: "frontend",     icon: <Monitor />, title: "Frontend Developer", topics: ["HTML/CSS", "JavaScript", "React/Vue"] },
    { id: "backend",      icon: <Server />,  title: "Backend Developer",  topics: ["APIs", "Databases", "Server Architecture"] },
    { id: "fullstack",    icon: <Layers />,  title: "Full Stack Developer", topics: ["Frontend", "Backend", "Databases"] },
    { id: "react",        icon: <Cpu />,     title: "React Developer",     topics: ["React", "Hooks", "State Management"] },
    { id: "nodejs",       icon: <Terminal />, title: "Node.js Developer",  topics: ["Node.js", "Express", "REST APIs"] },
    { id: "python",       icon: <Code />,    title: "Python Developer",    topics: ["Python", "Django/Flask", "OOP"] },
    { id: "java",         icon: <Smartphone />, title: "Java Developer",      topics: ["Java", "Spring Boot", "OOP"] },
    { id: "devops",       icon: <Settings />, title: "DevOps Engineer",    topics: ["CI/CD", "Docker", "Kubernetes"] },
    { id: "datascience",  icon: <BarChart />, title: "Data Scientist",     topics: ["Python", "ML Models", "Statistics"] },
    { id: "ml",           icon: <Brain />,    title: "ML Engineer",        topics: ["Deep Learning", "TensorFlow", "NLP"] },
    { id: "android",      icon: <Smartphone />, title: "Android Developer",   topics: ["Kotlin", "Android SDK", "Jetpack"] },
    { id: "ios",          icon: <Smartphone />, title: "iOS Developer",       topics: ["Swift", "SwiftUI", "Xcode"] },
  ],
  nontechnical: [
    { id: "pm",           icon: <Briefcase />, title: "Product Manager",    topics: ["Roadmaps", "Agile", "Stakeholders"] },
    { id: "ba",           icon: <BarChart />,  title: "Business Analyst",   topics: ["Requirements", "SQL", "Process Mapping"] },
    { id: "uiux",         icon: <Layout />,    title: "UI/UX Designer",     topics: ["Figma", "User Research", "Wireframing"] },
    { id: "marketing",    icon: <Globe />,     title: "Digital Marketing",  topics: ["SEO", "Analytics", "Campaigns"] },
    { id: "dataanalyst",  icon: <Search />,    title: "Data Analyst",       topics: ["Excel", "SQL", "Power BI"] },
    { id: "projectmgr",   icon: <Briefcase />, title: "Project Manager",    topics: ["Planning", "Risk", "Team Management"] },
  ]
};

const TargetRolePage = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'technical';
  const navigate = useNavigate();
  const { setRole, setExperienceLevel, setInterviewType } = useSessionStore();

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [experience, setExperience] = useState('Junior');

  React.useEffect(() => {
    if (type === 'hr') {
      setInterviewType('hr');
      setRole({ title: 'Candidate', id: 'candidate', topics: [] });
      setExperienceLevel('Any');
      navigate('/setup/resume');
    }
  }, [type, navigate, setRole, setExperienceLevel, setInterviewType]);

  const filteredRoles = [...roles.technical, ...roles.nontechnical].filter(role => 
    role.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedRole) {
      setInterviewType(type);
      setRole(selectedRole);
      setExperienceLevel(experience);
      navigate('/setup/resume');
    }
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
          </div>
          <div className="w-10" />
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search roles (e.g. React Developer)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-blue-500/50 transition-all font-medium"
          />
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredRoles.map((role) => (
            <motion.div
              key={role.id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedRole(role)}
              className={`
                p-8 rounded-[2rem] border cursor-pointer transition-all duration-300
                ${selectedRole?.id === role.id 
                  ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-600/20' 
                  : 'bg-[#151821] border-white/5 hover:border-white/10'}
              `}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${selectedRole?.id === role.id ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-500'}`}>
                {role.icon}
              </div>
              <h3 className="text-lg font-black mb-4">{role.title}</h3>
              <div className="flex flex-wrap gap-2">
                {role.topics.map((topic, i) => (
                  <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-md ${selectedRole?.id === role.id ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-400'}`}>
                    {topic}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Experience Level */}
        <div className="max-w-2xl mx-auto bg-[#151821] border border-white/5 rounded-[2.5rem] p-10 text-center mb-12">
          <h2 className="text-xl font-black mb-8">What's your experience level?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Fresher (0-1 yrs)', 'Junior (1-3 yrs)', 'Mid (3-5 yrs)', 'Senior (5+ yrs)'].map((level) => (
              <button
                key={level}
                onClick={() => setExperience(level.split(' ')[0])}
                className={`
                  px-6 py-3 rounded-xl text-sm font-bold border transition-all duration-300
                  ${experience === level.split(' ')[0]
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}
                `}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="group px-12 py-5 bg-blue-600 disabled:bg-blue-600/50 text-white font-black rounded-2xl hover:bg-blue-700 transition-all duration-300 shadow-2xl shadow-blue-600/30 flex items-center gap-3 mx-auto"
          >
            Continue to Resume <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetRolePage;
