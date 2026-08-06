import { create } from 'zustand';

const useSessionStore = create((set, get) => ({
  // Session Config
  interviewType: null,   // "technical" | "hr" | "full-simulation"
  role: null,            // Selected role object
  experienceLevel: 'Junior',
  difficulty: 'Medium',
  
  // Session State
  sessionId: null,
  status: 'idle',        // 'idle', 'preparing', 'active', 'finished'
  currentRound: 'technical', // 'technical', 'hr', 'coding'
  
  // Data
  resumeData: null,
  resumeAnalysis: null,
  skipResume: false,
  questions: [],         // All questions fetched once on mount
  currentIndex: 0,
  
  // Real-time Metrics
  eyeContactPercent: 0,
  fillerCount: 0,
  wpm: 0,
  expression: 'Focused',

  // Actions
  setInterviewType: (type) => set({ interviewType: type, currentRound: type === 'hr' ? 'hr' : 'technical' }),
  setRole: (role) => set({ role }),
  setExperienceLevel: (level) => set({ experienceLevel: level }),
  setDifficulty: (diff) => set({ difficulty: diff }),
  setSessionId: (id) => set({ sessionId: id }),
  setResumeData: (data) => set({ resumeData: data }),
  setResumeAnalysis: (analysis) => set({ resumeAnalysis: analysis }),
  setSkipResume: (skip) => set({ skipResume: skip, resumeData: skip ? null : get().resumeData }),
  setQuestions: (questions, initialIndex = 0) => set({ questions, currentIndex: initialIndex, status: 'active' }),
  
  updateMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),

  nextQuestion: () => {
    const { questions, currentIndex } = get();
    
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextQ = questions[nextIdx];
      const nextRound = nextQ?.type || get().currentRound;
      set({ currentIndex: nextIdx, currentRound: nextRound });
    } else {
      set({ status: 'finished' });
    }
  },

  reset: () => set({
    interviewType: null,
    role: null,
    experienceLevel: 'Junior',
    difficulty: 'Medium',
    sessionId: null,
    status: 'idle',
    currentRound: 'technical',
    resumeData: null,
    resumeAnalysis: null,
    skipResume: false,
    questions: [],
    currentIndex: 0,
    eyeContactPercent: 0,
    fillerCount: 0,
    wpm: 0,
    expression: 'Focused',
  }),
}));

export default useSessionStore;
