import mongoose from 'mongoose';

const QuestionBankSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    required: true,
    index: true
  },
  questions: [mongoose.Schema.Types.Mixed],
  usageCount: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const QuestionBank = mongoose.model('QuestionBank', QuestionBankSchema);

export default QuestionBank;
