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
  deleteInterview,
  evaluatePracticeAnswerHandler,
  getPracticeHintHandler
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