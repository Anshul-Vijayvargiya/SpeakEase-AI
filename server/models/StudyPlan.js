import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  focusArea: { type: String, required: true },
  topics: [{
    title: { type: String, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'] },
    resourceLink: { type: String },
    completed: { type: Boolean, default: false }
  }],
  generatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('StudyPlan', studyPlanSchema);
