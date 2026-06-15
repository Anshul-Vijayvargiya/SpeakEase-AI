import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import Session from '../models/Session.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { generateQuestions } from '../services/questionGenerator.js';
import { parseResume, uploadResume } from '../controllers/resumeController.js';

import { extractJSON } from '../utils/jsonHelper.js';

const router = express.Router();

// New combined routes
router.post('/upload', verifyToken, uploadResume);
router.post('/parse', verifyToken, parseResume);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/generate-questions', verifyToken, upload.single('resume'), async (req, res) => {
  try {
    const { targetRole, experienceLevel, interviewMode } = req.body;
    const targetCompaniesRaw = req.body.targetCompanies;

    if (!req.file) {
      return res.status(400).json({ message: 'Resume PDF is required' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are supported' });
    }

    let targetCompanies = [];
    if (targetCompaniesRaw) {
      try {
        const parsed = extractJSON(targetCompaniesRaw);
        if (Array.isArray(parsed)) {
          targetCompanies = parsed;
        } else {
          return res.status(400).json({ message: 'targetCompanies must be a JSON array' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'targetCompanies must be a JSON array' });
      }
    }

    const parsedPdf = await pdfParse(req.file.buffer);
    const resumeText = (parsedPdf?.text || '').trim();

    const questions = await generateQuestions({
      resumeText,
      targetRole,
      targetCompanies,
      experienceLevel,
      interviewMode
    });

    const session = await Session.create({
      userId: req.user._id,
      targetRole,
      targetCompanies,
      experienceLevel,
      interviewMode,
      resumeText,
      questions
    });

    return res.status(201).json({
      sessionId: session._id,
      questions
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate interview questions' });
  }
});

export default router;
