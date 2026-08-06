import express from 'express';
import { verifyToken as auth } from '../middlewares/authMiddleware.js';
import { generateAptitudeQuestions } from '../services/aptitudeGenerator.js';
import AptitudeSession from '../models/AptitudeSession.js';
import QuestionBank from '../models/QuestionBank.js';
import User from '../models/User.js';

const router = express.Router();

// ─── POST /api/aptitude/generate ────────────────────────────────────────────
router.post('/generate', auth, async (req, res) => {
  try {
    const { topics, difficulty = 'Mixed', count = 10, userId } = req.body;

    if (!topics?.length) {
      return res.status(400).json({ error: 'Select at least one topic' });
    }

    const requestedCount = Math.min(count, 20);

    // Fetch from QuestionBank — INSTANT, no GPT call needed
    const allQuestions = await QuestionBank.find({
      topic: { $in: topics },
      difficulty: difficulty === "Mixed" 
        ? { $in: ["Easy", "Medium", "Hard"] } 
        : difficulty,
    });

    let questions = [];

    if (allQuestions && allQuestions.length > 0) {
      const pool = allQuestions.flatMap(qb => qb.questions);
      // Ensure we have enough unique questions, otherwise fallback to live generation or just use what we have
      if (pool.length > 0) {
        const shuffled = pool.sort(() => Math.random() - 0.5);
        questions = shuffled.slice(0, requestedCount);
        
        // Re-assign IDs sequentially to match expected format by frontend
        questions = questions.map((q, idx) => ({ ...q, id: idx + 1 }));
      }
    }

    // Fallback to GPT if bank didn't have enough questions (or any at all)
    if (questions.length < requestedCount) {
      console.log(`[Aptitude] Cache miss or insufficient questions. Generating live for topics: ${topics.join(', ')}`);
      questions = await generateAptitudeQuestions(topics, difficulty, requestedCount);
    }

    const uid = req.user?._id || req.user?.id || userId;

    const session = await AptitudeSession.create({
      userId:         uid,
      topics,
      difficulty,
      questions,
      totalQuestions: questions.length,
      status:         'active',
    });

    res.json({ sessionId: session._id, questions, isComplete: true });
  } catch (err) {
    console.error('[Aptitude] Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/aptitude/submit ───────────────────────────────────────────────
router.post('/submit', auth, async (req, res) => {
  try {
    const { sessionId, answers = [], timeTaken = 0 } = req.body;
    const uid = req.user?._id || req.user?.id;

    const session = await AptitudeSession.findOne({ _id: sessionId, userId: uid });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const questions = session.questions;
    let correct = 0;
    let wrong   = 0;

    const results = answers.map((ans) => {
      const question  = questions.find((q) => q.id === ans.questionId);
      if (!question) return null;
      const isCorrect = ans.selected === question.correctAnswer;
      if (isCorrect) correct++;
      else           wrong++;

      return {
        questionId:    ans.questionId,
        question:      question.question,
        topic:         question.topic,
        difficulty:    question.difficulty,
        options:       question.options,
        selected:      ans.selected,
        correctAnswer: question.correctAnswer,
        isCorrect,
        solution:      question.solution,
      };
    }).filter(Boolean);

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    await AptitudeSession.findByIdAndUpdate(sessionId, {
      answers,
      results,
      score,
      correctCount: correct,
      wrongCount:   wrong,
      timeTaken,
      status:       'completed',
      completedAt:  new Date(),
    });

    // Optionally update user aggregate stats
    try {
      await User.findByIdAndUpdate(session.userId, {
        $inc: {
          totalAptitudeAttempts: 1,
          totalAptitudeScore:    score,
        },
      });
    } catch (_) { /* Non-critical — user model may not have these fields yet */ }

    res.json({ score, correct, wrong, total: questions.length, results });
  } catch (err) {
    console.error('[Aptitude] Submit error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/aptitude/history ──────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const uid = req.user?._id || req.user?.id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const sessions = await AptitudeSession.find({
      userId: uid,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(20)
      .select('-questions -answers'); // keep payload small

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/aptitude/history/:userId ──────────────────────────────────────
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const sessions = await AptitudeSession.find({
      userId: req.params.userId,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(20)
      .select('-questions -answers'); // keep payload small

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/aptitude/session/:id ──────────────────────────────────────────
router.get('/session/:id', auth, async (req, res) => {
  try {
    const uid = req.user?._id || req.user?.id;
    const session = await AptitudeSession.findOne({
      _id: req.params.id,
      userId: uid
    });

    if (!session) return res.status(404).json({ error: 'Aptitude session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/aptitude/:id ──────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const uid = req.user?._id || req.user?.id;
    const session = await AptitudeSession.findOneAndDelete({
      _id: req.params.id,
      userId: uid
    });

    if (!session) {
      return res.status(404).json({ error: 'Aptitude session not found' });
    }

    res.status(200).json({ message: 'Aptitude session deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete Aptitude Error:', err);
    res.status(500).json({ error: 'Failed to delete aptitude session' });
  }
});

export default router;
