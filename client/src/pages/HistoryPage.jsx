import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../api';
import { useNavigate } from 'react-router-dom';

const HistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this interview session?")) {
      try {
        await API.delete(`/interview/${id}`);
        setSessions(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete the session.");
      }
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get(`/interview/history`);
        setSessions(res.data);
      } catch (err) {
        console.error("History fetch error:", err);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0e14] flex text-white">
      <Sidebar />
      <main className="flex-1 ml-72 p-10">
        <h1 className="text-3xl font-black mb-8">Interview History</h1>
        <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 uppercase text-xs tracking-widest">
                <th className="pb-4">Date</th>
                <th className="pb-4">Role</th>
                <th className="pb-4">Type</th>
                <th className="pb-4">Score</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sessions.map(session => (
                <tr key={session._id} className="hover:bg-white/[0.02]">
                  <td className="py-4 text-sm font-bold text-slate-300">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-sm font-bold">{session.role || 'N/A'}</td>
                  <td className="py-4 text-xs font-black uppercase text-blue-500">
                    {session.interviewType || 'simulation'}
                  </td>
                  <td className="py-4 font-black text-emerald-500">
                    {session.overallScore ? `${session.overallScore}%` : '0%'}
                  </td>
                  <td className="py-4 text-xs font-bold text-amber-500">{session.status}</td>
                  <td className="py-4 text-right flex items-center justify-end gap-2">
                    {session.status === 'Completed' && (
                      <button 
                        onClick={() => navigate(`/report/${session._id}`)}
                        className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10"
                      >
                        View Report
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(session._id)}
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-500">No sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
