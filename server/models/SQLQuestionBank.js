import mongoose from 'mongoose';

const sqlQuestionBankSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    enum: ['Basic', 'Joins', 'Aggregations', 'Subqueries', 'Window Functions', 'Data Modification'],
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
  },
  problemStatement: {
    type: String,
    required: true,
  },
  expectedSchema: {
    type: String, // DDL statements to create tables
    required: true,
  },
  initialData: {
    type: String, // DML statements to insert data
    required: true,
  },
  expectedQuery: {
    type: String, // The correct answer query
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SQLQuestionBank = mongoose.model('SQLQuestionBank', sqlQuestionBankSchema);

export default SQLQuestionBank;
