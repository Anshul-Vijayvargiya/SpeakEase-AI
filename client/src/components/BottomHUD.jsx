import React from 'react';
import { Eye, Zap, MessageSquare, Smile, Timer as ClockIcon } from 'lucide-react';

const BottomHUD = ({ eyeContact, wpm, fillers, expression, timer, round }) => {
  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const EXPRESSION_COLORS = {
    "Confident": "#22c55e",
    "Smiling":   "#22c55e",
    "Focused":   "#3b82f6",
    "Neutral":   "#94a3b8",
    "Nervous":   "#f97316",
  };

  return (
    <div className="h-20 bg-[#0c0e14] border-t border-white/5 px-10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] z-10 w-full">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">{round === 'technical' ? 'Tech' : 'HR'}</span>
        </div>
        <div className="flex items-center gap-3 hud-item">
          <Eye className="w-4 h-4 text-blue-500" />
          <span className="hud-label text-slate-500">Eye Contact</span>
          <span className={`hud-value ${eyeContact < 70 ? 'text-red-500' : 'text-blue-500'}`}>
            {eyeContact}%
          </span>
        </div>
        <div className="flex items-center gap-3 hud-item">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="hud-label text-slate-500">Pace</span>
          <span className="hud-value text-amber-500">{wpm} WPM</span>
        </div>
        <div className="flex items-center gap-3 hud-item">
          <MessageSquare className="w-4 h-4 text-purple-500" />
          <span className="hud-label text-slate-500">💬 FILLERS</span>
          <span className="hud-value" style={{
            color: fillers > 5 ? "#ff4444" : 
                   fillers > 2 ? "#fbbf24" : "#22c55e"
          }}>
            {fillers}
          </span>
        </div>
        <div className="flex items-center gap-3 hud-item">
          <Smile className="w-4 h-4 text-emerald-500" />
          <span className="hud-label text-slate-500">😊 EXPRESSION</span>
          <span className="hud-value" style={{
            color: EXPRESSION_COLORS[expression] || "#94a3b8"
          }}>
            {expression}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-blue-500">
        <ClockIcon className="w-4 h-4" />
        <span className="text-lg tabular-nums">{formatTime(timer)}</span>
      </div>
    </div>
  );
};

export default BottomHUD;
