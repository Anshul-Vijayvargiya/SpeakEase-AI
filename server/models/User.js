import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  college: { type: String },
  yearOfStudy: { type: String },
  preferredLanguage: { type: String, default: 'JavaScript' },
  credits: { type: Number, default: 10 },
  totalInterviews: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  resumeData: { type: Object, default: null },
  targetCompanies: [{ type: String }],
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  stats: {
    readinessScore: { type: Number, default: 0 },
    interviewsTaken: { type: Number, default: 0 },
    practiceHours: { type: Number, default: 0 },
    weakTopic: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

export default User;