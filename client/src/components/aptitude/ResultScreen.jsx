import React from 'react';
import { motion } from 'framer-motion';
import QuestionReview from './QuestionReview';

const getGrade = (pct) => {
  if (pct >= 90) return { label: 'Excellent!',    color: '#22c55e', emoji: '🏆', stars: 5 };
  if (pct >= 75) return { label: 'Good Job!',     color: '#3b82f6', emoji: '🎉', stars: 4 };
  if (pct >= 60) return { label: 'Passed!',       color: '#f59e0b', emoji: '✅', stars: 3 };
  if (pct >= 40) return { label: 'Keep Trying!',  color: '#f97316', emoji: '💪', stars: 2 };
  return              { label: 'Needs Work!',     color: '#ef4444', emoji: '📚', stars: 1 };
};

const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const ResultScreen = ({ results, score, correct, wrong, total, timeTaken, topics, onRetry, onNewTopics }) => {
  const grade = getGrade(score);
  const avgTimePerQ = total > 0 ? Math.round(timeTaken / total) : 0;

  const statCards = [
    { label: 'Score',        value: `${score}%`,            icon: '📊', color: grade.color     },
    { label: 'Correct',      value: `${correct}/${total}`,  icon: '✅', color: '#22c55e'        },
    { label: 'Wrong',        value: `${wrong}/${total}`,    icon: '❌', color: '#ef4444'        },
    { label: 'Time Taken',   value: formatTime(timeTaken),  icon: '⏱',  color: '#3b82f6'        },
    { label: 'Avg / Question', value: `${avgTimePerQ}s`,   icon: '⚡', color: '#f59e0b'        },
    { label: 'Accuracy',     value: `${score}%`,            icon: '🎯', color: grade.color     },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 4px' }}>
      {/* Hero result */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          background:    `linear-gradient(135deg, ${grade.color}18 0%, #0f172a 100%)`,
          border:        `2px solid ${grade.color}50`,
          borderRadius:  24,
          padding:       '44px 40px',
          textAlign:     'center',
          marginBottom:  28,
          position:      'relative',
          overflow:      'hidden',
        }}
      >
        {/* Stars */}
        <div style={{ fontSize: 30, marginBottom: 10, letterSpacing: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
              style={{ opacity: i < grade.stars ? 1 : 0.2 }}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <div style={{ fontSize: 72, marginBottom: 6 }}>{grade.emoji}</div>

        <h2 style={{
          fontSize:   40,
          fontWeight: 900,
          color:      grade.color,
          marginBottom: 6,
        }}>
          {score}%
        </h2>
        <p style={{ color: grade.color, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {grade.label}
        </p>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Topics: {topics?.join(', ')}
        </p>
      </motion.div>

      {/* Stat cards */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 14,
        marginBottom:        28,
      }}>
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            style={{
              background:   '#151821',
              border:       '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding:      '18px 16px',
              textAlign:    'center',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ color: s.color, fontWeight: 900, fontSize: 22, marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Topic-wise breakdown */}
      {(() => {
        const byTopic = {};
        (results || []).forEach((r) => {
          if (!byTopic[r.topic]) byTopic[r.topic] = { correct: 0, total: 0 };
          byTopic[r.topic].total++;
          if (r.isCorrect) byTopic[r.topic].correct++;
        });
        const entries = Object.entries(byTopic);
        if (!entries.length) return null;
        return (
          <div style={{
            background:   '#151821',
            border:       '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20,
            padding:      '24px',
            marginBottom: 28,
          }}>
            <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
              📊 Topic-wise Performance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entries.map(([topic, stat]) => {
                const pct = Math.round((stat.correct / stat.total) * 100);
                const bar = pct >= 60 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={topic}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>{topic}</span>
                      <span style={{ color: bar, fontSize: 13, fontWeight: 800 }}>
                        {stat.correct}/{stat.total} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#0f172a', borderRadius: 50 }}>
                      <div style={{
                        height:     '100%',
                        width:      `${pct}%`,
                        background: bar,
                        borderRadius: 50,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          style={{
            flex:         1,
            padding:      '14px 0',
            background:   '#3b82f6',
            border:       'none',
            borderRadius: 14,
            color:        '#fff',
            fontWeight:   800,
            fontSize:     15,
            cursor:       'pointer',
          }}
        >
          🔄 Retry Same Topics
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewTopics}
          style={{
            flex:         1,
            padding:      '14px 0',
            background:   '#1e293b',
            border:       '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            color:        '#94a3b8',
            fontWeight:   800,
            fontSize:     15,
            cursor:       'pointer',
          }}
        >
          🧩 Choose New Topics
        </motion.button>
      </div>

      {/* Question review */}
      <QuestionReview results={results} />
    </div>
  );
};

export default ResultScreen;
