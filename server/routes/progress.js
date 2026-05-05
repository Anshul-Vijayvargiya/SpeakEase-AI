import express from 'express';
import Interview from '../models/Interview.js';
import { verifyToken as auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/:userId", auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ 
      userId: req.params.userId, 
      status: 'Completed' 
    }).sort({ createdAt: 1 });

    const chartData = interviews.map((s, i) => {
      return {
        session:          i + 1,
        overall:          s.overallScore || 0,
        technical:        s.technicalScore || 0, 
        hr:               s.hrPerformance || 0,
        confidence:       80, // Default placeholder
        eyeContact:       80,
        date:             new Date(s.createdAt).toLocaleDateString(),
      };
    });

    // Weak areas: check individual question scores
    const weakAreasMap = {};
    interviews.forEach(interview => {
      const allQuestions = [
        ...(interview.codingResults || []),
        ...(interview.technicalResults || []),
        ...(interview.hrResults || [])
      ];

      allQuestions.forEach(q => {
        if (q.metrics) {
          const score = q.metrics.technicalCorrectness || q.metrics.communicationSkills || 0;
          const topic = q.topic || 'General';
          if (score < 60) {
            if (!weakAreasMap[topic]) weakAreasMap[topic] = [];
            weakAreasMap[topic].push(score);
          }
        }
      });
    });

    const weakAreas = Object.entries(weakAreasMap)
      .map(([topic, scores]) => ({
        topic,
        avg: Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        ),
      }))
      .sort((a, b) => a.avg - b.avg);

    res.json({ chartData, weakAreas, totalSessions: interviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
