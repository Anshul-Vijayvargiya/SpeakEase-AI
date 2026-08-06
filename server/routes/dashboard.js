import express from 'express';
import Interview from '../models/Interview.js';
import { verifyToken as auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/:userId", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all completed interviews for this user
    const completedInterviews = await Interview.find({
      userId,
      status: "Completed"
    }).sort({ createdAt: -1 });

    // Calculate stats
    const totalInterviews = completedInterviews.length;

    const scores = completedInterviews.map(i => i.overallScore).filter(score => score !== undefined && score !== null);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const bestScore = scores.length ? Math.max(...scores) : 0;

    // Streak: count consecutive days with at least 1 completed interview
    const streak = calculateStreak(completedInterviews);

    // Recent sessions (last 10)
    const recentSessions = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalInterviews,
      avgScore,
      bestScore,
      currentStreak: streak,
      recentSessions: recentSessions.map(s => {
        return {
          id:        s._id,
          date:      s.createdAt,
          role:      s.role || 'Software Engineer',
          type:      s.interviewType || 'technical',
          score:     s.overallScore ?? null,
          status:    s.status === 'Completed' ? 'completed' : s.status.toLowerCase(),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Streak calculator helper
function calculateStreak(sessions) {
  if (!sessions.length) return 0;

  const dates = [...new Set(
    sessions.map(s => new Date(s.createdAt).toDateString())
  )];

  const today = new Date();
  const todayStr = today.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const d1 = new Date(dates[i-1]);
    const d2 = new Date(dates[i]);
    const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

export default router;
