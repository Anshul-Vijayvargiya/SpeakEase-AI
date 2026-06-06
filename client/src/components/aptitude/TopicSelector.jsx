import React from 'react';
import { motion } from 'framer-motion';

const TOPICS = {
  'Quantitative Aptitude': [
    { id: 'number-system',   label: 'Number System',               icon: '🔢', difficulty: 'Easy'   },
    { id: 'profit-loss',     label: 'Profit & Loss',               icon: '➕', difficulty: 'Medium' },
    { id: 'time-work',       label: 'Time & Work',                 icon: '⏱',  difficulty: 'Medium' },
    { id: 'speed-distance',  label: 'Speed & Distance',            icon: '🚂', difficulty: 'Medium' },
    { id: 'percentage',      label: 'Percentage',                  icon: '📐', difficulty: 'Easy'   },
    { id: 'ratio',           label: 'Ratio & Proportion',          icon: '🔣', difficulty: 'Easy'   },
    { id: 'average',         label: 'Average',                     icon: '📊', difficulty: 'Easy'   },
    { id: 'interest',        label: 'Simple & Compound Interest',  icon: '💰', difficulty: 'Medium' },
    { id: 'permutation',     label: 'Permutation & Combination',   icon: '🔁', difficulty: 'Hard'   },
    { id: 'probability',     label: 'Probability',                 icon: '📈', difficulty: 'Hard'   },
  ],
  'Logical Reasoning': [
    { id: 'series',          label: 'Series Completion',           icon: '🧩', difficulty: 'Easy'   },
    { id: 'blood-relations', label: 'Blood Relations',             icon: '🔍', difficulty: 'Medium' },
    { id: 'direction',       label: 'Direction Sense',             icon: '🗺', difficulty: 'Easy'   },
    { id: 'coding-decoding', label: 'Coding-Decoding',             icon: '🔒', difficulty: 'Medium' },
    { id: 'syllogism',       label: 'Syllogism',                   icon: '⚖', difficulty: 'Medium' },
    { id: 'calendar',        label: 'Calendar & Clocks',           icon: '📅', difficulty: 'Medium' },
    { id: 'puzzles',         label: 'Puzzles',                     icon: '🧠', difficulty: 'Hard'   },
    { id: 'analogies',       label: 'Analogies',                   icon: '🔗', difficulty: 'Easy'   },
  ],
  'Verbal Ability': [
    { id: 'synonyms',        label: 'Synonyms & Antonyms',         icon: '📝', difficulty: 'Easy'   },
    { id: 'fill-blanks',     label: 'Fill in the Blanks',          icon: '✍',  difficulty: 'Easy'   },
    { id: 'comprehension',   label: 'Reading Comprehension',       icon: '📖', difficulty: 'Hard'   },
    { id: 'sentence',        label: 'Sentence Correction',         icon: '🔤', difficulty: 'Medium' },
    { id: 'idioms',          label: 'Idioms & Phrases',            icon: '💬', difficulty: 'Medium' },
  ],
  'Technical Aptitude': [
    { id: 'ds-mcq',          label: 'Data Structures (MCQ)',       icon: '💻', difficulty: 'Medium' },
    { id: 'db-mcq',          label: 'Database (MCQ)',              icon: '🗄',  difficulty: 'Medium' },
    { id: 'networking',      label: 'Networking Basics (MCQ)',     icon: '🌐', difficulty: 'Easy'   },
    { id: 'os-mcq',          label: 'OS Concepts (MCQ)',           icon: '⚙',  difficulty: 'Medium' },
    { id: 'algo-complexity', label: 'Algorithm Complexity (MCQ)',  icon: '🧮', difficulty: 'Hard'   },
  ],
};

const DIFF_COLOR = {
  Easy:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-400   bg-amber-500/10   border-amber-500/20',
  Hard:   'text-red-400     bg-red-500/10     border-red-500/20',
};

const TopicSelector = ({ selectedTopics, onTopicToggle, config, onConfigChange, onStart, loading }) => {
  const totalSelected = selectedTopics.length;

  return (
    <div className="space-y-10">
      {/* Section header */}
      <div>
        <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
          🧠 Aptitude Practice
        </h1>
        <p className="text-slate-400">
          Select topics, configure your session, and start practising for placements.
        </p>
      </div>

      {/* Settings row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Questions count */}
        <div className="bg-[#151821] rounded-2xl p-5 border border-white/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Questions</p>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => onConfigChange('count', n)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  config.count === n
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-[#151821] rounded-2xl p-5 border border-white/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Difficulty</p>
          <div className="flex gap-2 flex-wrap">
            {['Easy', 'Medium', 'Hard', 'Mixed'].map((d) => (
              <button
                key={d}
                onClick={() => onConfigChange('difficulty', d)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  config.difficulty === d
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Time per question */}
        <div className="bg-[#151821] rounded-2xl p-5 border border-white/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Time / Question</p>
          <div className="flex gap-2">
            {[{ label: '30s', val: 30 }, { label: '60s', val: 60 }, { label: '90s', val: 90 }, { label: '∞', val: 0 }].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => onConfigChange('timeLimit', val)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  config.timeLimit === val
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Groups */}
      {Object.entries(TOPICS).map(([category, topics]) => (
        <div key={category}>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">{category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {topics.map((topic) => {
              const isSelected = selectedTopics.includes(topic.label);
              return (
                <motion.button
                  key={topic.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onTopicToggle(topic.label)}
                  className={`relative p-4 rounded-2xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500/60 shadow-lg shadow-blue-600/10'
                      : 'bg-[#151821] border-white/5 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 text-blue-400 text-sm">✓</span>
                  )}
                  <span className="text-2xl mb-2 block">{topic.icon}</span>
                  <p className={`text-xs font-black mb-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {topic.label}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{config.count} Qs</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${DIFF_COLOR[topic.difficulty]}`}>
                      {topic.difficulty}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Start button — fixed bottom bar */}
      <div style={{
        position:       'fixed',
        bottom:         0,
        left:           0,
        right:          0,
        zIndex:         50,
        background:     'linear-gradient(to top, #0d1117 60%, transparent)',
        padding:        '16px 28px 24px',
        display:        'flex',
        justifyContent: 'center',
      }}>
        <motion.button
          id="start-practice-btn"
          whileHover={totalSelected > 0 ? { scale: 1.03 } : {}}
          whileTap={totalSelected > 0 ? { scale: 0.97 } : {}}
          onClick={() => {
            console.log('[Aptitude] Start clicked, topics:', selectedTopics);
            onStart();
          }}
          disabled={totalSelected === 0 || loading}
          style={{
            padding:        '14px 40px',
            background:     totalSelected > 0 ? '#2563eb' : 'rgba(255,255,255,0.05)',
            border:         'none',
            borderRadius:   16,
            color:          totalSelected > 0 ? '#fff' : '#64748b',
            fontWeight:     900,
            fontSize:       16,
            cursor:         totalSelected > 0 ? 'pointer' : 'not-allowed',
            boxShadow:      totalSelected > 0 ? '0 8px 32px rgba(37,99,235,0.4)' : 'none',
            display:        'flex',
            alignItems:     'center',
            gap:            12,
            minWidth:       220,
            justifyContent: 'center',
            transition:     'all 0.2s',
          }}
        >
          {loading ? (
            <>
              <span style={{
                width:        18,
                height:       18,
                border:       '2px solid rgba(255,255,255,0.3)',
                borderTop:    '2px solid #fff',
                borderRadius: '50%',
                display:      'inline-block',
                animation:    'spin 0.8s linear infinite',
              }} />
              Generating Questions…
            </>
          ) : (
            <>
              🚀 Start Practice
              {totalSelected > 0 && (
                <span style={{
                  background:   'rgba(255,255,255,0.2)',
                  padding:      '2px 10px',
                  borderRadius: 20,
                  fontSize:     13,
                  fontWeight:   700,
                }}>
                  {totalSelected} topic{totalSelected > 1 ? 's' : ''}
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default TopicSelector;
