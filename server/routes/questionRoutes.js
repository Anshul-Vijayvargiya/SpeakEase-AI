import express from 'express';
import { 
  getAllQuestions, 
  getQuestionsByCompany, 
  getQuestionsByTopic, 
  seedQuestions 
} from '../controllers/questionController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Using verifyToken to ensure only authenticated users can access the questions (optional but recommended)
router.get('/', verifyToken, getAllQuestions);
router.get('/company/:company', verifyToken, getQuestionsByCompany);
router.get('/topic/:topic', verifyToken, getQuestionsByTopic);

// Route for inserting mock data - remove or secure this in production
router.post('/seed', verifyToken, seedQuestions);

export default router;
