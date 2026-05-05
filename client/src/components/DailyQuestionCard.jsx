import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DailyQuestionCard = () => {
    const [dailyInfo, setDailyInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDaily = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/daily');
                setDailyInfo(res.data);
            } catch (error) {
                console.error("Failed to fetch daily question");
            } finally {
                setLoading(false);
            }
        };
        fetchDaily();
    }, []);

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-700">
                <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
            </div>

            <div className="relative z-10 flex flex-col h-full justify-center text-center">
                <div className="mb-4 inline-flex items-center justify-center bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md mx-auto">
                    <span className="text-white text-xs font-black tracking-widest uppercase">Question of the Day</span>
                </div>

                {loading ? (
                    <div className="h-20 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : dailyInfo ? (
                    <h3 className="text-2xl font-black text-white leading-tight px-4">{dailyInfo.question}</h3>
                ) : (
                    <h3 className="text-xl font-bold text-white/80">Check back later for today's question!</h3>
                )}
            </div>
        </div>
    );
};

export default DailyQuestionCard;
