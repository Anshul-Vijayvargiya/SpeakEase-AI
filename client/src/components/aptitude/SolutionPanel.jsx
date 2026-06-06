import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SolutionPanel = ({ solution }) => {
  if (!solution) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background:    '#0b1f0b',
          border:        '1px solid #22c55e',
          borderRadius:  16,
          padding:       '20px 22px',
          marginTop:     18,
        }}
      >
        <h4 style={{ color: '#22c55e', marginBottom: 14, fontWeight: 800, fontSize: 15 }}>
          💡 Step-by-Step Solution
        </h4>

        {solution.formula && (
          <div style={{
            background:    '#132213',
            padding:       '8px 14px',
            borderRadius:  10,
            marginBottom:  14,
            color:         '#86efac',
            fontSize:      13,
            fontWeight:    600,
          }}>
            📐 Formula: {solution.formula}
          </div>
        )}

        <ol style={{ paddingLeft: 20, color: '#d1fae5', margin: 0 }}>
          {(solution.steps || []).map((step, i) => (
            <li key={i} style={{ marginBottom: 9, lineHeight: 1.65, fontSize: 14 }}>
              {step}
            </li>
          ))}
        </ol>

        {solution.finalAnswer && (
          <div style={{
            background:    '#14532d',
            borderRadius:  10,
            padding:       '10px 16px',
            marginTop:     14,
            fontWeight:    800,
            color:         '#4ade80',
            fontSize:      14,
          }}>
            ✅ Final Answer: {solution.finalAnswer}
          </div>
        )}

        {solution.tip && (
          <div style={{ marginTop: 12, color: '#fbbf24', fontSize: 13 }}>
            ⭐ Tip: {solution.tip}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SolutionPanel;
