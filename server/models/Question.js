import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    company: { type: String, default: 'General' },
    role: { type: String, default: 'Software Engineer' },
    round: { type: String, enum: ['Coding', 'Technical', 'HR'], default: 'Technical' },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    question: { type: String, required: true },
    solution: { type: String, default: '' },
    explanation: { type: String, default: '' },
    tags: [{ type: String }]
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
export default Question;
