import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import StudyPlan from '../models/StudyPlan.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ userId: req.user.id }).sort({ generatedAt: -1 });
    if (!plan) return res.status(404).json({ error: 'No study plan found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch study plan' });
  }
});

router.post('/complete-topic', verifyToken, async (req, res) => {
  try {
    const { planId, topicId } = req.body;
    const plan = await StudyPlan.findOneAndUpdate(
      { _id: planId, userId: req.user.id, "topics._id": topicId },
      { $set: { "topics.$.completed": true } },
      { new: true }
    );
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

export default router;
