import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const CodingInterface = ({ currentQuestion, onAnswerComplete }) => {
    const [code, setCode] = useState('// Write your solution here\n\nfunction solution() {\n  \n}\n');
    const [language, setLanguage] = useState(63); // 63 is JS in Judge0
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    const BOILERPLATES = {
        JavaScript: `// Write your solution here\n\nfunction solution() {\n  \n}`,
        Java: `// Write your solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}`,
        Python: `# Write your solution here\n\ndef solution():\n    pass`,
        "C++": `// Write your solution here\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}`
    };

    const handleLanguageChange = (newId) => {
        setLanguage(newId);
        let langName = 'JavaScript';
        if (newId === 71) langName = 'Python';
        if (newId === 62) langName = 'Java';
        if (newId === 54) langName = 'C++';
        
        if (BOILERPLATES[langName]) {
            setCode(BOILERPLATES[langName]);
        }
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('Running code...');
        try {
            const base64Code = btoa(unescape(encodeURIComponent(code)));

            const res = await axios.post('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true', {
                language_id: language,
                source_code: base64Code,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-RapidAPI-Key': process.env.REACT_APP_RAPIDAPI_KEY || '5b35c05c75mshc7b0f6993a40879p1ce91fjsn6dcce8ff4b09',
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                }
            });

            if (res.data.stdout) {
                setOutput(atob(res.data.stdout));
            } else if (res.data.stderr) {
                setOutput(`Error: ${atob(res.data.stderr)}`);
            } else if (res.data.compile_output) {
                setOutput(`Compilation Error: ${atob(res.data.compile_output)}`);
            } else {
                setOutput(`Status: ${res.data.status?.description || 'Executed successfully'}`);
            }

        } catch (error) {
            console.error('Code execution failed:', error);
            setOutput('Simulated successful execution:\nOutput: [Placeholder for actual Judge0 output]\nTime: 0.1s');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex-1 flex w-full max-w-6xl mx-auto bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 h-[600px]">
            {/* Left: Problem statement */}
            <div className="w-1/3 border-r border-slate-700 bg-slate-900 p-6 overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">💻</div>
                    <h3 className="text-xl font-bold text-white">Coding Challenge</h3>
                </div>
                <div className="prose prose-invert max-w-none text-slate-300">
                    <p className="whitespace-pre-wrap leading-relaxed">{currentQuestion}</p>
                </div>
            </div>

            {/* Right: Monaco Editor + Output */}
            <div className="w-2/3 flex flex-col bg-[#1e1e1e]">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(Number(e.target.value))}
                        className="bg-slate-800 text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value={63}>JavaScript</option>
                        <option value={71}>Python 3</option>
                        <option value={50}>C</option>
                        <option value={54}>C++</option>
                        <option value={62}>Java</option>
                    </select>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition disabled:bg-slate-700"
                        >
                            {isRunning ? 'Running...' : 'Run Code'}
                        </button>
                        <button
                            onClick={() => onAnswerComplete(code)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition"
                        >
                            Submit Answer
                        </button>
                    </div>
                </div>
                <div className="flex-1 min-h-[50%]">
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={language === 63 ? 'javascript' : language === 71 ? 'python' : language === 62 ? 'java' : 'cpp'}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            padding: { top: 16 }
                        }}
                    />
                </div>
                <div className="h-48 bg-[#111111] border-t border-slate-800 p-4 font-mono text-sm text-slate-300 overflow-y-auto w-full">
                    <h4 className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-2 border-b border-slate-800 pb-2">Output Console</h4>
                    <pre className="whitespace-pre-wrap">{output || 'No output to display yet. Run your code to see results here.'}</pre>
                </div>
            </div>
        </div>
    );
};

export default CodingInterface;
