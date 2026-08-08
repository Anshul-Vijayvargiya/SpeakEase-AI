import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopicSelector from '../components/aptitude/TopicSelector';
import QuestionCard  from '../components/aptitude/QuestionCard';
import ResultScreen  from '../components/aptitude/ResultScreen';
import API           from '../api';
import Sidebar       from '../components/Sidebar';
import useSidebarStore from '../store/sidebarStore';

// Phase enum
const PHASE = { SETUP: 'setup', PRACTICE: 'practice', RESULT: 'result' };

const AptitudePage = () => {
  const { collapsed } = useSidebarStore();
  // ── Session state ──────────────────────────────────────────────────────────
  const [phase,           setPhase]          = useState(PHASE.SETUP);
  const [selectedTopics,  setSelectedTopics] = useState([]);
  const [config,          setConfig]         = useState({ count: 10, difficulty: 'Mixed', timeLimit: 60 });
  const [loading,         setLoading]        = useState(false);
  const [error,           setError]          = useState('');

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [questions,   setQuestions]   = useState([]);
  const [sessionId,   setSessionId]   = useState(null);
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [answers,     setAnswers]     = useState([]);
  const [answered,    setAnswered]    = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [skipped,     setSkipped]     = useState(false);

  // ── Result state ───────────────────────────────────────────────────────────
  const [results,   setResults]   = useState([]);
  const [score,     setScore]     = useState(0);
  const [correct,   setCorrect]   = useState(0);
  const [wrong,     setWrong]     = useState(0);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const sessionStartRef = useRef(null);
  const [timeTaken,  setTimeTaken]  = useState(0);

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: topic toggle
  const handleTopicToggle = (label) => {
    setSelectedTopics((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const handleConfigChange = (key, val) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Start session
  const handleStart = async (topicsOverride = null) => {
    const topics = topicsOverride || selectedTopics;
    if (!topics.length) return;

    setLoading(true);
    setError('');

    try {
      const user   = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?._id || user?.id;

      const res = await API.post(
        '/aptitude/generate',
        { topics, difficulty: config.difficulty, count: config.count, userId },
      );

      setQuestions(res.data.questions);
      setSessionId(res.data.sessionId);
      setCurrentIdx(0);
      setAnswers([]);
      setAnswered(false);
      setSelected(null);
      setSkipped(false);
      sessionStartRef.current = Date.now();
      setPhase(PHASE.PRACTICE);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Answer a question
  const handleAnswer = (optionKey) => {
    if (answered) return;
    setSelected(optionKey);
    setAnswered(true);
  };

  // Time-up handler: treat as skipped
  const handleTimeUp = () => {
    if (answered) return;
    setAnswered(true);
    setSelected(null);
    setSkipped(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Next question / finish
  const handleNext = async () => {
    const q = questions[currentIdx];
    const newAnswer = { questionId: q.id, selected: selected || null };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    const isLast = currentIdx === questions.length - 1;

    if (isLast) {
      // Submit
      const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
      setTimeTaken(elapsed);

      try {
        const user  = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user?._id || user?.id;

        const res = await API.post(
          '/aptitude/submit',
          { sessionId, answers: newAnswers, timeTaken: elapsed },
        );

        setResults(res.data.results || []);
        setScore(res.data.score);
        setCorrect(res.data.correct);
        setWrong(res.data.wrong);
        setPhase(PHASE.RESULT);
      } catch (err) {
        setError('Failed to submit results: ' + (err.response?.data?.error || err.message));
      }
    } else {
      setCurrentIdx((prev) => prev + 1);
      setAnswered(false);
      setSelected(null);
      setSkipped(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Retry / new session
  const handleRetry    = () => handleStart(selectedTopics);
  const handleNewTopics = () => {
    setPhase(PHASE.SETUP);
    setSelectedTopics([]);
    setQuestions([]);
    setAnswers([]);
    setResults([]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIdx];

  return (
    <div className="relative min-h-screen bg-[#0c0e14] flex text-white overflow-hidden">
      {/* Ambient gradient mesh — same visual language as Dashboard.jsx */}
      <div className="pointer-events-none fixed top-[-8%] right-[8%] w-[42rem] h-[42rem] bg-blue-600/30 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed top-[6%] left-[32%] w-[36rem] h-[36rem] bg-purple-600/25 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[15%] w-[32rem] h-[32rem] bg-indigo-600/15 rounded-full blur-3xl" />
      {/* Extra blob scrolls with the page so topic rows further down still have color to blur against */}
      <div className="pointer-events-none absolute top-[900px] left-[10%] w-[34rem] h-[34rem] bg-fuchsia-600/15 rounded-full blur-3xl" />

      <Sidebar />
      <main className={`relative z-10 flex-1 p-10 transition-all duration-200 ease-in-out ${collapsed ? 'ml-[72px]' : 'ml-72'}`} style={{ paddingBottom: '120px' }}>
      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background:   '#2d0a0a',
              border:       '1px solid #ef4444',
              color:        '#fca5a5',
              padding:      '12px 18px',
              borderRadius: 12,
              marginBottom: 22,
              fontWeight:   600,
              fontSize:     14,
              display:      'flex',
              gap:          10,
              alignItems:   'center',
            }}
          >
            ⚠️ {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 18 }}
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup Phase */}
      {phase === PHASE.SETUP && (
        <TopicSelector
          selectedTopics={selectedTopics}
          onTopicToggle={handleTopicToggle}
          config={config}
          onConfigChange={handleConfigChange}
          onStart={handleStart}
          loading={loading}
        />
      )}

      {/* Practice Phase */}
      {phase === PHASE.PRACTICE && currentQuestion && (
        <div>
          {/* Top nav */}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginBottom:   28,
          }}>
            <button
              onClick={handleNewTopics}
              style={{
                background:   'rgba(255,255,255,0.05)',
                border:       '1px solid rgba(255,255,255,0.08)',
                color:        '#94a3b8',
                padding:      '8px 16px',
                borderRadius: 10,
                cursor:       'pointer',
                fontSize:     13,
                fontWeight:   700,
              }}
            >
              ← Back
            </button>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>
              {currentIdx + 1} / {questions.length} Questions
            </div>
            <div style={{
              background:   '#1e293b',
              padding:      '6px 14px',
              borderRadius: 50,
              color:        '#3b82f6',
              fontWeight:   700,
              fontSize:     13,
            }}>
              {config.difficulty}
            </div>
          </div>

          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIdx + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            answered={answered}
            selectedAnswer={selected}
            timeLimit={config.timeLimit}
            onTimeUp={handleTimeUp}
          />

          {/* Next / Submit button — appears after answering */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  style={{
                    padding:      '14px 48px',
                    background:   currentIdx === questions.length - 1 ? '#22c55e' : '#3b82f6',
                    border:       'none',
                    borderRadius: 16,
                    color:        '#fff',
                    fontWeight:   900,
                    fontSize:     16,
                    cursor:       'pointer',
                    boxShadow:    `0 8px 32px ${currentIdx === questions.length - 1 ? '#22c55e30' : '#3b82f630'}`,
                  }}
                >
                  {currentIdx === questions.length - 1 ? '🏁 Submit & See Results' : 'Next Question →'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Result Phase */}
      {phase === PHASE.RESULT && (
        <ResultScreen
          results={results}
          score={score}
          correct={correct}
          wrong={wrong}
          total={questions.length}
          timeTaken={timeTaken}
          topics={selectedTopics}
          onRetry={handleRetry}
          onNewTopics={handleNewTopics}
        />
      )}
      </main>
    </div>
  );
};

export default AptitudePage;
