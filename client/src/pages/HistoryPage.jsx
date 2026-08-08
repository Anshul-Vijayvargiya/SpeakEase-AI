import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import SolutionPanel from '../components/aptitude/SolutionPanel';
import useSidebarStore from '../store/sidebarStore';

const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// Same aggregation logic as ReportDashboard.jsx's Summary tab: the stored
// overallScore/technicalScore/hrPerformance fields are only computed and
// saved once, server-side, when the interview is finished — so a session
// completed by an older code path (or one that never ran that step) can sit
// at 0 forever even though real per-question metrics exist. Derive it live
// from technicalResults/hrResults/codingResults instead, falling back to the
// stored fields only when there's no per-question data at all yet.
const computeInterviewScore = (item) => {
  const questions = [
    ...(item.codingResults || []),
    ...(item.technicalResults || []),
    ...(item.hrResults || [])
  ];

  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const techScores = questions.map(q => q.metrics?.technicalCorrectness).filter(v => v != null);
  const commScores = questions.map(q => q.metrics?.communicationSkills).filter(v => v != null);

  const technicalAccuracy = techScores.length ? avg(techScores) : (item.technicalScore || 0);
  const communication = commScores.length ? avg(commScores) : (item.hrPerformance || 0);

  if (techScores.length > 0 && commScores.length > 0) {
    return Math.round(technicalAccuracy * 0.7 + communication * 0.3);
  } else if (techScores.length > 0) {
    return technicalAccuracy;
  } else if (commScores.length > 0) {
    return communication;
  }
  return item.overallScore || 0;
};

// Subtext for Expired sessions — how far the candidate got before abandoning.
const getExpiredProgressLabel = (item) => {
  const questions = [
    ...(item.codingResults || []),
    ...(item.technicalResults || []),
    ...(item.hrResults || [])
  ];
  const total = questions.length;
  const answered = questions.filter(q => q.userAnswer && q.userAnswer.trim().length > 0).length;
  return answered === 0 ? 'Never started' : `Left after ${answered} of ${total} questions`;
};

const HistoryPage = () => {
  const { collapsed } = useSidebarStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAptitudeSession, setSelectedAptitudeSession] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, type, label }
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    const { id, type } = confirmDelete;
    setDeleting(true);
    try {
      if (type === 'aptitude') {
        await API.delete(`/aptitude/${id}`);
      } else {
        await API.delete(`/interview/${id}`);
      }
      setSessions(prev => prev.filter(s => s._id !== id));
      showToast('Session deleted successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err?.response?.data?.error || 'Failed to delete the session.', true);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleViewAptitudeDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const res = await API.get(`/aptitude/session/${id}`);
      setSelectedAptitudeSession(res.data);
    } catch (err) {
      console.error('Failed to fetch aptitude session details:', err);
      showToast('Failed to load details.', true);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [interviewRes, aptitudeRes] = await Promise.allSettled([
          API.get('/interview/history'),
          API.get('/aptitude/history'),
        ]);

        const interviews =
          interviewRes.status === 'fulfilled'
            ? interviewRes.value.data.map(item => ({
                ...item,
                type: 'interview',
                date: item.createdAt,
                title: item.role || 'Simulation',
                scoreValue: computeInterviewScore(item),
                displayType: item.interviewType || 'simulation',
                progressLabel: item.status === 'Expired' ? getExpiredProgressLabel(item) : null,
              }))
            : [];

        const aptitudes =
          aptitudeRes.status === 'fulfilled'
            ? aptitudeRes.value.data.map(item => ({
                ...item,
                type: 'aptitude',
                date: item.completedAt || item.createdAt,
                title: item.topics && item.topics.length > 0 ? item.topics.join(', ') : 'Aptitude Practice',
                scoreValue: item.score,
                displayType: 'aptitude',
              }))
            : [];

        const combined = [...interviews, ...aptitudes].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setSessions(combined);
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0c0e14] flex text-white overflow-hidden">
      {/* Ambient gradient mesh — same visual language as Dashboard.jsx */}
      <div className="pointer-events-none fixed top-[-8%] right-[8%] w-[42rem] h-[42rem] bg-blue-600/30 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed top-[6%] left-[32%] w-[36rem] h-[36rem] bg-purple-600/25 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[15%] w-[32rem] h-[32rem] bg-indigo-600/15 rounded-full blur-3xl" />

      <Sidebar />
      <main className={`relative z-10 flex-1 p-10 transition-all duration-200 ease-in-out ${collapsed ? 'ml-[72px]' : 'ml-72'}`}>
        <h1 className="text-3xl font-black mb-8">Practice & Simulator History</h1>

        <div className="bg-white/[0.06] backdrop-blur-lg border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-10">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-semibold">Loading history...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 uppercase text-xs tracking-widest">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Title / Topics</th>
                  <th className="pb-4">Category</th>
                  <th className="pb-4">Score</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map(session => (
                  <tr key={session._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 text-sm font-bold text-slate-300">
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-sm font-bold max-w-[280px] truncate" title={session.title}>
                      {session.title}
                    </td>
                    <td className={`py-4 text-xs font-black uppercase ${session.type === 'aptitude' ? 'text-purple-500' : 'text-blue-500'}`}>
                      {session.displayType}
                    </td>
                    <td className="py-4 font-black text-emerald-500">
                      {session.scoreValue !== undefined ? `${session.scoreValue}%` : '0%'}
                    </td>
                    <td className="py-4 text-xs font-bold text-amber-500 capitalize">
                      {session.type === 'interview' && session.status === 'Expired' ? (
                        <div>
                          <span className="text-red-400">Expired — not completed</span>
                          {session.progressLabel && (
                            <p className="text-slate-500 font-medium normal-case mt-0.5">{session.progressLabel}</p>
                          )}
                        </div>
                      ) : (
                        session.status
                      )}
                    </td>
                    <td className="py-4 text-right flex items-center justify-end gap-2">
                      {session.type === 'interview' && session.status === 'Completed' && (
                        <button
                          onClick={() => navigate(`/report/${session._id}`)}
                          className="px-4 py-2 bg-white/5 border border-white/[0.12] rounded-xl text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                          View Report
                        </button>
                      )}
                      {session.type === 'aptitude' && session.status === 'completed' && (
                        <button
                          onClick={() => handleViewAptitudeDetails(session._id)}
                          disabled={loadingDetails}
                          className="px-4 py-2 bg-white/5 border border-white/[0.12] rounded-xl text-xs font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                          {loadingDetails ? 'Loading...' : 'View Results'}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            id: session._id,
                            type: session.type,
                            label: session.type === 'aptitude' ? 'aptitude practice' : 'interview',
                          })
                        }
                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500">
                      No sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── Inline Delete Confirmation Modal ─────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h2 className="text-lg font-black text-white mb-2">Delete Session?</h2>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to delete this{' '}
              <span className="text-white font-bold">{confirmDelete.label}</span> session? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                )}
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ───────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-xl transition-all ${
            toast.isError ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Aptitude Results Modal ────────────────────────────────────── */}
      {selectedAptitudeSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151821] border border-white/5 w-full max-w-4xl max-h-[85vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Aptitude Practice Results</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Topics: {selectedAptitudeSession.topics?.join(', ') || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedAptitudeSession(null)}
                className="text-slate-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: '📊', label: 'Score', value: `${selectedAptitudeSession.score}%`, color: 'text-purple-500' },
                  {
                    icon: '✅', label: 'Correct',
                    value: `${selectedAptitudeSession.correctCount ?? selectedAptitudeSession.results?.filter(r => r.isCorrect).length ?? 0} / ${selectedAptitudeSession.totalQuestions}`,
                    color: 'text-emerald-500',
                  },
                  {
                    icon: '❌', label: 'Wrong',
                    value: `${selectedAptitudeSession.wrongCount ?? selectedAptitudeSession.results?.filter(r => !r.isCorrect).length ?? 0} / ${selectedAptitudeSession.totalQuestions}`,
                    color: 'text-red-500',
                  },
                  { icon: '⏱', label: 'Time Taken', value: formatTime(selectedAptitudeSession.timeTaken || 0), color: 'text-blue-500' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className="bg-[#0c0e14] border border-white/5 rounded-2xl p-4 text-center">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-slate-400 text-xs font-semibold">{label}</div>
                    <div className={`${color} font-black text-xl mt-1`}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-white border-b border-white/5 pb-2">📋 Question Review</h3>
                {selectedAptitudeSession.results && selectedAptitudeSession.results.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {selectedAptitudeSession.results.map((r, i) => (
                      <div
                        key={i}
                        className={`border rounded-2xl overflow-hidden p-4 ${
                          r.isCorrect ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">{r.isCorrect ? '✅' : '❌'}</span>
                          <div className="flex-1">
                            <p className="text-slate-200 font-bold text-sm leading-relaxed">{r.question}</p>
                            <div className="flex gap-2 mt-2 flex-wrap text-[10px] font-extrabold uppercase">
                              <span className="text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded-md">{r.topic}</span>
                              <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">{r.difficulty}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                              {r.options && Object.entries(r.options).map(([k, v]) => {
                                const isCorrect = k === r.correctAnswer;
                                const isSelected = k === r.selected;
                                return (
                                  <div
                                    key={k}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                                      isCorrect
                                        ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-400'
                                        : isSelected
                                        ? 'bg-red-900/40 border-red-500/40 text-red-400'
                                        : 'bg-slate-900/40 border-white/5 text-slate-400'
                                    }`}
                                  >
                                    <span className="mr-1">{k}:</span> {v}
                                  </div>
                                );
                              })}
                            </div>
                            {r.solution && (
                              <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-300">
                                <div className="font-extrabold text-white mb-1 uppercase tracking-wider text-[10px]">
                                  Solution & Explanation:
                                </div>
                                {typeof r.solution === 'string' ? (
                                  <p className="leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{r.solution}</p>
                                ) : (
                                  <SolutionPanel solution={r.solution} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No details available for this session.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedAptitudeSession(null)}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
