import React, { useState, useEffect, useRef } from "react";
import { BarChart, Mic, Info, TrendingUp, Zap, MessageSquare, Loader2, StopCircle, CheckCircle, AlertCircle } from "lucide-react";
import API from "../api";
import toast from 'react-hot-toast';

const SpeechAnalyzer = ({ viewData, newInterviewProps, onComplete }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [mentorData, setMentorData] = useState(null);
  const [currentFeedback, setCurrentFeedback] = useState(null);

  const [messages, setMessages] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const stopListeningObj = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript("");
    window.speechSynthesis.cancel();
  };

  // 🔹 Handle Viewing History (viewData changes)
  useEffect(() => {
    if (viewData) {
      stopListeningObj();
      setSessionId(viewData._id);
      setIsFinished(viewData.status === 'completed' || !!viewData.finalAnalysis);

      // Parse history messages into UI format
      const formattedMessages = (viewData.messages || []).map(m => ({
        role: m.role === 'assistant' ? 'coach' : 'user',
        text: m.content
      }));
      setMessages(formattedMessages);

      setMentorData(viewData.finalAnalysis || null);
      setCurrentFeedback(null); // Clear live feedback panel when viewing history
    }
  }, [viewData]);

  // 🔹 Handle New Interview Start (newInterviewProps changes)
  useEffect(() => {
    if (newInterviewProps) {
      handleStartSession(newInterviewProps);
    }
  }, [newInterviewProps]);

  const handleStartSession = async (topicData) => {
    stopListeningObj();
    setSessionId(null);
    setMessages([]);
    setMentorData(null);
    setCurrentFeedback(null);
    setIsFinished(false);

    try {
      setIsProcessing(true);
      const payload = {
        topic: topicData.jobRole,
        techStack: topicData.techStack,
        experience: topicData.experience
      };

      const { data } = await API.post("/analysis/start", payload);
      setSessionId(data._id);
      setMessages([{ role: "coach", text: data.firstQuestion }]);

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.firstQuestion);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start new session.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishSession = async () => {
    if (!sessionId) return;
    try {
      stopListeningObj();
      setIsProcessing(true);
      const { data } = await API.post(`/analysis/finish/${sessionId}`);
      setMentorData(data);
      setIsFinished(true);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Failed to finish session.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      stopListeningObj();
      return;
    }

    if (!sessionId) {
      toast.error("Please start a session first.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = async (event) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(currentInterim);

      if (finalTranscript) {
        setMessages(prev => [...prev, { role: "user", text: finalTranscript }]);
        stopListeningObj();

        try {
          setIsProcessing(true);
          setCurrentFeedback(null);

          const { data } = await API.post("/analysis/chat", {
            sessionId,
            transcript: finalTranscript
          });

          // data contains our rich Mentor UI schema
          setCurrentFeedback(data);
          setMessages(prev => [...prev, { role: "coach", text: data.aiReply }]);

          if ('speechSynthesis' in window && data.aiReply) {
            const utterance = new SpeechSynthesisUtterance(data.aiReply);
            window.speechSynthesis.speak(utterance);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      console.error("Speech Recognition Error", event.error);
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* TOP: Header & Controls */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-slate-800">SpeakEase <span className="text-blue-600">PRO</span></h1>
          <p className="text-slate-500 font-medium tracking-wide">
            {sessionId && !isFinished && "Live Interview In Progress..."}
            {isFinished && (viewData ? `Viewing Past Interview: ${viewData.topic}` : "Interview Completed")}
            {!sessionId && !isFinished && "Select an interview from the sidebar or start a new one"}
          </p>

          <div className="flex justify-center gap-4 h-16 items-center">
            {sessionId && !isFinished && (
              <>
                <button
                  onClick={toggleListen}
                  disabled={isProcessing && !isListening}
                  className={`px-10 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${isListening
                    ? "bg-red-500 text-white animate-pulse shadow-red-200"
                    : "bg-[#0F172A] text-white hover:scale-105 shadow-slate-900/20"
                    } ${(isProcessing && !isListening) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isProcessing && !isListening ? <Loader2 className="animate-spin" size={20} /> : (isListening ? <StopCircle size={20} /> : <Mic size={20} />)}
                  {isListening ? "LISTENING..." : "TAP TO SPEAK"}
                </button>

                <button
                  onClick={handleFinishSession}
                  disabled={isProcessing}
                  className="bg-white text-rose-600 border-2 border-rose-100 hover:border-rose-300 hover:bg-rose-50 px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                  END INTERVIEW
                </button>
              </>
            )}
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Live Transcript Box */}
          <div className="lg:col-span-7 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[600px]">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                <MessageSquare size={16} /> Live Transcript
              </div>
              {isListening && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-red-500 uppercase">Live Mic</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold opacity-60">
                  <MessageSquare size={48} className="mb-4 text-slate-300" />
                  <p>Transcript will appear here.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-5 rounded-[2rem] max-w-[85%] font-medium leading-relaxed ${msg.role === 'user'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 rounded-br-sm'
                      : 'bg-white border shadow-sm border-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                      {msg.role === 'coach' && (
                        <p className="text-[10px] text-blue-500 uppercase tracking-widest font-black mb-2 flex items-center gap-1">
                          <Zap size={12} /> AI Interviewer
                        </p>
                      )}
                      "{msg.text}"
                    </div>
                  </div>
                ))
              )}

              {/* Show Live Speaking Interim Transcript */}
              {isListening && interimTranscript && (
                <div className="flex justify-end animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-blue-600/10 text-slate-700 p-5 rounded-[2rem] rounded-br-sm max-w-[85%] border-2 border-dashed border-blue-400/50">
                    <p className="font-medium italic">"{interimTranscript}..."</p>
                    <span className="animate-pulse inline-block w-1 h-4 bg-blue-500 ml-1 relative top-0.5"></span>
                  </div>
                </div>
              )}

              {/* Thinking Indicator */}
              {isProcessing && !interimTranscript && !isListening && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm border-slate-100 p-5 rounded-[2rem] rounded-bl-sm flex gap-1 items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* RIGHT: Mentorship Dynamic Panel vs Final Stats */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* If Finalized, show the Final Analytics Stats Grid */}
            {(isFinished && mentorData) && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                <StatBox label="CONFIDENCE" value={mentorData.confidenceScore || "N/A"} icon={<TrendingUp className="text-blue-500" />} />
                <StatBox label="SPEAKING PACE" value={mentorData.pace || "Normal"} icon={<Zap className="text-purple-500" />} />
                <StatBox label="FILLERS" value={mentorData.fillerCount || "0 Found"} icon={<Info className="text-orange-500" />} />
                <StatBox label="FEEDBACK" value="Review Details" icon={<CheckCircle className="text-emerald-500" />} highlight={true} />
              </div>
            )}

            {/* If Live Interview, show Live Feedback Box matching Backend Schema */}
            {!isFinished && (
              <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 flex flex-col h-[600px] overflow-y-auto custom-scrollbar border border-slate-800">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                  <Zap size={14} /> Live Mentor Insights
                </h3>

                {!currentFeedback ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-60">
                    <Loader2 className="w-12 h-12 mb-4 animate-[spin_3s_linear_infinite]" />
                    <p className="text-center font-bold text-sm">Feedback unlocks<br />after your first answer...</p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">

                    {/* Emotion/Confidence Dynamic Module */}
                    <div className="flex gap-4">
                      <div className="flex-1 bg-slate-800 p-5 rounded-3xl border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1 font-black">Emotion</span>
                        <span className="font-black text-xl text-white">{currentFeedback.emotionType || 'Neutral'}</span>
                      </div>
                      <div className="flex-1 bg-slate-800 p-5 rounded-3xl border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1 font-black">Confidence</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black tracking-tighter ${currentFeedback.emotionScore > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {currentFeedback.emotionScore || 0}
                          </span>
                          <span className="text-slate-500 text-xs font-bold">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Pro Translation */}
                    <div className="bg-blue-600/10 p-5 rounded-3xl border border-blue-500/20">
                      <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase mb-2 block">Professional Phrasing</span>
                      <p className="text-blue-100 font-medium leading-relaxed">{currentFeedback.proVersion}</p>
                    </div>

                    {/* Tech Upgrade */}
                    <div className="bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase mb-2 block">Technical Upgrade</span>
                      <p className="text-emerald-100 font-medium leading-relaxed">{currentFeedback.techVersion}</p>
                    </div>

                    {/* Quick Fix / Grammar */}
                    <div className="flex items-start gap-3 bg-yellow-500/10 p-5 rounded-3xl border border-yellow-500/20 text-yellow-100/90 font-medium text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0 text-yellow-500" />
                      <p className="leading-relaxed"><span className="text-yellow-500 font-black block mb-1 uppercase text-[10px] tracking-widest">Grammar / Quick Fix</span>{currentFeedback.quickFix}</p>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* If Finished, display the overall feedback text */}
            {isFinished && mentorData?.overallFeedback && (
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex-1 border border-slate-800 overflow-y-auto custom-scrollbar">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-4 font-black">Final Evaluation</span>
                <p className="text-slate-300 font-medium leading-relaxed mb-6">
                  {mentorData.overallFeedback}
                </p>
                <div className="space-y-4">
                  <div className="bg-emerald-900/30 p-4 rounded-2xl border border-emerald-900/50">
                    <span className="text-[10px] text-emerald-500 font-black tracking-widest uppercase block mb-1">Strengths</span>
                    <p className="text-emerald-100/80 text-sm font-medium">{mentorData.strengths}</p>
                  </div>
                  <div className="bg-yellow-900/30 p-4 rounded-2xl border border-yellow-900/50">
                    <span className="text-[10px] text-yellow-500 font-black tracking-widest uppercase block mb-1">Improvements</span>
                    <p className="text-yellow-100/80 text-sm font-medium">{mentorData.improvements}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon, highlight }) => (
  <div className={`p-6 rounded-[2rem] shadow-sm flex flex-col items-center justify-center text-center transition-all ${highlight ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100'}`}>
    <div className={`p-3 rounded-2xl mb-3 ${highlight ? 'bg-slate-800' : 'bg-slate-50'}`}>{icon}</div>
    <p className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p>
    <p className={`text-2xl font-black mt-1 ${highlight ? 'text-white' : 'text-slate-800'}`}>{value}</p>
  </div>
);

export default SpeechAnalyzer;