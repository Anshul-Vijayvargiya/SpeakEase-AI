import mongoose from 'mongoose';

const CodingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  language: { type: String, required: true },
  difficulty: { type: String, required: true },
  problem: {
    title: { type: String },
    description: { type: String },
    examples: [{ input: String, output: String, explanation: String }],
    constraints: [{ type: String }]
  },
  code: { type: String, default: '' },
  output: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  evaluation: {
    score: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    correctness: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 },
    codeQuality: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CodingSession', CodingSessionSchema);
