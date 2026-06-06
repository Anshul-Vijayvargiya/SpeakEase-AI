import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OptionButton from './OptionButton';
import SolutionPanel from './SolutionPanel';

const DIFF_COLOR = {
  Easy:   '#22c55e',
  Medium: '#f59e0b',
  Hard:   '#ef4444',
};

const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  answered,
  selectedAnswer,
  timeLimit, // 0 = no limit
  onTimeUp,
}) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit > 0 ? timeLimit : null);
  const timerRef = useRef(null);
  const showSolution = answered && selectedAnswer !== question.correctAnswer;

  // Reset timer whenever question changes
  useEffect(() => {
    if (timeLimit <= 0) { setTimeLeft(null); return; }
    setTimeLeft(timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // Stop timer on answer
  useEffect(() => {
    if (answered) clearInterval(timerRef.current);
  }, [answered]);

  const pct = timeLeft !== null ? (timeLeft / timeLimit) * 100 : 100;
  const timerColor = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: 820, margin: '0 auto' }}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          {/* Progress chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                style={{
                  width:        12,
                  height:       12,
                  borderRadius: '50%',
                  background:   i < questionNumber ? '#3b82f6' : i === questionNumber - 1 ? '#60a5fa' : '#1e293b',
                  border:       i === questionNumber - 1 ? '2px solid #93c5fd' : '2px solid transparent',
                  transition:   'all 0.2s',
                }}
              />
            ))}
          </div>
          {/* Timer */}
          {timeLeft !== null && (
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        8,
              background: '#0f172a',
              padding:    '6px 14px',
              borderRadius: 50,
              border:     `2px solid ${timerColor}`,
            }}>
              <span style={{ fontSize: 16 }}>⏱</span>
              <span style={{ color: timerColor, fontWeight: 800, fontSize: 16, minWidth: 28, textAlign: 'center' }}>
                {timeLeft}s
              </span>
            </div>
          )}
        </div>

        {/* Question card body */}
        <div style={{
          background:   '#151821',
          border:       '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding:      '28px 32px',
        }}>
          {/* Meta chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: '#1e293b',
              color:      '#94a3b8',
              fontSize:   11,
              fontWeight: 700,
              padding:    '3px 10px',
              borderRadius: 50,
              letterSpacing: '0.05em',
            }}>
              Q{questionNumber} / {totalQuestions}
            </span>
            <span style={{
              background: '#1e293b',
              color:      '#60a5fa',
              fontSize:   11,
              fontWeight: 700,
              padding:    '3px 10px',
              borderRadius: 50,
            }}>
              {question.topic}
            </span>
            <span style={{
              background: `${DIFF_COLOR[question.difficulty]}20`,
              color:      DIFF_COLOR[question.difficulty] || '#94a3b8',
              fontSize:   11,
              fontWeight: 700,
              padding:    '3px 10px',
              borderRadius: 50,
              border:     `1px solid ${DIFF_COLOR[question.difficulty]}40`,
            }}>
              {question.difficulty}
            </span>
          </div>

          {/* Question text */}
          <p style={{
            color:      '#f1f5f9',
            fontSize:   17,
            fontWeight: 600,
            lineHeight: 1.75,
            marginBottom: 26,
          }}>
            {question.question}
          </p>

          {/* Answer options */}
          <div>
            {Object.entries(question.options || {}).map(([key, value]) => (
              <OptionButton
                key={key}
                label={key}
                text={value}
                isSelected={selectedAnswer === key}
                isCorrect={answered && key === question.correctAnswer}
                isWrong={answered && selectedAnswer === key && key !== question.correctAnswer}
                isDisabled={answered}
                onClick={() => onAnswer(key)}
              />
            ))}
          </div>

          {/* Correct confirmation */}
          {answered && selectedAnswer === question.correctAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background:   '#052e16',
                border:       '1px solid #22c55e',
                borderRadius: 12,
                padding:      '12px 18px',
                color:        '#4ade80',
                fontWeight:   700,
                marginTop:    14,
                fontSize:     14,
              }}
            >
              ✅ Correct! Great job!
            </motion.div>
          )}

          {/* Wrong → show solution */}
          {showSolution && <SolutionPanel solution={question.solution} />}
        </div>

        {/* Timer progress bar */}
        {timeLeft !== null && (
          <div style={{ height: 4, background: '#0f172a', borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
            <div style={{
              height:          '100%',
              width:           `${pct}%`,
              background:      timerColor,
              borderRadius:    4,
              transition:      'width 1s linear, background 0.5s',
            }} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default QuestionCard;
