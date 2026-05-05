import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_BASE = 'http://localhost:5001';

const formatTimestamp = (ms = 0) => {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const eventToChip = (event) => {
  if (event.type === 'filler_word') {
    return `said '${event.word || 'filler'}'`;
  }
  if (event.type === 'eye_contact_lost') {
    return 'eye contact lost';
  }
  if (event.type === 'long_pause') {
    const seconds = ((event.pauseDurMs || 0) / 1000).toFixed(1);
    return `${seconds}s pause`;
  }
  return 'event';
};

const eventStyle = (eventType) => {
  if (eventType === 'filler_word') return { color: '#f97316', icon: '🔴' };
  if (eventType === 'eye_contact_lost') return { color: '#ef4444', icon: '👁' };
  if (eventType === 'long_pause') return { color: '#eab308', icon: '⏸' };
  return { color: '#94a3b8', icon: '•' };
};

const Review = () => {
  const { id } = useParams();
  const { token: reduxToken } = useSelector((state) => state.user);
  const authToken = useMemo(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo?.token || reduxToken || null;
    } catch {
      return reduxToken || null;
    }
  }, [reduxToken]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [data, setData] = useState(null);
  const [polling, setPolling] = useState(false);
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const fetchReview = async (showInitialLoader = false) => {
    if (showInitialLoader) setLoading(true);
    try {
      if (!authToken) {
        toast.error('Missing auth token. Please log in again.');
        return;
      }
      const res = await axios.get(`${API_BASE}/api/sessions/${id}/review`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setData(res.data);
      const status = res.data?.session?.status;
      setPolling(status === 'processing');
    } catch (err) {
      toast.error('Failed to load review');
    } finally {
      if (showInitialLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview(true);
  }, [id, authToken]);

  useEffect(() => {
    if (!polling) return undefined;
    const timer = setInterval(() => fetchReview(false), 3000);
    return () => clearInterval(timer);
  }, [polling, id, authToken]);

  const session = data?.session;
  const events = useMemo(
    () => [...(data?.events || [])].sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0)),
    [data]
  );
  const analytics = data?.analytics || {};
  const durationSec = Math.max(1, Math.floor((session?.durationMs || 0) / 1000));

  const communicationScore = useMemo(() => {
    const fillers = analytics.fillerCount || 0;
    const pauses = analytics.longPauseCount || 0;
    const value = Math.max(0, 100 - Math.floor(fillers / 5) * 10 - pauses * 3);
    return value;
  }, [analytics]);

  const fillerBars = useMemo(() => {
    const breakdown = analytics.fillerBreakdown || {};
    return Object.entries(breakdown).map(([word, count]) => ({ word, count: Number(count || 0) }));
  }, [analytics]);

  useEffect(() => {
    if (!videoRef.current || !session?.videoUrl) return undefined;

    const player = videojs(videoRef.current, {
      controls: true,
      responsive: true,
      fluid: true,
      sources: [{ src: session.videoUrl, type: 'video/mp4' }]
    });
    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [session?.videoUrl]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const holder = player.el()?.querySelector('.vjs-progress-holder');
    if (!holder) return;

    holder.querySelectorAll('.se-marker').forEach((n) => n.remove());
    events.forEach((event) => {
      const marker = document.createElement('span');
      const style = eventStyle(event.type);
      marker.className = 'se-marker';
      marker.style.position = 'absolute';
      marker.style.top = '50%';
      marker.style.transform = 'translate(-50%, -50%)';
      marker.style.width = '8px';
      marker.style.height = '8px';
      marker.style.borderRadius = '9999px';
      marker.style.background = style.color;
      marker.style.left = `${((event.timestampMs || 0) / (durationSec * 1000)) * 100}%`;
      marker.style.cursor = 'pointer';
      marker.title = `${style.icon} ${formatTimestamp(event.timestampMs || 0)} - ${eventToChip(event)}`;
      marker.onclick = () => player.currentTime((event.timestampMs || 0) / 1000);
      holder.appendChild(marker);
    });
  }, [events, durationSec]);

  const handleEventSeek = (event) => {
    if (!playerRef.current) return;
    playerRef.current.currentTime((event.timestampMs || 0) / 1000);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(analytics.feedbackReport || '');
      toast.success('Report copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-10 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 h-[420px] bg-slate-200 rounded-2xl animate-pulse" />
            <div className="xl:col-span-2 h-[420px] bg-slate-200 rounded-2xl animate-pulse" />
          </div>
          <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">Interview Review</h1>
          {session?.status === 'processing' && (
            <div className="text-sm font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
              Processing... auto-refreshing
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <video ref={videoRef} className="video-js vjs-big-play-centered w-full rounded-xl" />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3">Event Timeline</h3>
              <div className="flex flex-wrap gap-2">
                {events.map((event) => {
                  const style = eventStyle(event.type);
                  return (
                    <button
                      key={`${event._id}-${event.timestampMs}`}
                      onClick={() => handleEventSeek(event)}
                      className="text-sm px-3 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                    >
                      <span className="mr-1">{style.icon}</span>
                      {formatTimestamp(event.timestampMs || 0)} - {eventToChip(event)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Overall Score</h3>
              <div className="w-40 h-40 mx-auto">
                <CircularProgressbar
                  value={analytics.overallScore || 0}
                  maxValue={100}
                  text={`${Math.round(analytics.overallScore || 0)}/100`}
                  styles={buildStyles({
                    textColor: '#1e293b',
                    pathColor: '#2563eb',
                    trailColor: '#e2e8f0'
                  })}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
              {[
                { label: 'Answer Quality', value: analytics.overallScore || 0, suffix: '/100' },
                { label: 'Eye Contact', value: analytics.eyeContactPct || 0, suffix: '% of time' },
                { label: 'Communication', value: communicationScore, suffix: '/100' }
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{metric.label}</span>
                    <span className="text-slate-500">
                      {Math.round(metric.value)}
                      {metric.suffix}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.min(100, metric.value)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-64">
              <h3 className="font-bold text-slate-800 mb-3">Filler Breakdown</h3>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={fillerBars}>
                  <XAxis dataKey="word" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {fillerBars.map((entry) => (
                      <Cell key={entry.word} fill="#fb923c" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex gap-2 p-3 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'questions' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Question Review
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'report' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Feedback Report
            </button>
          </div>

          {activeTab === 'questions' ? (
            <div className="p-4 space-y-4">
              {(session?.questions || []).map((q, idx) => {
                const score = (analytics.questionScores || []).find((s) => s.questionId === (q.id ?? idx));
                return (
                  <div key={`${q.id ?? idx}`} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-slate-800">Q{idx + 1}. {q.question}</h4>
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Score: {score ? `${score.score}/10` : 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-2">
                      {q.transcript || 'No transcript available'}
                    </p>
                    <p className="text-sm text-slate-700"><span className="font-semibold">Verdict:</span> {score?.verdict || '-'}</p>
                    <p className="text-sm text-slate-700"><span className="font-semibold">Improvement:</span> {score?.improvement || '-'}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4">
              <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-700">
                {analytics.feedbackReport || 'Feedback report is not available yet.'}
              </div>
              <button
                onClick={copyReport}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Share Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Review;
