import express from 'express';
import { generateSQLProblem, evaluateSQLAnswer } from '../services/sqlProblemGenerator.js';
import SQLQuestionBank from '../models/SQLQuestionBank.js';
import SQLTestSession from '../models/SQLTestSession.js';

const router = express.Router();

// Mock auth middleware for now, or use the existing one if imported
// Assuming user ID is passed in body for simplicity, but normally from req.user
// Let's rely on standard practice for this app. We'll extract userId from req.body for now.

// Initialize a session
router.post('/start', async (req, res) => {
    try {
        const { userId, topic, difficulty } = req.body;
        
        const session = new SQLTestSession({
            userId,
            topic,
            difficulty,
            problemsAttempted: []
        });
        
        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// Get a problem (fetches from cache or generates new)
router.post('/problem', async (req, res) => {
    try {
        const { topic, difficulty } = req.body;
        
        // Try to find an existing cached problem
        // For production, you might want to ensure they haven't solved it yet
        let problem = await SQLQuestionBank.aggregate([
            { $match: { topic, difficulty } },
            { $sample: { size: 1 } }
        ]);

        if (problem && problem.length > 0) {
            return res.json(problem[0]);
        }

        // Generate new if none found
        const generatedData = await generateSQLProblem(topic, difficulty);
        
        const newProblem = new SQLQuestionBank(generatedData);
        await newProblem.save();
        
        res.json(newProblem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch problem' });
    }
});

// Submit an answer
router.post('/submit', async (req, res) => {
    try {
        const { sessionId, questionId, userQuery, isCorrect, executionError } = req.body;
        
        const problem = await SQLQuestionBank.findById(questionId);
        if (!problem) return res.status(404).json({ error: 'Problem not found' });

        const evaluation = await evaluateSQLAnswer(problem, userQuery, isCorrect, executionError);
        
        const session = await SQLTestSession.findById(sessionId);
        if (session) {
            session.problemsAttempted.push({
                questionId,
                userQuery,
                isCorrect,
                score: evaluation.score,
                feedback: evaluation.feedback
            });
            await session.save();
        }

        res.json(evaluation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to evaluate answer' });
    }
});

// Complete the session
router.post('/complete', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        const session = await SQLTestSession.findById(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        session.status = 'completed';
        session.endTime = Date.now();
        
        let totalScore = 0;
        session.problemsAttempted.forEach(p => {
            totalScore += p.score || 0;
        });
        
        session.finalScore = session.problemsAttempted.length > 0 ? 
            Math.round(totalScore / session.problemsAttempted.length) : 0;

        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to complete session' });
    }
});

export default router;
