import React, { useState } from 'react';
import API from '../../api';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

const PracticeTerminal = ({ questions, initialIndex, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
    const [answer, setAnswer] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hint, setHint] = useState('');
    const [loadingHint, setLoadingHint] = useState(false);

    const question = questions[currentIndex];

    // Coding Playground state
    const isCodingMode = question?.topic?.toLowerCase() === 'dsa' || question?.round?.toLowerCase() === 'coding' || question?.title?.toLowerCase()?.includes('code');
    const [code, setCode] = useState('// Write your solution here\n\nfunction solution() {\n  \n}\n');
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    const handleGetHint = async () => {
        setLoadingHint(true);
        try {
            const res = await API.post('/interview/practice/hint', {
                question: question
            });
            setHint(res.data.hint);
        } catch (error) {
            console.error("Hint Error:", error);
            setHint("Try focusing on the core problem requirements.");
        } finally {
            setLoadingHint(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const finalAnswer = isCodingMode ? code : answer;
        if (!finalAnswer.trim()) return;

        setLoading(true);
        setEvaluation(null);
        try {
            const res = await API.post('/interview/practice/evaluate', {
                question: question,
                userAnswer: finalAnswer
            });
            setEvaluation(res.data);
        } catch (error) {
            console.error("Evaluation error:", error);
            toast.error("Evaluation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setAnswer('');
            setEvaluation(null);
            setHint('');
            setOutput('');
            setCode('// Write your solution here\n\nfunction solution() {\n  \n}\n');
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setAnswer('');
            setEvaluation(null);
            setHint('');
            setOutput('');
            setCode('// Write your solution here\n\nfunction solution() {\n  \n}\n');
        }
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('Running code...');
        try {
            const res = await API.post('/code/run', {
                code,
                language,
            });

            if (res.data.compileError) {
                setOutput(`Compilation Error: ${res.data.compileError}`);
            } else if (res.data.stderr) {
                setOutput(`Error: ${res.data.stderr}`);
            } else if (res.data.stdout) {
                setOutput(res.data.stdout);
            } else {
                setOutput(`Status: ${res.data.status || 'Executed successfully'}`);
            }

        } catch (error) {
            console.error('Code execution failed:', error);
            setOutput(error.response?.data?.detail || 'Execution failed');
        } finally {
            setIsRunning(false);
        }
    };

    if (isCodingMode) {
        return (
            <div className="flex-1 flex flex-col h-screen bg-slate-50 overscroll-contain">
                {/* Header for Coding */}
                <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 shadow-sm z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Coding Question {currentIndex + 1}</h2>
                            <div className="flex gap-2 items-center mt-1">
                                <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{question.topic || 'DSA'}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${question.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{question.difficulty}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-slate-100 text-slate-700 border-none rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python 3</option>
                            <option value="c">C</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                        <button
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold px-6 py-2 rounded-lg transition"
                        >
                            {isRunning ? 'Running...' : 'Run Code'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg shadow-md transition"
                        >
                            {loading ? 'Evaluating...' : 'Submit'}
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-slate-200 w-full relative">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Problem statement */}
                    <div className="w-1/3 border-r border-slate-200 bg-white p-6 overflow-y-auto">
                        <h3 className="text-2xl font-black text-slate-800 mb-4">{question.title}</h3>
                        <p className="text-slate-600 leading-relaxed mb-6">{question.explanation}</p>

                        <button
                            onClick={handleGetHint}
                            className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:underline mb-4"
                        >
                            💡 {loadingHint ? 'Thinking...' : 'Need a hint?'}
                        </button>
                        {hint && <p className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm italic mb-6 animate-in slide-in-from-top-2">{hint}</p>}

                        {evaluation && (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">AI Score</h4>
                                        <span className="text-3xl font-black text-blue-400">{evaluation.score}/10</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Strengths</p>
                                            <ul className="text-sm list-disc list-inside text-slate-300">
                                                {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-rose-400 mb-1">Missing Points</p>
                                            <ul className="text-sm list-disc list-inside text-slate-300">
                                                {evaluation.missingPoints.map((m, i) => <li key={i}>{m}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl">
                                    <p className="text-xs font-black uppercase text-slate-500 mb-2">Model Answer</p>
                                    <pre className="text-xs font-mono bg-slate-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{evaluation.modelAnswer}</pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Editor */}
                    <div className="w-2/3 flex flex-col bg-[#1e1e1e]">
                        <div className="flex-1 min-h-[50%]">
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                language={language}
                                value={code}
                                onChange={(val) => setCode(val || '')}
                                options={{ minimap: { enabled: false }, fontSize: 14 }}
                            />
                        </div>
                        <div className="h-48 bg-[#111111] border-t border-slate-800 p-4 font-mono text-sm text-slate-300 overflow-y-auto">
                            <h4 className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-2 border-b border-slate-800 pb-2">Output Console</h4>
                            <pre className="whitespace-pre-wrap">{output || 'Run your code to see output.'}</pre>
                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="bg-white border-t border-slate-200 px-8 py-4 flex justify-between shrink-0">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="px-6 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === questions.length - 1}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        Next Question →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-slate-50 overscroll-contain">
            {/* Header for Questions */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Practice Session</h2>
                        <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1">Question {currentIndex + 1} of {questions.length}</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleGetHint}
                        className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition"
                    >
                        💡 {loadingHint ? 'Thinking...' : 'Hint'}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !answer.trim()}
                        className="bg-blue-600 text-white font-bold px-8 py-2 rounded-xl shadow-md hover:bg-blue-700 disabled:bg-slate-300 transition"
                    >
                        {loading ? 'Analyzing...' : 'Submit Answer'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-200 w-full relative">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8 pb-12">
                    {/* Question Card */}
                    <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-2xl font-black text-slate-900 mb-4">{question.title}</h3>
                        <p className="text-lg text-slate-600 leading-relaxed mb-6">{question.explanation}</p>
                        {hint && <p className="bg-amber-50 border border-amber-100 p-5 rounded-2xl text-amber-800 text-sm italic animate-in fade-in duration-300">💡 Hint: {hint}</p>}
                    </div>

                    {!evaluation ? (
                        <textarea
                            className="w-full bg-white border-2 border-slate-100 rounded-3xl p-8 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg text-slate-700 shadow-sm"
                            rows="8"
                            placeholder="Write your detailed answer here..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                        />
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Evaluation Header */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] md:col-span-2 shadow-2xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-8 opacity-10">
                                         <span className="text-8xl font-black">{evaluation.score}</span>
                                     </div>
                                     <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Detailed AI Evaluation</h4>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                         <div className="space-y-4">
                                             <div className="flex items-center gap-2">
                                                 <div className="w-1.5 h-6 bg-emerald-400 rounded-full"></div>
                                                 <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Key Strengths</p>
                                             </div>
                                             <ul className="space-y-2">
                                                 {evaluation.strengths.map((s, i) => (
                                                     <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                                                         <span className="text-emerald-400 mt-1">✦</span> {s}
                                                     </li>
                                                 ))}
                                             </ul>
                                         </div>
                                         <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                 <div className="w-1.5 h-6 bg-rose-400 rounded-full"></div>
                                                 <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Points to Improve</p>
                                             </div>
                                             <ul className="space-y-2">
                                                 {evaluation.missingPoints.map((m, i) => (
                                                     <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                                                         <span className="text-rose-400 mt-1">○</span> {m}
                                                     </li>
                                                 ))}
                                             </ul>
                                         </div>
                                     </div>
                                </div>
                                <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-lg">
                                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Overall Score</p>
                                     <div className="relative">
                                         <svg className="w-32 h-32 transform -rotate-90">
                                             <circle cx="64" cy="64" r="56" stroke="rgba(226, 232, 240, 0.5)" strokeWidth="12" fill="transparent" />
                                             <circle cx="64" cy="64" r="56" stroke="#3b82f6" strokeWidth="12" fill="transparent" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * (evaluation.score * 10)) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                         </svg>
                                         <div className="absolute inset-0 flex items-center justify-center">
                                             <span className="text-4xl font-black text-slate-800">{evaluation.score}</span>
                                         </div>
                                     </div>
                                     <p className="text-xs font-bold text-slate-500 mt-4">Out of 10 points</p>
                                </div>
                            </div>
                            
                            {/* Model Answer Card */}
                            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Expert Model Answer</h4>
                                <div className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                                    {evaluation.modelAnswer}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="bg-white border-t border-slate-200 px-8 py-6 flex justify-between shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] selection:bg-blue-500 selection:text-white">
                <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="px-8 py-3 border-2 border-slate-100 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    <span className="text-lg">←</span> Previous
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                >
                    Next Question <span className="text-lg">→</span>
                </button>
            </div>
        </div>
    );
};

export default PracticeTerminal;
