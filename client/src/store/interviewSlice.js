import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    activeInterviewId: null,
    currentQuestion: null,
    currentPhase: 'technical',
    currentQuestionIndex: 0,
    status: 'Idle', // 'Idle', 'In Progress', 'Completed'
    evaluationResults: [],
    finalReport: null
};

const interviewSlice = createSlice({
    name: 'interview',
    initialState,
    reducers: {
        setInterviewStart: (state, action) => {
            state.activeInterviewId = action.payload.interviewId;
            state.currentPhase = 'technical';
            state.currentQuestionIndex = 0;
            state.status = 'In Progress';
            state.evaluationResults = [];
            state.finalReport = null;
        },
        setCurrentQuestion: (state, action) => {
            state.currentQuestion = { 
                ...action.payload.question, 
                _id: action.payload.questionId 
            };
            state.currentPhase = action.payload.phase;
            state.currentQuestionIndex = action.payload.index;
        },
        addEvaluation: (state, action) => {
            state.evaluationResults.push(action.payload);
        },
        setInterviewComplete: (state, action) => {
            state.status = 'Completed';
            state.finalReport = action.payload;
        },
        clearInterview: (state) => {
            return initialState;
        }
    }
});

export const {
    setInterviewStart,
    setCurrentQuestion,
    addEvaluation,
    setInterviewComplete,
    clearInterview
} = interviewSlice.actions;

export default interviewSlice.reducer;
