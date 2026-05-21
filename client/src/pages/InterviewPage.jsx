import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Mic, CheckCircle2, Video, 
  AlertCircle, Loader2, Play, Pause,
  Users, MessageSquare, Timer as ClockIcon,
  Eye, Smile, BarChart3, Volume2, VolumeX
} from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import API from '../api';
import toast from 'react-hot-toast';
import RoundTransition from './RoundTransition';
import useAudioAnalyser from '../hooks/useAudioAnalyser';
import useFaceMesh from '../hooks/useFaceMesh';
import BottomHUD from '../components/BottomHUD';
import useTTS from '../hooks/useTTS';

const InterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    questions, currentIndex, currentRound, status, 
    nextQuestion, setQuestions, updateMetrics,
    difficulty: sessionDifficulty
  } = useSessionStore();

  const { speak, stop: stopSpeaking, isSpeaking: isAiSpeaking } = useTTS();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timer, setTimer] = useState(0);
  const [answerState, setAnswerState] = useState("idle");
  
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const timerRef = useRef(null);

  const videoRef = useRef(null);
  const { eyeContactPercent, expression } = useFaceMesh(videoRef);
  const { transcript, isListening, fillerCount, wpm, startListening, stopListening, resetTranscript } = useAudioAnalyser();

  const currentQuestion = questions[currentIndex];

  // ── Speak question whenever it changes ──────────────────────────────────
  useEffect(() => {
    if (!currentQuestion?.questionText) return;
    // Small delay so the question card animation plays first
    const t = setTimeout(() => {
      speak(currentQuestion.questionText);
    }, 400);
    return () => {
      clearTimeout(t);
      stopSpeaking(); // cancel speech when question changes / unmounts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.questionText]);

  // 1. Initial Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const res = await API.get(`/interview/${id}`);
        // Flatten questions: technical -> coding -> hr
        const interview = res.data;
        const allQuestions = [
          ...(interview.codingResults || []),
          ...(interview.technicalResults || []),
          ...(interview.hrResults || [])
        ];
        
        if (allQuestions.length === 0) {
           toast.error("No questions found for this interview");
           navigate('/dashboard');
           return;
        }

        let globalIndex = 0;
        if (interview.interviewType === 'full-simulation') {
          const codingLen = interview.codingResults?.length || 0;
          const techLen = interview.technicalResults?.length || 0;
          
          if (interview.interviewPhase === 'coding') {
            globalIndex = interview.currentQuestionIndex || 0;
          } else if (interview.interviewPhase === 'technical') {
            globalIndex = codingLen + (interview.currentQuestionIndex || 0);
          } else if (interview.interviewPhase === 'hr') {
            globalIndex = codingLen + techLen + (interview.currentQuestionIndex || 0);
          } else if (interview.interviewPhase === 'completed' || interview.status === 'Completed') {
            globalIndex = allQuestions.length - 1;
          }
        } else {
          globalIndex = interview.currentQuestionIndex || 0;
        }

        // Clamp just in case
        globalIndex = Math.min(globalIndex, allQuestions.length - 1);

        setQuestions(allQuestions, globalIndex);
      } catch (err) {
        console.error("Init Error:", err);
        toast.error("Failed to load interview session");
        navigate('/dashboard');
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // 2. Camera & FaceMesh (Simplified for now, will enhance later)
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        // MediaRecorder setup
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.current.push(e.data);
          }
        };

        recorder.start(1000); // 1s chunks
      } catch (err) {
        toast.error("Media access failed");
      }
    };
    startMedia();
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 3. Question Timer
  useEffect(() => {
    if (status === 'active') {
      setTimer(0);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [currentIndex, status]);

  const [showTransition, setShowTransition] = useState(false);
  const lastAlertTime = useRef(0);

  // Live Alert: Eye Contact (if < 60% for a while, toast every 10s)
  useEffect(() => {
    if (status === 'active' && eyeContactPercent < 60 && Date.now() - lastAlertTime.current > 10000) {
      toast('Maintain eye contact with the camera', { icon: '👁️', position: 'top-center' });
      lastAlertTime.current = Date.now();
    }
  }, [eyeContactPercent, status]);

  // Handle Interview Completion
  useEffect(() => {
    if (status === 'finished') {
      const finalize = async () => {
        try {
          // Stop recording and properly wait for onstop to fire (all chunks collected)
          await new Promise((resolve) => {
            const recorder = mediaRecorderRef.current;
            if (!recorder || recorder.state === 'inactive') {
              resolve();
              return;
            }
            recorder.onstop = resolve;
            recorder.stop();
          });

          if (recordedChunks.current.length > 0) {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', blob, 'interview-recording.webm');

            await API.post(`/interview/${id}/video`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            }).catch(e => console.error('Video upload failed:', e));
          }

          await API.post(`/interview/${id}/finish`);
          navigate(`/processing/${id}`);
        } catch (err) {
          console.error('Finalize error:', err);
          navigate(`/processing/${id}`);
        }
      };
      finalize();
    }
  }, [status, id, navigate]);


  // Handle Round Transitions
  useEffect(() => {
    // If we just switched to hr round, show transition
    if (currentRound === 'hr' && questions.some(q => q.type === 'technical')) {
      const firstHrIndex = questions.findIndex(q => q.type === 'hr');
      if (firstHrIndex !== -1 && currentIndex === firstHrIndex) {
        setShowTransition(true);
      }
    }
  }, [currentRound, currentIndex, questions]);

  const handleStartAnswering = () => {
    // Stop AI speaking before mic opens
    if (isAiSpeaking) stopSpeaking();
    startListening();
    setAnswerState("listening");
  };

  const handleSubmitAnswer = async () => {
    stopListening();
    stopSpeaking();
    const finalAnswer = transcript.replace(/\[.*?\]$/, "").trim();
    if (!finalAnswer) {
      alert("No answer detected. Please speak into your microphone.");
      return;
    }
    
    setIsEvaluating(true);
    try {
      await API.post(`/interview/evaluate`, {
        interviewId: id,
        questionId: currentQuestion._id,
        userAnswer: finalAnswer,
        behavioralMetrics: { 
          eyeContact: eyeContactPercent, 
          attention: 100, 
          expression: expression,
          fillerCount: fillerCount,
          wpm: wpm
        }
      });
      
      resetTranscript();
      nextQuestion();
    } catch (err) {
      toast.error("Failed to submit answer");
    } finally {
      setIsEvaluating(false);
      setAnswerState("idle");
    }
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'idle') return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="h-screen bg-[#0f1117] flex flex-col text-white overflow-hidden">
      <AnimatePresence>
        {showTransition && (
          <RoundTransition 
            from="Technical" 
            to="HR" 
            onContinue={() => setShowTransition(false)} 
          />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="h-20 bg-[#151821] border-b border-white/5 px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <span className="px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3 fill-white" />
            {currentRound === 'technical' ? 'Technical Round' : 'HR Round'}
          </span>
          <span className="text-sm font-bold text-slate-400">
            QUESTION <span className="text-white">{currentIndex + 1}</span> OF {questions.length}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
            {currentQuestion?.difficulty || sessionDifficulty}
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Camera */}
        <div className="w-[38%] p-8 flex flex-col gap-6 bg-[#0c0e14]/50 border-r border-white/5">
          <div className="relative aspect-video bg-[#151821] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover mirror"
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Recording</span>
            </div>
          </div>
          
          <div className="flex-1 bg-[#151821]/50 rounded-[2rem] border border-white/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <MessageSquare className="w-32 h-32" />
            </div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Interviewer's Prompt</h4>
            <p className="text-lg font-bold leading-relaxed text-slate-300">
              "Focus on technical accuracy and explain your thought process clearly."
            </p>
          </div>
        </div>

        {/* Right Panel - Question Card */}
        <div className="flex-1 p-12 flex flex-col items-center justify-center relative">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl relative"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 text-white">
              <MessageSquare className="w-6 h-6" />
            </div>

            {/* ── AI Speaking indicator ── */}
            <AnimatePresence>
              {isAiSpeaking && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-between mb-5 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    {/* Animated sound bars */}
                    <div className="flex items-end gap-[3px] h-5">
                      {[1, 2, 3, 4, 3].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-blue-500"
                          style={{
                            height: `${h * 4}px`,
                            animation: `soundBar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-blue-700">AI is reading the question…</span>
                  </div>
                  <button
                    onClick={stopSpeaking}
                    title="Stop speaking"
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    Stop
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-8 leading-tight">
              {currentQuestion?.questionText}
            </h2>

            <div className="min-h-[120px] bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100 italic text-slate-500 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
              {transcript || (isListening ? 'Listening to your response...' : 'Your transcript will appear here...')}
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleStartAnswering}
                disabled={isListening || isEvaluating}
                className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 transition-all group"
              >
                {isAiSpeaking ? (
                  <><Volume2 className="w-5 h-5 animate-pulse" /> SPEAKING…</>
                ) : (
                  <><Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                  {transcript ? 'RESUME ANSWER' : 'START ANSWERING'}</>
                )}
              </button>
              
              <button
                onClick={handleSubmitAnswer}
                disabled={!transcript || isEvaluating}
                className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all"
              >
                {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                SUBMIT ANSWER
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom HUD Bar */}
      <BottomHUD
        eyeContact={eyeContactPercent}
        wpm={wpm}
        fillers={fillerCount}
        expression={expression}
        timer={timer}
        round={currentRound}
      />
    </div>
  );
};

export default InterviewPage;
