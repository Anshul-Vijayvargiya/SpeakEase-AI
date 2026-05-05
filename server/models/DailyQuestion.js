const mongoose = require('mongoose');

const DailyQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    date: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyQuestion', DailyQuestionSchema);
