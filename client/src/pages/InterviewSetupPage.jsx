import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Mic, Wifi, ChevronRight, 
  CheckCircle2, XCircle, Loader2, Play 
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import API from '../api';
import toast from 'react-hot-toast';

const InterviewSetupPage = () => {
  const navigate = useNavigate();
  const { role, experienceLevel, resumeData, skipResume, difficulty, setDifficulty, setSessionId, setQuestions, interviewType } = useSessionStore();
  
  const videoRef = useRef(null);
  const [checks, setChecks] = useState({
    camera: { status: 'idle', label: 'Camera Check' },
    mic: { status: 'idle', label: 'Microphone Check' },
    internet: { status: 'idle', label: 'Internet Check' }
  });
  const [micLevel, setMicLevel] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let mediaStream = null;

    // Camera + Microphone Check — requested together in a single getUserMedia
    // call. Requesting them as two separate, concurrent calls can make the
    // browser's camera/mic device negotiation hang indefinitely (neither
    // resolves nor rejects), which is why the preview stayed black and both
    // checks spun forever instead of ever reaching success or error.
    const testCameraAndMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStream = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        setChecks(prev => ({
          ...prev,
          camera: { status: 'success', label: 'Camera Ready' },
          mic: { status: 'success', label: 'Mic Ready' }
        }));

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          setMicLevel(sum / dataArray.length);
          requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err) {
        setChecks(prev => ({
          ...prev,
          camera: { status: 'error', label: 'Camera Not Found' },
          mic: { status: 'error', label: 'Mic Not Found' }
        }));
      }
    };

    // Internet Check
    const testInternet = async () => {
      try {
        await API.get('/test');
        setChecks(prev => ({ ...prev, internet: { status: 'success', label: 'Connected' } }));
      } catch (err) {
        setChecks(prev => ({ ...prev, internet: { status: 'error', label: 'Slow Connection' } }));
      }
    };

    testCameraAndMic();
    testInternet();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await API.post('/interview/generate', {
        targetRole: role?.title,
        experienceLevel: experienceLevel,
        interviewMode: interviewType || 'technical',
        difficulty: difficulty,
        skipResume: !!skipResume
      });

      if (res.data && (res.data.sessionId || res.data.interviewId)) {
        const id = res.data.sessionId || res.data.interviewId;
        setSessionId(id);
        setQuestions(res.data.questions || []);
        toast.success("Interview session created!");
        navigate(`/interview/${id}`);
      } else {
        throw new Error("Invalid response from server: Missing session ID");
      }
    } catch (err) {
      console.error("Start Error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Please try again.";
      toast.error(`Failed to start interview: ${errorMsg}`);
      setIsStarting(false);
    }
  };

  const allPassed = Object.values(checks).every(c => c.status === 'success');

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Step 3 of 3</p>
          <h1 className="text-3xl font-black tracking-tight">Final System Checks</h1>
          <p className="text-slate-400 mt-2">Ensure your environment is ready for a professional interview.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Left: Camera Preview */}
          <div className="space-y-6">
            <div className="aspect-video bg-[#151821] rounded-[2.5rem] border border-white/5 overflow-hidden relative group">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover mirror"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Live Preview</span>
              </div>
            </div>

            {/* Mic Level Bar */}
            <div className="bg-[#151821] border border-white/5 p-6 rounded-[2rem]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Mic className="w-4 h-4 text-blue-500" /> Microphone Level
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Testing...</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-600"
                  animate={{ width: `${Math.min(100, micLevel * 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Status & Difficulty */}
          <div className="space-y-8">
            <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-xl font-black mb-2">Checklist</h3>
              {[
                { key: 'camera', icon: <Camera className="w-5 h-5" /> },
                { key: 'mic', icon: <Mic className="w-5 h-5" /> },
                { key: 'internet', icon: <Wifi className="w-5 h-5" /> },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${checks[item.key].status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-400'}`}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold">{checks[item.key].label}</span>
                  </div>
                  {checks[item.key].status === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : checks[item.key].status === 'error' ? (
                    <XCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                  )}
                </div>
              ))}
            </div>

            {/* Difficulty Selector */}
            <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-xl font-black mb-6">Interview Difficulty</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Easy', 'Medium', 'Hard', 'Mixed'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`
                      py-4 rounded-2xl text-sm font-bold border transition-all duration-300
                      ${difficulty === diff 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}
                    `}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!allPassed || isStarting}
          className="w-full h-16 bg-blue-600 disabled:bg-blue-600/50 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all group"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Generating Your Interview...
            </>
          ) : (
            <>
              Start Interview <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InterviewSetupPage;
