import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, CheckCircle, AlertCircle, 
  Loader2, ArrowRight, X, User, Briefcase, 
  BookOpen, Terminal, Sparkles, RefreshCw
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import API from '../api';
import toast from 'react-hot-toast';

const ResumeUploadPage = () => {
  const navigate = useNavigate();
  const { setResumeData, role } = useSessionStore();
  
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (validTypes.includes(selectedFile.type)) {
      if (selectedFile.size <= 5 * 1024 * 1024) {
        setFile(selectedFile);
      } else {
        toast.error("File size must be less than 5MB");
      }
    } else {
      toast.error("Only PDF and DOCX files are supported");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await API.post('/resume/parse', { 
          resume: base64, 
          fileName: file.name 
        });
        
        if (res.data.extracted) {
          setParsedPreview(res.data);
          setResumeData(res.data);
          toast.success("Resume parsed successfully!");
        } else {
          toast.error("AI couldn't extract data. Please try another file.");
        }
        setIsUploading(false);
      };
    } catch (err) {
      toast.error("Failed to process resume");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Step 2 of 3</p>
          <h1 className="text-3xl font-black tracking-tight">Upload Your Resume</h1>
          <p className="text-slate-400 mt-2">Let our AI analyze your background for a better interview.</p>
        </div>

        {!parsedPreview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Upload Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`
                relative h-80 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300
                ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 bg-[#151821]'}
                ${file ? 'border-blue-500/50' : ''}
              `}
            >
              {!file ? (
                <>
                  <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-bold mb-2">Drag and drop your resume</p>
                  <p className="text-sm text-slate-400 mb-8">PDF or DOCX (Max 5MB)</p>
                  <label className="px-6 py-3 bg-white text-black font-bold rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                    Browse Files
                    <input type="file" className="hidden" onChange={(e) => validateAndSetFile(e.target.files[0])} />
                  </label>
                </>
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                  <p className="text-xl font-bold mb-2">{file.name}</p>
                  <p className="text-sm text-slate-400 mb-8">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button onClick={() => setFile(null)} className="text-red-400 text-sm font-bold flex items-center gap-2 mx-auto">
                    <X className="w-4 h-4" /> Remove File
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full h-16 bg-blue-600 disabled:bg-blue-600/50 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-3 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Parsing your resume with AI...
                  </>
                ) : (
                  <>
                    Upload & Analyse <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <button
                onClick={() => navigate('/setup/check')}
                disabled={isUploading}
                className="w-full h-12 text-slate-400 hover:text-white font-bold rounded-xl flex items-center justify-center transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-white/5 bg-blue-600/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">AI Analysis Results</h3>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Successfully Parsed</p>
                  </div>
                </div>
                <button 
                  onClick={() => setParsedPreview(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Re-upload
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name Detected</p>
                      <p className="text-lg font-bold">{parsedPreview.name || 'Not found'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <Terminal className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Skills Identified</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {parsedPreview.skills?.slice(0, 8).map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-300 border border-white/5">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Key Experience</p>
                      <p className="text-sm font-bold">{parsedPreview.experience?.[0]?.company || 'Not found'}</p>
                      <p className="text-xs text-slate-400">{parsedPreview.experience?.[0]?.role}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Education</p>
                      <p className="text-sm font-bold">{parsedPreview.education?.[0]?.institution || 'Not found'}</p>
                      <p className="text-xs text-slate-400">{parsedPreview.education?.[0]?.degree}</p>
                    </div>
                  </div>
                </div>
              </div>

              {parsedPreview.projects?.length > 0 && (
                <div className="p-8 border-t border-white/5 parsed-section">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">📁 Projects Found ({parsedPreview.projects.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedPreview.projects.map((p, i) => (
                      <div key={i} className="project-card bg-white/5 rounded-2xl p-4 border border-white/5">
                        <strong className="text-blue-500">{p.name}</strong>
                        <p className="text-sm text-slate-400 my-2">{p.description}</p>
                        <div className="tech-tags flex flex-wrap gap-2 mt-2">
                          {p.technologies?.map(t => (
                            <span key={t} className="tag px-2 py-1 bg-[#151821] rounded-lg text-xs font-bold text-slate-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedPreview.experience?.length > 0 && (
                <div className="p-8 border-t border-white/5 parsed-section">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">💼 Experience Found</h4>
                  <div className="space-y-4">
                    {parsedPreview.experience.map((e, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl p-4 border border-white/5">
                        <div>
                          <strong className="text-slate-200">{e.role}</strong> <span className="text-slate-400">at {e.company}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-bold bg-[#151821] px-3 py-1 rounded-full">{e.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/setup/check')}
              className="w-full h-16 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
            >
              Looks Good → Continue <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploadPage;
