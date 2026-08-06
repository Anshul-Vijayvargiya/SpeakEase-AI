import React, { useState } from 'react';
import API from '../../api';
import QuestionCard from './QuestionCard';
import { Sparkles, FileQuestion } from 'lucide-react';
import toast from 'react-hot-toast';

const TopicContent = ({ activeTopicData, isCompanyMode, onPractice, onViewAnswer, onGenerate }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateClick = async () => {
        setIsGenerating(true);
        try {
            const res = await API.post(`/interview/practice/generate`, {
                topic: activeTopicData.title
            });
            onGenerate(res.data.questions);
        } catch (error) {
            console.error("Failed to generate questions:", error);
            toast.error("Error generating questions. Please try again later.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!activeTopicData) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
                <p className="text-slate-400 font-medium">Select a topic from the sidebar to begin.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-50">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-10 lg:mb-14">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                        {activeTopicData.title}
                    </h2>
                    <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
                        {activeTopicData.description}
                    </p>
                </div>

                {/* Question Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 auto-rows-fr">
                    {activeTopicData.questions.map((q, idx) => (
                        <div key={idx} className="h-full">
                            <QuestionCard
                                question={q}
                                companyName={isCompanyMode ? activeTopicData.title : null}
                                onPractice={onPractice}
                                onViewAnswer={onViewAnswer}
                            />
                        </div>
                    ))}
                </div>

                {/* Empty State / Generate Button */}
                {(!activeTopicData.questions || activeTopicData.questions.length === 0) && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-white shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileQuestion className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-3">AI Practice Material</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">Generate custom, high-quality interview questions for {activeTopicData.title} on demand.</p>

                        <button
                            onClick={handleGenerateClick}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all flex items-center gap-3 mx-auto"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" /> Generate AI Questions
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicContent;
