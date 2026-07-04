import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, ChevronLeft, Terminal as TerminalIcon, Clock } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';

const CodingInterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [code, setCode] = useState('// Write your code here');
  const [output, setOutput] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2700); // 45 mins

  useEffect(() => {
    // fetch session
    API.get(`/coding/${id}`).then(res => {
      setSession(res.data);
      // Set default snippet if code is empty
      if (res.data.language === 'python') {
        setCode('def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()');
      } else if (res.data.language === 'java') {
        setCode('public class Main {\n    public static void main(String[] args) {\n        \n    }\n}');
      } else if (res.data.language === 'cpp') {
        setCode('#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}');
      } else {
        setCode('function solve() {\n  \n}\n\nsolve();');
      }
    }).catch(err => {
      toast.error('Failed to load coding session');
    });
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleRun = async () => {
    if (!code) return;
    setRunning(true);
    setOutput('Running...');
    try {
      // Piston API mappings
      const languageMap = {
        'javascript': { language: 'javascript', version: '18.15.0' },
        'python': { language: 'python', version: '3.10.0' },
        'java': { language: 'java', version: '15.0.2' },
        'cpp': { language: 'cpp', version: '10.2.0' }
      };
      
      const langConfig = languageMap[session.language] || languageMap['javascript'];
      
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          files: [{ content: code }]
        })
      });
      const data = await res.json();
      
      if (data.run) {
          setOutput(data.run.output || (data.run.code === 0 ? 'Code executed successfully with no output.' : 'Error: No output generated'));
      } else {
          setOutput(data.message || 'Execution failed');
      }
    } catch (err) {
      console.error(err);
      setOutput('Error executing code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setEvaluating(true);
    try {
      const res = await API.post('/coding/evaluate', {
        sessionId: id,
        code,
        output
      });
      toast.success('Code evaluated successfully!');
      
      // We can navigate to report dashboard or back to dashboard
      navigate('/dashboard'); 
    } catch (err) {
      console.error(err);
      toast.error('Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  if (!session) return <div className="min-h-screen bg-[#0c0e14] text-white flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>;

  return (
    <div className="h-screen bg-[#0c0e14] text-white flex flex-col font-sans">
      {/* Navbar */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-[#151821]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-lg">{session.topic} Coding Challenge</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-emerald-400 font-mono bg-emerald-500/10 px-4 py-1.5 rounded-full">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={evaluating}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
          >
            {evaluating ? 'Evaluating...' : (
              <>Submit <CheckCircle className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem Statement */}
        <div className="w-1/3 border-r border-white/10 bg-[#0c0e14] overflow-y-auto p-6 scrollbar-thin">
          <h1 className="text-2xl font-black mb-4">{session.problem?.title || 'Coding Problem'}</h1>
          <div className="flex gap-2 mb-6">
            <span className={`px-2 py-1 text-xs font-bold rounded ${
              session.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
              session.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {session.difficulty}
            </span>
            <span className="px-2 py-1 text-xs font-bold bg-white/10 rounded">{session.language}</span>
          </div>
          <div className="prose prose-invert max-w-none text-slate-300">
            <p className="whitespace-pre-wrap leading-relaxed">{session.problem?.description}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">Examples</h3>
            <div className="space-y-4">
              {session.problem?.examples?.map((ex, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-xl font-mono text-sm">
                  <div className="text-slate-400">Input: <span className="text-emerald-400">{ex.input}</span></div>
                  <div className="text-slate-400 mt-2">Output: <span className="text-blue-400">{ex.output}</span></div>
                  {ex.explanation && <div className="text-slate-500 mt-2 text-xs font-sans border-t border-white/10 pt-2">{ex.explanation}</div>}
                </div>
              ))}
            </div>

            <h3 className="text-lg font-bold text-white mt-8 mb-4">Constraints</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
              {session.problem?.constraints?.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>

        {/* Right Panel: Editor & Output */}
        <div className="w-2/3 flex flex-col">
          {/* Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={session.language === 'cpp' ? 'cpp' : session.language}
              value={code}
              onChange={setCode}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                lineHeight: 1.5,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true
              }}
            />
            {/* Run Button Overlay */}
            <div className="absolute bottom-4 right-6">
              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/50 transition-all disabled:opacity-50 z-10"
              >
                {running ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                Run Code
              </button>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="h-64 border-t border-white/10 bg-[#151821] flex flex-col z-20">
            <div className="h-10 border-b border-white/5 flex items-center px-4 bg-[#1a1f2e]">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <TerminalIcon className="w-4 h-4" />
                Execution Output
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
              {output ? (
                <pre className="text-slate-300 whitespace-pre-wrap">{output}</pre>
              ) : (
                <div className="text-slate-600 flex h-full items-center justify-center">
                  Run your code to see the output here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingInterviewPage;
