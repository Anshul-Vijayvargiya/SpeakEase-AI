import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import API from '../api';
import Editor from '@monaco-editor/react';
import { useSQLRunner } from '../hooks/useSQLRunner';

const SQLTestPage = () => {
    const { sessionId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { topic = 'Basic', difficulty = 'Beginner' } = location.state || {};

    const { isReady, error: dbError, executeDDL, executeDML, runQuery, compareResults, resetDb } = useSQLRunner();

    const [problem, setProblem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userQuery, setUserQuery] = useState('-- Write your SQL query here\n');
    const [queryResult, setQueryResult] = useState(null);
    const [expectedResult, setExpectedResult] = useState(null);
    const [evaluation, setEvaluation] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [execError, setExecError] = useState(null);
    const [sampleData, setSampleData] = useState([]);
    
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [problemIndex, setProblemIndex] = useState(1);
    const totalProblems = 5;
    const [score, setScore] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const [hasRun, setHasRun] = useState(false);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await API.post(`/sql-test/problem`, {
                    topic,
                    difficulty
                });
                setProblem(response.data);
            } catch (err) {
                console.error("Failed to fetch problem", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProblem();
    }, [topic, difficulty]);

    useEffect(() => {
        if (isLoading || !isReady) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isLoading, isReady]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        // Initialize database when problem is loaded and DB is ready
        if (isReady && problem) {
            try {
                resetDb();
                executeDDL(problem.expectedSchema);
                if (problem.initialData) {
                    executeDML(problem.initialData);
                }
                
                // Fetch Sample Data from tables
                const tablesRes = runQuery("SELECT name FROM sqlite_master WHERE type='table';");
                if (tablesRes && !tablesRes.error && tablesRes.values) {
                    const tables = tablesRes.values.map(row => row[0]).filter(name => name !== 'sqlite_sequence');
                    const samples = tables.map(tableName => {
                        const data = runQuery(`SELECT * FROM ${tableName} LIMIT 5;`);
                        return { tableName, data };
                    });
                    setSampleData(samples);
                }

                // Pre-compute expected result for validation
                const expRes = runQuery(problem.expectedQuery);
                setExpectedResult(expRes);
                
                // Reset state for new problem
                setHasRun(false);
                setQueryResult(null);
                setExecError(null);
                setEvaluation(null);
                setShowSolution(false);
            } catch (err) {
                console.error("Failed to setup problem environment:", err);
                setExecError("Environment Setup Error: " + err.message);
            }
        }
    }, [isReady, problem]);

    const handleRunQuery = () => {
        if (!isReady || !problem) return;
        setExecError(null);
        setEvaluation(null);
        setShowSolution(false);
        setHasRun(true);
        
        try {
            const res = runQuery(userQuery);
            if (res.error) {
                setExecError(res.error);
                setQueryResult(null);
            } else {
                setQueryResult(res);
            }
        } catch (err) {
            setExecError(err.message);
            setQueryResult(null);
        }
    };

    const handleSubmit = async () => {
        if (!isReady || !problem) return;
        setIsEvaluating(true);
        setHasRun(true);
        
        let currentResult = queryResult;
        let currentError = execError;

        // Run it again just to be sure
        try {
            const res = runQuery(userQuery);
            if (res.error) {
                currentError = res.error;
                currentResult = null;
            } else {
                currentResult = res;
                currentError = null;
            }
            setQueryResult(currentResult);
            setExecError(currentError);
        } catch (err) {
            currentError = err.message;
            currentResult = null;
            setExecError(currentError);
            setQueryResult(null);
        }

        const isCorrect = !currentError && expectedResult && compareResults(currentResult, expectedResult);

        try {
            const response = await API.post(`/sql-test/submit`, {
                sessionId,
                questionId: problem._id,
                userQuery,
                isCorrect: !!isCorrect,
                executionError: currentError
            });
            
            setEvaluation({
                ...response.data,
                isCorrect
            });

            if (isCorrect) {
                setScore(prev => prev + (response.data.score || 0));
            }
        } catch (err) {
            console.error("Submission error", err);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleComplete = async () => {
        try {
            await API.post(`/sql-test/complete`, { sessionId });
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to complete", err);
        }
    };

    const handleNext = async () => {
        // Reset states for next problem
        setIsLoading(true);
        setProblem(null);
        setUserQuery('-- Write your SQL query here\n');
        setQueryResult(null);
        setExpectedResult(null);
        setEvaluation(null);
        setExecError(null);
        setHasRun(false);
        setShowSolution(false);
        setSampleData([]);
        
        if (problemIndex < totalProblems) {
            setProblemIndex(prev => prev + 1);
        }

        try {
            const response = await API.post(`/sql-test/problem`, {
                topic,
                difficulty
            });
            setProblem(response.data);
        } catch (err) {
            console.error("Failed to fetch next problem", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !isReady) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-gray-400">Loading Environment...</p>
                </div>
            </div>
        );
    }

    if (dbError) {
        return <div className="min-h-screen bg-[#0a0a0a] text-red-500 p-8">DB Error: {dbError}</div>;
    }

    const renderTable = (result, title = null) => {
        if (!result) return <div className="text-gray-500 text-sm italic p-4 bg-[#111] rounded-lg border border-white/5">No output generated.</div>;
        
        if (result.columns.length === 0) {
            return <div className="text-gray-500 text-sm italic p-4 bg-[#111] rounded-lg border border-white/5">Query executed successfully but returned no results.</div>;
        }

        return (
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#111]">
                {title && <div className="bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-gray-400 border-b border-white/5">{title}</div>}
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400">
                        <tr>
                            {result.columns.map((col, i) => (
                                <th key={i} className="px-4 py-3 border-b border-white/5">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {result.values.map((row, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                {row.map((val, j) => (
                                    <td key={j} className="px-4 py-3 whitespace-nowrap">{val !== null ? String(val) : 'NULL'}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col h-screen">
            {/* Top Bar */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#111] shrink-0">
                <div className="flex items-center space-x-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        SQL Challenge
                    </h1>
                    <div className="flex space-x-4 text-sm font-medium">
                        <span className="text-gray-300">Problem {problemIndex} of {totalProblems}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-300">Topic: {topic}</span>
                        <span className="text-gray-500">|</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs border ${
                            difficulty === 'Beginner' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            difficulty === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                            'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                            {difficulty}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-sm font-mono">
                        <span className="text-gray-400">⏱ Timer:</span>
                        <span className={`${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-gray-200'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm font-medium">
                        <span className="text-gray-400">Score:</span>
                        <span className="text-blue-400">{score}</span>
                    </div>
                    <button
                        onClick={handleComplete}
                        className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                    >
                        End Test
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Problem & Sample Data */}
                <div className="w-[40%] flex flex-col border-r border-white/10 bg-[#0a0a0a] overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        <h2 className="text-xl font-bold mb-4 text-white">Problem Statement</h2>
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300 mb-8 whitespace-pre-wrap">
                            {problem?.problemStatement}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-4 text-white">Sample Data</h3>
                        {sampleData.length > 0 ? (
                            <div className="space-y-6 mb-8">
                                {sampleData.map((sample, idx) => (
                                    <div key={idx}>
                                        <h4 className="text-sm font-mono text-blue-400 mb-2">Table: {sample.tableName}</h4>
                                        {renderTable(sample.data)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 mb-8">No sample data available.</div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Editor & Output */}
                <div className="w-[60%] flex flex-col bg-[#111]">
                    {/* Editor Section */}
                    <div className="h-[50%] flex flex-col border-b border-white/10">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5">
                            <span className="text-sm font-mono text-gray-400">SQL Editor</span>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleRunQuery}
                                    className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-sm transition-colors border border-white/10 flex items-center space-x-2"
                                >
                                    <span>▶ Run Code</span>
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isEvaluating}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    <span>✓ Submit</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <Editor
                                height="100%"
                                defaultLanguage="sql"
                                theme="vs-dark"
                                value={userQuery}
                                onChange={(val) => setUserQuery(val || '')}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16 }
                                }}
                            />
                        </div>
                    </div>

                    {/* Output & Feedback Section */}
                    <div className="h-[50%] p-6 overflow-y-auto bg-[#0a0a0a] custom-scrollbar">
                        <h2 className="text-lg font-semibold mb-4 text-gray-200">Execution Output</h2>
                        
                        {/* Feedback / Evaluation Section */}
                        {evaluation && (
                            <div className={`p-5 rounded-xl border mb-6 ${evaluation.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className={`text-lg font-bold mb-1 ${evaluation.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                            {evaluation.isCorrect ? '🎉 Correct Solution!' : '❌ Incorrect Solution'}
                                        </h3>
                                        <p className="text-sm text-gray-300 mt-2">{evaluation.feedback}</p>
                                    </div>
                                    <span className={`text-2xl font-black ${evaluation.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                        +{evaluation.isCorrect ? (evaluation.score || 0) : 0} pts
                                    </span>
                                </div>

                                <div className="mt-4 flex space-x-3">
                                    {evaluation.isCorrect ? (
                                        <button 
                                            onClick={handleNext}
                                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Next Problem ➔
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowSolution(!showSolution)}
                                            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-white/10"
                                        >
                                            {showSolution ? 'Hide Solution' : 'Show Solution'}
                                        </button>
                                    )}
                                </div>

                                {showSolution && !evaluation.isCorrect && (
                                    <div className="mt-4 p-4 bg-[#111] border border-white/10 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Expected Query:</h4>
                                        <pre className="text-sm text-blue-300 font-mono whitespace-pre-wrap">
                                            {problem.expectedQuery}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Errors */}
                        {execError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6 font-mono">
                                <span className="font-bold">Execution Error:</span> {execError}
                            </div>
                        )}

                        {/* Results Display */}
                        {!hasRun && !execError && !evaluation && (
                            <div className="text-gray-500 text-sm italic">
                                Run your query to see the results here.
                            </div>
                        )}

                        {hasRun && !execError && (
                            <div className="space-y-8 mt-2">
                                <div>
                                    <h3 className="text-sm font-semibold mb-3 text-gray-400">Your Query Result</h3>
                                    {renderTable(queryResult, 'Actual Output')}
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-semibold mb-3 text-gray-400">Expected Result</h3>
                                    {renderTable(expectedResult, 'Target Output')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Global style for scrollbars in this component if needed, though Tailwind mostly handles it, or use custom-scrollbar class if defined in index.css */}
        </div>
    );
};

export default SQLTestPage;
