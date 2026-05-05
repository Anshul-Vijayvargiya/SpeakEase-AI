import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Session from '../models/Session.js';
import Event from '../models/Event.js';
import Analytics from '../models/Analytics.js';
import { verifyToken as auth, verifyToken } from '../middlewares/authMiddleware.js';
import generateAnalytics from '../services/analyticsGenerator.js';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    resource_type: 'video',
    folder: 'speakease-interviews'
  })
});

const upload = multer({ storage });

router.post('/api/sessions/:id/video', verifyToken, upload.single('video'), async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findOne({ _id: sessionId, userId: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!req.file?.path) {
      return res.status(400).json({ message: 'Video upload failed' });
    }

    const updated = await Session.findByIdAndUpdate(
      sessionId,
      { videoUrl: req.file.path, status: 'processing' },
      { new: true }
    );

    setImmediate(async () => {
      try {
        await generateAnalytics(sessionId);
        await Session.findByIdAndUpdate(sessionId, { status: 'done' });
      } catch (err) {
        // Keep processing status if analytics fails.
      }
    });

    return res.json({ videoUrl: updated.videoUrl });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to upload session video' });
  }
});

router.get('/api/sessions/:id/review', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findOne({ _id: sessionId, userId: req.user._id }).lean();

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const [events, analytics] = await Promise.all([
      Event.find({ sessionId }).sort({ timestampMs: 1 }).lean(),
      Analytics.findOne({ sessionId }).lean()
    ]);

    return res.json({
      session,
      events,
      analytics
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch review data' });
  }
});

router.get('/api/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ recordedAt: -1 })
      .lean();

    const sessionIds = sessions.map((s) => s._id);
    const analytics = await Analytics.find({ sessionId: { $in: sessionIds } })
      .select('sessionId overallScore')
      .lean();

    const analyticsMap = new Map(
      analytics.map((a) => [String(a.sessionId), a.overallScore ?? null])
    );

    const result = sessions.map((s) => ({
      _id: s._id,
      status: s.status,
      targetRole: s.targetRole,
      interviewMode: s.interviewMode,
      recordedAt: s.recordedAt,
      analytics: {
        overallScore: analyticsMap.get(String(s._id)) ?? null
      }
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

// POST client-side events (filler, eye-contact, expression, pause) collected during interview
router.post('/api/sessions/:id/events', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const { events = [], durationMs } = req.body;

    if (durationMs) {
      session.durationMs = durationMs;
      await session.save();
    }

    if (events.length > 0) {
      const docs = events.map(e => ({
        sessionId,
        type: e.type,
        timestampMs: e.timestampMs || 0,
        word: e.word || undefined,
        eyeScore: e.eyeScore !== undefined ? e.eyeScore : undefined,
        pauseDurMs: e.pauseDurMs || undefined,
        endMs: e.endMs || undefined
      }));
      await Event.insertMany(docs, { ordered: false }).catch(() => {});
    }

    return res.json({ saved: events.length });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to save events' });
  }
});

router.get('/api/sessions/history/:userId', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    const reports  = await Analytics.find({ sessionId: { $in: sessions.map(s => s._id) } });

    const merged = sessions.map(s => ({
      ...s.toObject(),
      report: reports.find(r =>
        String(r.sessionId) === String(s._id)
      ) || null,
    }));

    res.json({ sessions: merged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
