import React, { useState, useEffect } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import TopicCard from '../components/TopicCard';
import { Target, Brain, Award, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudyPlanPage = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    try {
      const res = await api.get('/study-plan', { withCredentials: true });
      setPlan(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load study plan');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] pl-72">
      <Sidebar />
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">Your Custom Study Plan</h1>
          <p className="text-slate-400 mt-2">AI-generated syllabus based on your latest interview performance.</p>
        </div>

        {!plan ? (
          <div className="p-12 text-center bg-white/5 border border-white/10 rounded-3xl">
            <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Study Plan Yet</h3>
            <p className="text-slate-400">Complete an interview session to generate your personalized plan.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">Current Focus Area</p>
                <h2 className="text-2xl font-bold text-white">{plan.focusArea}</h2>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Actionable Topics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.topics.map(topic => (
                  <TopicCard key={topic._id} topic={topic} planId={plan._id} onComplete={fetchPlan} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlanPage;
