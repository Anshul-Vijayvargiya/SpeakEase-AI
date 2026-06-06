import mongoose from 'mongoose';

const { Schema, Types: { ObjectId } } = mongoose;

const AptitudeSessionSchema = new Schema(
  {
    userId:         { type: ObjectId, ref: 'User', required: true },
    topics:         [String],
    difficulty:     { type: String, default: 'Mixed' },
    totalQuestions: { type: Number, default: 0 },
    questions:      [mongoose.Schema.Types.Mixed],
    answers:        [mongoose.Schema.Types.Mixed],
    results:        [mongoose.Schema.Types.Mixed],
    score:          { type: Number, default: 0 },
    correctCount:   { type: Number, default: 0 },
    wrongCount:     { type: Number, default: 0 },
    timeTaken:      { type: Number, default: 0 }, // seconds
    status:         { type: String, enum: ['active', 'completed'], default: 'active' },
    completedAt:    { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('AptitudeSession', AptitudeSessionSchema);
