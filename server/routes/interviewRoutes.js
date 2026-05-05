import express from 'express';
import { 
  generateQuestions, 
  generatePracticeQuestions, 
  getNextQuestion, 
  evaluateAnswer, 
  finishInterview,
  getTopicQuestionsHandler,
  getInterviewHistory,
  getInterview,
  deleteInterview
} from '../controllers/interviewController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import Session from '../models/Session.js';
import Interview from '../models/Interview.js';

const router = express.Router();

// 🔥 ONLY VALID FUNCTIONS USED

// Fetch user's interview history
router.get('/history', verifyToken, getInterviewHistory);

router.post(
  '/generate',
  verifyToken,
  upload.single('resume'),
  generateQuestions
);

router.post(
  '/practice/generate',
  verifyToken,
  generatePracticeQuestions
);

router.get(
  '/:id/next',
  verifyToken,
  getNextQuestion
);

router.post(
  '/evaluate',
  verifyToken,
  evaluateAnswer
);

router.post(
  '/:id/finish',
  verifyToken,
  finishInterview
);

// Get specific interview detail
router.get('/:id', verifyToken, getInterview);

// Delete specific interview
router.delete('/:id', verifyToken, deleteInterview);

router.get('/:id/status', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    res.json({ status: interview?.status || 'idle' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

router.get('/:id/report', verifyToken, getInterview); // Reuse getInterview for report data

// New topic route
router.get(
  '/topic/:topic',
  verifyToken,
  getTopicQuestionsHandler
);

export default router;