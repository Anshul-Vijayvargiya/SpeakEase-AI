const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    status: { type: String, enum: ['Applied', 'Interviewing', 'Offered', 'Rejected'], default: 'Applied' },
    appliedDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
