import React, { useEffect, useState } from "react";
import API from "../api";
import { History, ChevronRight, Activity, Search, Clock, Mic, LogOut, Calendar } from "lucide-react";

const HistorySidebar = ({ refreshTrigger, onSelectSession, onStartNew, onLogout }) => {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await API.get("/analysis/history");

        // Remove duplicates by ID
        const uniqueSessions = [];
        const seenIds = new Set();

        for (const session of data) {
          if (!seenIds.has(session._id)) {
            seenIds.add(session._id);
            uniqueSessions.push(session);
          }
        }

        // Sort chronologically (newest first)
        uniqueSessions.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setSessions(uniqueSessions);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    fetchHistory();
  }, [refreshTrigger]);

  // Handle Date Grouping Logic
  const groupSessions = (sessionList) => {
    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    sessionList.forEach(session => {
      // Apply Search Filter First
      if (searchQuery && !session.topic?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      if (!session.createdAt) {
        groups.Older.push(session);
        return;
      }

      const sessionDate = new Date(session.createdAt);
      if (isNaN(sessionDate.getTime())) {
        groups.Older.push(session);
        return;
      }

      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === now.getTime()) {
        groups.Today.push(session);
      } else if (sessionDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(session);
      } else if (sessionDate.getTime() > lastWeek.getTime()) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups.Older.push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessions(sessions);

  // Group Header Component
  const GroupHeader = ({ title }) => (
    <div className="flex items-center gap-2 mt-6 mb-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest pl-1">
      <Calendar size={12} /> {title}
    </div>
  );

  return (
    <div className="w-80 bg-slate-950 h-screen p-6 flex flex-col hidden lg:flex">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <History className="text-white" />
          <span className="text-white font-bold text-lg">Activity</span>
        </div>
        <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
          <LogOut size={18} />
        </button>
      </div>

      {/* Start Interview Button */}
      <button
        onClick={onStartNew}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold mb-6 transition-colors shadow-lg shadow-blue-900/20"
      >
        <Mic size={18} />
        Start New Interview
      </button>

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input
          type="text"
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl py-2 pl-9 text-sm text-white outline-none transition-colors"
        />
      </div>

      {/* Sessions History List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-2 pb-4">

        {sessions.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <Activity className="mx-auto mb-2 opacity-50" />
            <p className="font-medium text-sm">No History Found</p>
          </div>
        )}

        {Object.entries(groupedSessions).map(([groupName, groupItems]) => {
          if (groupItems.length === 0) return null;

          return (
            <div key={groupName}>
              <GroupHeader title={groupName} />
              <div className="space-y-2">
                {groupItems.map((session) => (
                  <button
                    key={session._id}
                    onClick={() => onSelectSession(session)}
                    className="w-full text-left p-4 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group"
                  >
                    <div className="flex justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={12} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">
                          {session.createdAt && !isNaN(new Date(session.createdAt).getTime())
                            ? new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : "N/A"}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="text-white text-sm font-bold truncate mb-2">
                      {session.topic || "Interview Practice"}
                    </div>

                    <div className="flex gap-2">
                      {(session.status === 'completed' || session.finalAnalysis) ? (
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-800/50">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-800/50">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistorySidebar;