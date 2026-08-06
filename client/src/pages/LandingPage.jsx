import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Brain, Shield, Clock, Award, BarChart3, 
  Video, Mic, Eye, Smile, MessageSquare, CheckCircle2,
  TrendingUp, Users, Target, Globe, FileText,
  MousePointer2, Sparkles
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: <FileText className="w-6 h-6" />, title: "Personalized Questions", desc: "Generated from your unique resume and target role." },
    { icon: <Video className="w-6 h-6" />, title: "Real Simulation", desc: "Experience the pressure of a real interview environment." },
    { icon: <Award className="w-6 h-6" />, title: "Boost Confidence", desc: "Repeated practice makes you fearless in front of recruiters." },
    { icon: <MessageSquare className="w-6 h-6" />, title: "Communication Skills", desc: "Refine your speech, clarity, and delivery style." },
    { icon: <Brain className="w-6 h-6" />, title: "Technical Testing", desc: "Deep dive into role-specific technical knowledge." },
    { icon: <Sparkles className="w-6 h-6" />, title: "Resume Feedback", desc: "AI-driven insights to improve your resume impact." },
    { icon: <Eye className="w-6 h-6" />, title: "Eye Contact Analysis", desc: "Ensuring you maintain steady engagement with the camera." },
    { icon: <Smile className="w-6 h-6" />, title: "Expression Analysis", desc: "Track facial expressions to ensure a confident vibe." },
    { icon: <Mic className="w-6 h-6" />, title: "Voice & Pace", desc: "Analyze WPM and tone to avoid rushing or stuttering." },
    { icon: <Target className="w-6 h-6" />, title: "Attention Tracking", desc: "Stay focused and avoid distractions during the session." },
    { icon: <Zap className="w-6 h-6" />, title: "Instant Evaluation", desc: "Get scores and feedback the moment you finish." },
    { icon: <BarChart3 className="w-6 h-6" />, title: "Detailed Reports", desc: "Breakdown of Technical, HR, and Confidence metrics." },
    { icon: <TrendingUp className="w-6 h-6" />, title: "Identify Weak Areas", desc: "Target exactly what topics you need to study more." },
    { icon: <Clock className="w-6 h-6" />, title: "Progress Tracking", desc: "See your growth curve over multiple sessions." },
    { icon: <Users className="w-6 h-6" />, title: "Available 24/7", desc: "Practice anytime, anywhere, without an appointment." },
    { icon: <Shield className="w-6 h-6" />, title: "Save Coaching Fees", desc: "Premium interview prep at a fraction of the cost." },
    { icon: <CheckCircle2 className="w-6 h-6" />, title: "Reduce Rejections", desc: "Walk into every placement drive fully prepared." },
    { icon: <Globe className="w-6 h-6" />, title: "Multi-Language", desc: "Support for various programming and spoken languages." },
    { icon: <Shield className="w-6 h-6" />, title: "Cheating Detection", desc: "Ensures integrity with distraction and gaze alerts." }
  ];

  return (
    <div className="bg-[#0f1117] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight">SpeakEase <span className="text-blue-500">AI</span></span>
          </div>
          <button 
            onClick={() => navigate('/auth')}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-xl shadow-white/5"
          >
            Login / Signup
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-500/20 mb-8 inline-block">
              AI-Powered Career Accelerator
            </span>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">
              Practice Interviews. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">
                Get Hired.
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              AI-powered mock interviews with real-time facial, voice, and answer analysis to help you land your dream job at top tech companies.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/auth')}
                className="group relative px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all duration-300 shadow-2xl shadow-blue-500/40 w-full sm:w-auto overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative flex items-center justify-center gap-2">
                  Start Free Interview <MousePointer2 className="w-5 h-5" />
                </span>
              </button>
              <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 w-full sm:w-auto">
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-6 bg-[#0c0e14]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Everything You Need to Succeed</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Master every aspect of the interview process with our comprehensive AI analysis tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="p-8 bg-[#151821] border border-white/5 rounded-3xl hover:border-blue-500/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {b.icon}
                </div>
                <h3 className="text-lg font-bold mb-3">{b.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-12 tracking-tight">Your Path to Mastery</h2>
              <div className="space-y-12">
                {[
                  { step: "01", title: "Upload Resume", desc: "Our AI parses your skills and experience to craft relevant questions." },
                  { step: "02", title: "Choose Your Role", desc: "Select from 20+ technical and non-technical job roles." },
                  { step: "03", title: "Practice & Perform", desc: "Go through rounds of Technical and HR questions with real-time feedback." },
                  { step: "04", title: "Get Insightful Reports", desc: "Detailed breakdown of your performance with coaching tips." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-4xl font-black text-blue-600/20">{s.step}</span>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                      <p className="text-slate-400">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-[4rem] border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="w-3/4 h-3/4 bg-[#151821] rounded-3xl border border-white/5 shadow-2xl p-6 relative">
                  <div className="w-full h-8 bg-white/5 rounded-lg mb-4" />
                  <div className="w-2/3 h-4 bg-white/5 rounded-lg mb-8" />
                  <div className="space-y-4">
                    <div className="w-full h-20 bg-blue-600/10 border border-blue-500/20 rounded-2xl" />
                    <div className="w-full h-20 bg-white/5 rounded-2xl" />
                    <div className="w-full h-20 bg-white/5 rounded-2xl" />
                  </div>
                  <div className="absolute top-1/2 -right-12 w-48 h-48 bg-blue-600 rounded-full blur-[80px] opacity-30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-tight">SpeakEase <span className="text-blue-500">AI</span></span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-slate-500">© 2026 SpeakEase AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
