import express from 'express';
import { generateCodingProblem, evaluateCodingProblem, getCodingSession } from '../controllers/codingController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/generate', verifyToken, generateCodingProblem);
router.post('/evaluate', verifyToken, evaluateCodingProblem);
router.get('/:id', verifyToken, getCodingSession);

export default router;
