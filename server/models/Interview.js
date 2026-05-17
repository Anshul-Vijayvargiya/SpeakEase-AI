import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    type: { type: String, enum: ['technical', 'hr', 'coding'], default: 'technical' },
    topic: { type: String, default: '' },
    resumeContext: { type: String, default: '' },
    hint: { type: String, default: '' },
    userAnswer: { type: String, default: '' },
    metrics: {
        // Shared metrics
        confidence: { type: Number, min: 0, max: 100, default: null },
        feedback: { type: String, default: '' },

        // Technical specific metrics
        technicalCorrectness: { type: Number, min: 0, max: 100, default: null },
        problemSolving: { type: Number, min: 0, max: 100, default: null },
        technicalDepth: { type: Number, min: 0, max: 100, default: null },

        // HR specific metrics
        communicationSkills: { type: Number, min: 0, max: 100, default: null },
        clarity: { type: Number, min: 0, max: 100, default: null },
        professionalTone: { type: Number, min: 0, max: 100, default: null },
        emotionalIntelligence: { type: Number, min: 0, max: 100, default: null },
        
        // Behavioral metrics
        eyeContactScore: { type: Number, min: 0, max: 100, default: null },
        attentionScore: { type: Number, min: 0, max: 100, default: null },
        smileScore: { type: Number, min: 0, max: 100, default: null },
        nervousnessScore: { type: Number, min: 0, max: 100, default: null },
        behaviorSummary: { type: String, default: '' }
    }
});

const InterviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    company: { type: String, default: '' },
    topic: { type: String, default: '' },
    resumeText: { type: String, default: '' },
    interviewType: { type: String, enum: ['technical', 'hr', 'full-simulation', 'practice'], required: true, default: 'technical' },
    mode: { type: String, enum: ['standard', 'technical-only'], default: 'standard' },
    interviewPhase: { type: String, enum: ['coding', 'technical', 'hr', 'completed'], default: 'technical' },
    currentQuestionIndex: { type: Number, default: 0 },
    totalQuestionsAsked: { type: Number, default: 0 },
    codingResults: [QuestionSchema],
    technicalResults: [QuestionSchema],
    hrResults: [QuestionSchema],
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    codingScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    hrPerformance: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    finalFeedback: { type: String, default: '' },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    videoUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const Interview = mongoose.model('Interview', InterviewSchema);
export default Interview;
