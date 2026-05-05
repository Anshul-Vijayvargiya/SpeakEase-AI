import React, { useEffect, useRef, useState } from 'react';
import { Eye, MessageSquare, Zap, Clock, Brain } from 'lucide-react';

// Filler words to detect in transcript
const FILLER_WORDS = ['um', 'uh', 'like', 'basically', 'literally', 'you know', 'kind of', 'sort of', 'right', 'actually'];

/**
 * Custom hook that manages all live interview metrics:
 * - Filler word counting from speech transcript
 * - WPM calculation from transcript timing
 * - Eye contact simulation (CSS-based, no heavy ML in dev)
 * - Expression label tracking
 * - Client-side event collection for analytics
 */
export function useInterviewHUD() {
    const [fillerCount, setFillerCount] = useState(0);
    const [wpm, setWpm] = useState(0);
    const [eyeContactPct, setEyeContactPct] = useState(85);
    const [attentionScore, setAttentionScore] = useState(90);
    const [expression, setExpression] = useState('Focused');
    const [warning, setWarning] = useState('');
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());

    // Internal tracking
    const eventsRef = useRef([]);          // All collected events
    const fillerSetRef = useRef(new Set()); // Prevent duplicate counting per token
    const wordCountRef = useRef(0);
    const sessionStartRef = useRef(Date.now());

    // Start a new question — reset per-question counters
    const startQuestion = () => {
        setFillerCount(0);
        setWpm(0);
        setExpression('Focused');
        setWarning('');
        setQuestionStartTime(Date.now());
        fillerSetRef.current = new Set();
        wordCountRef.current = 0;
    };

    // Update real metrics from analyzer
    const updateBehaviorMetrics = (metrics) => {
        if (!metrics.hasFace) {
            setWarning('Face not detected');
            return;
        }

        setEyeContactPct(metrics.eyeContact);
        setAttentionScore(metrics.attention);
        setExpression(metrics.expression);

        // Warning logic
        if (metrics.eyeContact < 50) setWarning('Maintain eye contact');
        else if (metrics.attention < 60) setWarning('You seem distracted');
        else setWarning('');

        // Store events for report
        eventsRef.current.push({
            type: 'behavior_sample',
            eyeScore: metrics.eyeContact,
            attentionScore: metrics.attention,
            expression: metrics.expression,
            timestampMs: Date.now() - sessionStartRef.current
        });
    };

    // Analyze speech transcript for fillers and WPM
    const analyzeTranscript = (transcript) => {
        if (!transcript) return;
        const lower = transcript.toLowerCase();
        const words = lower.split(/\s+/).filter(Boolean);
        wordCountRef.current = words.length;

        // WPM
        const elapsedMin = (Date.now() - questionStartTime) / 60000;
        if (elapsedMin > 0.05) {
            setWpm(Math.round(words.length / elapsedMin));
        }

        // Filler detection
        words.forEach((word, idx) => {
            const clean = word.replace(/[^a-z]/g, '');
            const key = `${clean}-${idx}`;
            if (FILLER_WORDS.includes(clean) && !fillerSetRef.current.has(key)) {
                fillerSetRef.current.add(key);
                setFillerCount(prev => prev + 1);
                eventsRef.current.push({
                    type: 'filler_word',
                    word: clean,
                    timestampMs: Date.now() - sessionStartRef.current
                });
            }
        });
    };

    const recordPause = (pauseDurationMs) => {
        if (pauseDurationMs >= 1500) {
            eventsRef.current.push({
                type: 'long_pause',
                pauseDurMs: pauseDurationMs,
                timestampMs: Date.now() - sessionStartRef.current
            });
        }
    };

    const getEvents = () => [...eventsRef.current];

    const resetSession = () => {
        eventsRef.current = [];
        fillerSetRef.current = new Set();
        wordCountRef.current = 0;
        sessionStartRef.current = Date.now();
    };

    return {
        fillerCount,
        wpm,
        eyeContactPct,
        attentionScore,
        expression,
        warning,
        updateBehaviorMetrics,
        analyzeTranscript,
        startQuestion,
        recordPause,
        getEvents,
        resetSession
    };
}

/**
 * Live HUD overlay component — sticky bottom bar showing all live metrics
 */
const HUDOverlay = ({
    fillerCount = 0,
    wpm = 0,
    eyeContactPct = 0,
    attentionScore = 0,
    expression = 'Focused',
    timeLeft = null,
    questionType = 'technical',
    warning = ''
}) => {
    const eyeColor = eyeContactPct > 70 ? '#10b981' : eyeContactPct > 50 ? '#f59e0b' : '#ef4444';
    const wpmColor = wpm > 180 ? '#ef4444' : wpm > 80 ? '#10b981' : '#f59e0b';
    const fillerColor = fillerCount > 5 ? '#ef4444' : fillerCount > 2 ? '#f59e0b' : '#10b981';

    const typeColor = questionType === 'hr' ? 'from-violet-600 to-purple-600' : 'from-blue-600 to-indigo-600';

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const expressionEmoji = {
        'Confident': '😊',
        'Focused': '🎯',
        'Thoughtful': '🤔',
        'Rushed': '⚡',
        'Nervous': '😰',
        'Distracted': '📵'
    }[expression] || '🧠';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
            {/* Warning Message */}
            {warning && (
                <div className="mx-auto max-w-md mb-4">
                    <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-2 rounded-full text-sm font-black text-center shadow-xl animate-bounce border border-red-400">
                        ⚠️ {warning}
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-5xl px-4 pb-4">
                <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-2xl px-5 py-3 flex items-center gap-4">


                    {/* Question Type Badge */}
                    <div className={`bg-gradient-to-r ${typeColor} px-3 py-1.5 rounded-xl shrink-0`}>
                        <span className="text-white text-xs font-black uppercase tracking-widest">
                            {questionType === 'hr' ? '👤 HR' : '⚡ TECH'}
                        </span>
                    </div>

                    <div className="h-6 w-px bg-slate-700" />

                    {/* Eye Contact */}
                    <div className="flex items-center gap-2 min-w-0">
                        <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Eye Contact</p>
                            <p className="text-sm font-black" style={{ color: eyeColor }}>
                                {Math.round(eyeContactPct)}%
                            </p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700" />

                    {/* WPM */}
                    <div className="flex items-center gap-2 min-w-0">
                        <Zap className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pace (WPM)</p>
                            <p className="text-sm font-black" style={{ color: wpmColor }}>
                                {wpm || '—'}
                            </p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700" />

                    {/* Filler Words */}
                    <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fillers</p>
                            <p className="text-sm font-black" style={{ color: fillerColor }}>
                                {fillerCount}
                            </p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700" />

                    {/* Expression */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Brain className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Expression</p>
                            <p className="text-sm font-black text-slate-200">
                                {expressionEmoji} {expression}
                            </p>
                        </div>
                    </div>

                    {/* Timer */}
                    {timeLeft !== null && (
                        <>
                            <div className="h-6 w-px bg-slate-700" />
                            <div className="flex items-center gap-2 shrink-0">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <p className={`text-base font-black tabular-nums ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                                    {formatTime(timeLeft)}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HUDOverlay;
