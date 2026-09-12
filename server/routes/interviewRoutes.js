import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  generateQuestions,
  generatePracticeQuestions,
  getNextQuestion,
  evaluateAnswer,
  finishInterview,
  getTopicQuestionsHandler,
  getInterviewHistory,
  getInterview,
  deleteInterview,
  evaluatePracticeAnswerHandler,
  getPracticeHintHandler
} from '../controllers/interviewController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import Session from '../models/Session.js';
import Interview from '../models/Interview.js';

const router = express.Router();

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many interview requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const evaluateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Too many evaluation requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔥 ONLY VALID FUNCTIONS USED

// Fetch user's interview history
router.get('/history', verifyToken, getInterviewHistory);

// Bulk delete abandoned sessions — must come before any '/:id' routes below,
// otherwise Express would match "abandoned" as an :id param.
router.delete('/abandoned', verifyToken, async (req, res) => {
  try {
    const result = await Interview.deleteMany({
      userId: req.user._id,
      status: { $in: ['Pending', 'In Progress', 'Expired'] }
    });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete abandoned sessions' });
  }
});

router.post(
  '/generate',
  verifyToken,
  generateLimiter,
  upload.single('resume'),
  generateQuestions
);

router.post(
  '/practice/generate',
  verifyToken,
  generatePracticeQuestions
);

router.post(
  '/practice/evaluate',
  verifyToken,
  evaluatePracticeAnswerHandler
);

router.post(
  '/practice/hint',
  verifyToken,
  getPracticeHintHandler
);

router.get(
  '/:id/next',
  verifyToken,
  getNextQuestion
);

router.post(
  '/evaluate',
  verifyToken,
  evaluateLimiter,
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

import videoUpload from '../middlewares/videoUploadMiddleware.js';

router.post('/:id/video', verifyToken, videoUpload.single('video'), async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (!req.file) return res.status(400).json({ message: 'Video upload failed' });
    
    // Store the relative path, frontend will fetch via /uploads/videos/...
    interview.videoUrl = `/uploads/videos/${req.file.filename}`;
    await interview.save();
    
    res.json({ videoUrl: interview.videoUrl });
  } catch (err) {
    console.error("Video upload error:", err);
    res.status(500).json({ message: 'Server error during video upload' });
  }
});

router.get('/:id/status', verifyToken, async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
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