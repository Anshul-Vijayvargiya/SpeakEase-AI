import mongoose from 'mongoose';

const sqlTestSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  problemsAttempted: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SQLQuestionBank',
    },
    userQuery: String,
    isCorrect: Boolean,
    score: Number,
    feedback: String,
  }],
  finalScore: {
    type: Number,
    default: 0,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress',
  }
});

const SQLTestSession = mongoose.model('SQLTestSession', sqlTestSessionSchema);

export default SQLTestSession;
