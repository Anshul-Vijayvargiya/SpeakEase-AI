import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const SQLTestSetupPage = () => {
    const navigate = useNavigate();
    const [topic, setTopic] = useState('Basic');
    const [difficulty, setDifficulty] = useState('Beginner');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const topics = ['Basic', 'Joins', 'Aggregations', 'Subqueries', 'Window Functions', 'Data Modification'];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

    const handleStart = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Note: in a real app, userId should come from context/auth
            const userId = JSON.parse(localStorage.getItem('user'))?.id || '661858e72750e32b6ba94d91'; // Fallback for dev

            const response = await API.post('/sql-test/start', {
                userId,
                topic,
                difficulty
            });

            if (response.data && response.data._id) {
                navigate(`/sql-test/${response.data._id}`, { 
                    state: { 
                        topic, 
                        difficulty 
                    } 
                });
            } else {
                throw new Error("Failed to start session");
            }
        } catch (err) {
            console.error("Setup error:", err);
            setError(err.response?.data?.error || err.message || "Failed to start test");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#111111] p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        SQL Coding Challenge
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Test your database querying skills in a live environment
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleStart} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Select Topic
                        </label>
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            {topics.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Select Difficulty
                        </label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            {difficulties.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Preparing Environment...</span>
                            </>
                        ) : (
                            <span>Start Challenge</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SQLTestSetupPage;
