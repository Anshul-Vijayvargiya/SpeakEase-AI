import express from 'express';
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  startSession,
  analyzeSpeech,
  finishSession
} from '../controllers/analysisController.js';
import Session from '../models/Session.js';

const router = express.Router();

// START NEW SESSION
router.post('/start', verifyToken, startSession);

// CONTINUOUS CHAT TURN
router.post('/chat', verifyToken, analyzeSpeech);

// FINISH SESSION + ANALYSIS
router.post('/finish/:id', verifyToken, finishSession);

// HISTORY
router.get('/history', verifyToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
