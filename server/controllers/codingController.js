import { GoogleGenerativeAI } from '@google/generative-ai';
import CodingSession from '../models/CodingSession.js';

export const generateCodingProblem = async (req, res) => {
  try {
    const { topic, difficulty, language } = req.body;
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert technical interviewer. Generate a high-quality coding problem for a candidate.
      Topic: ${topic}
      Difficulty: ${difficulty}
      Language: ${language}

      Return the response as a JSON object with the following structure exactly (no markdown formatting, no comments, just raw JSON):
      {
        "title": "Problem Title",
        "description": "Detailed problem description and requirements...",
        "examples": [
          { "input": "...", "output": "...", "explanation": "..." }
        ],
        "constraints": [
          "Constraint 1", "Constraint 2"
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const problemData = JSON.parse(text);

    const session = new CodingSession({
      userId: req.user._id,
      topic,
      difficulty,
      language,
      problem: problemData
    });

    await session.save();

    res.status(201).json({ sessionId: session._id, problem: problemData });
  } catch (error) {
    console.error('Error generating coding problem:', error);
    res.status(500).json({ error: 'Failed to generate coding problem' });
  }
};

export const evaluateCodingProblem = async (req, res) => {
  try {
    const { sessionId, code, output } = req.body;

    const session = await CodingSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert technical interviewer evaluating a candidate's code submission.
      
      Problem:
      Title: ${session.problem.title}
      Description: ${session.problem.description}
      
      Candidate's Code (${session.language}):
      ${code}
      
      Execution Output:
      ${output}

      Evaluate the code and return a JSON object with this exact structure (no markdown formatting, just raw JSON):
      {
        "score": <number 0-100>,
        "feedback": "<detailed feedback string>",
        "correctness": <number 0-100>,
        "efficiency": <number 0-100>,
        "codeQuality": <number 0-100>
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const evaluationData = JSON.parse(text);

    session.code = code;
    session.output = output;
    session.status = 'Completed';
    session.evaluation = evaluationData;

    await session.save();

    res.status(200).json({ evaluation: evaluationData });
  } catch (error) {
    console.error('Error evaluating coding problem:', error);
    res.status(500).json({ error: 'Failed to evaluate coding problem' });
  }
};

export const getCodingSession = async (req, res) => {
  try {
    const session = await CodingSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.status(200).json(session);
  } catch (error) {
    console.error('Error fetching coding session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};
