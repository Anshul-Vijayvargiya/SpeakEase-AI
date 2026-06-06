import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SolutionPanel from './SolutionPanel';

const QuestionReview = ({ results = [] }) => {
  const [expanded, setExpanded] = useState(null);

  if (results.length === 0) return null;

  return (
    <div>
      <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 18, marginBottom: 18 }}>
        📋 Question Review
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              background:   r.isCorrect ? '#052e16' : '#1c0505',
              border:       `1px solid ${r.isCorrect ? '#22c55e' : '#ef4444'}`,
              borderRadius: 16,
              overflow:     'hidden',
            }}
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{
                width:       '100%',
                padding:     '14px 18px',
                background:  'transparent',
                border:      'none',
                cursor:      'pointer',
                display:     'flex',
                alignItems:  'center',
                gap:         14,
                textAlign:   'left',
              }}
            >
              <span style={{ fontSize: 20 }}>{r.isCorrect ? '✅' : '❌'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>
                  {r.question}
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>{r.topic}</span>
                  {!r.isCorrect && (
                    <>
                      <span style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600 }}>
                        Your: {r.selected || 'Skipped'}
                      </span>
                      <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
                        Correct: {r.correctAnswer}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span style={{ color: r.isCorrect ? '#4ade80' : '#f87171', fontSize: 18, flexShrink: 0 }}>
                {expanded === i ? '▲' : '▼'}
              </span>
            </button>

            {expanded === i && !r.isCorrect && (
              <div style={{ padding: '0 18px 18px' }}>
                {/* All options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {Object.entries(r.options || {}).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        padding:      '8px 12px',
                        borderRadius: 10,
                        fontSize:     12,
                        fontWeight:   700,
                        background:
                          k === r.correctAnswer ? '#052e16'
                          : k === r.selected    ? '#2d0a0a'
                          : '#0f172a',
                        border: `1px solid ${
                          k === r.correctAnswer ? '#22c55e'
                          : k === r.selected    ? '#ef4444'
                          : '#1e293b'
                        }`,
                        color:
                          k === r.correctAnswer ? '#4ade80'
                          : k === r.selected    ? '#fca5a5'
                          : '#64748b',
                      }}
                    >
                      {k}: {v}
                    </div>
                  ))}
                </div>
                <SolutionPanel solution={r.solution} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuestionReview;
