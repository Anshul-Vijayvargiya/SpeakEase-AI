import React from 'react';
import { BookOpen, CheckCircle, Circle, Link as LinkIcon } from 'lucide-react';
import api from '../api';
import { toast } from 'react-hot-toast';

const TopicCard = ({ topic, planId, onComplete }) => {
  const handleComplete = async () => {
    if (topic.completed) return;
    try {
      await api.post('/study-plan/complete-topic', 
        { planId, topicId: topic._id }, 
        { withCredentials: true }
      );
      toast.success('Topic marked as completed!');
      onComplete(); // trigger refetch
    } catch (err) {
      toast.error('Failed to update topic');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${topic.completed ? 'bg-white/5 border-white/5 opacity-50' : 'bg-slate-800/50 border-white/10 hover:border-blue-500/50 transition-colors'}`}>
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="mt-1">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className={`font-bold ${topic.completed ? 'line-through text-slate-500' : 'text-white'}`}>
              {topic.title}
            </h4>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(topic.priority)}`}>
                {topic.priority} Priority
              </span>
              {topic.resourceLink && (
                <a href={topic.resourceLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  <LinkIcon className="w-3 h-3" />
                  Resource
                </a>
              )}
            </div>
          </div>
        </div>
        <button onClick={handleComplete} disabled={topic.completed} className="text-slate-400 hover:text-emerald-400 transition-colors">
          {topic.completed ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};

export default TopicCard;
