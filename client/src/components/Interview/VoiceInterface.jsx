import React, { useState, useEffect, useRef } from 'react';
import Timer from './Timer';
import toast from 'react-hot-toast';

const VoiceInterface = ({ currentQuestion, onAnswerComplete, onTranscriptUpdate, isAiSpeaking, setIsAiSpeaking }) => {
    const [transcript, setTranscript] = useState('');
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [hasRecorded, setHasRecorded] = useState(false);
    const recognitionRef = useRef(null);

    // TTS Engine (AI speaking the question)
    useEffect(() => {
        if (currentQuestion && !isAiSpeaking && !isUserSpeaking && !hasRecorded) {
            if ('speechSynthesis' in window) {
                // Stop any current STT loop or previous TTS
                stopListening(false);
                window.speechSynthesis.cancel();

                setIsAiSpeaking(true);
                const utterance = new SpeechSynthesisUtterance(currentQuestion);

                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female'));
                if (preferredVoice) utterance.voice = preferredVoice;

                utterance.rate = 0.9;

                utterance.onend = () => {
                    setIsAiSpeaking(false);
                };

                // If it fails to speak properly due to autoplay policy, ensure we clear state
                utterance.onerror = () => {
                    setIsAiSpeaking(false);
                };

                // Browsers often block this if the user hasn't interacted yet!
                window.speechSynthesis.speak(utterance);
            }
        }
    }, [currentQuestion]);

    // Cleanup speech synth on unmount
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // STT Engine (User responding)
    const startListening = () => {
        if (isAiSpeaking) {
            window.speechSynthesis.cancel();
            setIsAiSpeaking(false);
        }

        setIsUserSpeaking(true);
        setHasRecorded(true);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
                // Feed to HUD for live filler + WPM analysis
                if (onTranscriptUpdate) onTranscriptUpdate(currentTranscript);
            };

            recognitionRef.current.onerror = (e) => console.error("Speech Rec Error:", e);
            recognitionRef.current.start();
        } else {
            toast.error("Speech Recognition not supported in this browser. Please type your answer.");
            setIsUserSpeaking(false);
        }
    };

    const stopListening = (pauseOnly = true) => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsUserSpeaking(false);
    };

    const finishAnswer = () => {
        stopListening(true);
        if (onAnswerComplete) onAnswerComplete(transcript);
        // Reset state for next question
        setTranscript('');
        setHasRecorded(false);
    };

    return (
        <div className="flex flex-col items-center w-full px-6">

            {/* Feedback UI */}
            <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border shadow-sm min-h-[16rem] flex flex-col relative text-center">

                <p className="text-xl font-bold text-slate-800 tracking-tight leading-snug mb-4">
                    {currentQuestion}
                </p>

                {isAiSpeaking && !isUserSpeaking && !hasRecorded && (
                    <div className="mt-auto flex justify-center items-center gap-2 text-blue-600 font-bold mb-4">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        AI is speaking...
                    </div>
                )}

                {/* Auto-scrollable transcript */}
                <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar text-slate-500 italic px-2 text-sm text-center flex items-center justify-center min-h-[3rem]">
                    {transcript ? `"${transcript}"` : (isUserSpeaking ? "Listening..." : "Click microphone to start answering")}
                </div>

                {/* Controls Area */}
                <div className="mt-auto pt-4 border-t flex flex-wrap justify-center items-center gap-4">

                    {!isUserSpeaking ? (
                        <button
                            onClick={startListening}
                            className="bg-blue-500 text-white font-black uppercase text-sm px-6 py-3 rounded-full hover:bg-blue-600 transition shadow-lg flex items-center gap-2"
                        >
                            🎤 {hasRecorded ? 'Resume Recording' : 'Start Answering'}
                        </button>
                    ) : (
                        <button
                            onClick={() => stopListening(true)}
                            className="bg-red-500 text-white font-black uppercase text-sm px-6 py-3 rounded-full hover:bg-red-600 transition shadow-lg flex items-center gap-2"
                        >
                            ⏸️ Pause Recording
                        </button>
                    )}

                    {hasRecorded && !isUserSpeaking && (
                        <button
                            onClick={finishAnswer}
                            className="bg-green-500 text-white font-black uppercase text-sm px-8 py-3 rounded-full hover:bg-green-600 transition shadow-lg flex items-center gap-2"
                        >
                            ✅ Submit Answer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceInterface;
