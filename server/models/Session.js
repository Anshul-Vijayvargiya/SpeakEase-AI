import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    id: Number,
    category: String,
    difficulty: String,
    question: String,
    whyAsked: String,
    expectedPoints: [String],
    transcript: String,
    answerScore: Number,
    improvement: String
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetRole: String,
  targetCompanies: [String],
  experienceLevel: String,
  interviewMode: { type: String, enum: ['technical', 'hr', 'full'] },
  resumeText: String,
  questions: [questionSchema],
  currentQuestionIdx: { type: Number, default: 0 },
  videoUrl: String,
  durationMs: Number,
  status: { type: String, enum: ['ready', 'recording', 'processing', 'done'], default: 'ready' },
  recordedAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;