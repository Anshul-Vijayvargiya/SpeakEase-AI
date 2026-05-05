// components/JobRoleModal.jsx
import React, { useState } from 'react';
import { X, Briefcase, Code, BarChart, Loader2 } from 'lucide-react';

const JobRoleModal = ({ isOpen, onClose, onStart }) => {
  const [formData, setFormData] = useState({
    jobRole: '',
    techStack: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onStart(formData); // This triggers the backend session creation
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Setup Interview</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customize your AI experience</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <Briefcase size={12} /> Job Role / Position
            </label>
            <input 
              required
              placeholder="Ex. Full Stack Developer"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
              onChange={(e) => setFormData({...formData, jobRole: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <Code size={12} /> Tech Stack (In Short)
            </label>
            <textarea 
              required
              placeholder="Ex. React, Node.js, MongoDB"
              rows="3"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
              onChange={(e) => setFormData({...formData, techStack: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <BarChart size={12} /> Years of Experience
            </label>
            <input 
              required
              type="number"
              placeholder="Ex. 2"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Start AI Interview'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobRoleModal;
