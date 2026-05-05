import mongoose from 'mongoose';

const questionScoreSchema = new mongoose.Schema(
  {
    questionId: Number,
    score: Number,
    verdict: String,
    improvement: String
  },
  { _id: false }
);

const analyticsSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
  fillerCount: Number,
  fillerBreakdown: {
    um: Number,
    uh: Number,
    like: Number,
    basically: Number,
    literally: Number
  },
  eyeContactPct: Number,
  avgPauseSec: Number,
  longPauseCount: Number,
  totalWords: Number,
  wordsPerMin: Number,
  overallScore: Number,
  feedbackReport: String,
  questionScores: [questionScoreSchema],
  generatedAt: { type: Date, default: Date.now }
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
