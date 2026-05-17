import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { verifyToken } from '../middlewares/authMiddleware.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

// ─── Call AI with a strict JSON instruction ───────────────────────────────
const callGemini = async (prompt, maxTokens = 2048) => {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'SpeakEase AI'
            },
            timeout: 40000
        });

        const text = response.data.choices[0].message.content.trim();
        console.log(`[AI Service] chars=${text.length}`);
        return text;
    } catch (error) {
        console.error("[AI Service] Error:", error.response?.data || error.message);
        throw error;
    }
};

// ─── Robust JSON extractor ────────────────────────────────────────────────────
const extractJSON = (raw) => {
  // Strip markdown fences
  let text = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  // Direct parse
  try { return JSON.parse(text); } catch (_) {}

  // Find outermost { ... }
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {}
  }

  console.error('[extractJSON] Raw AI response:\n', raw.slice(0, 500));
  throw new Error('Could not parse JSON from AI response');
};

// ─── POST /api/resume-analysis/ats ───────────────────────────────────────────
router.post('/ats', verifyToken, async (req, res) => {
  try {
    const { resumeBase64, fileName, targetRole } = req.body;
    if (!resumeBase64) return res.status(400).json({ message: 'resumeBase64 is required' });

    // Decode + parse PDF
    const buffer = Buffer.from(resumeBase64, 'base64');
    let resumeText = '';
    try {
      const parsed = await pdfParse(buffer);
      resumeText = (parsed?.text || '').replace(/\s+/g, ' ').trim();
    } catch { resumeText = ''; }

    if (resumeText.length < 50) {
      return res.status(422).json({ message: 'Resume text too short to analyze' });
    }

    const snippet = resumeText.slice(0, 15000);

    // Very explicit JSON-only prompt with schema definition
    const prompt = [
      'You are an expert ATS (Applicant Tracking System) resume analyzer.',
      `Analyze the provided resume${targetRole ? ` for the role "${targetRole}"` : ''}.`,
      'Read the resume thoroughly and provide a highly personalized, accurate analysis based solely on the content of the resume.',
      '',
      'Resume:',
      '"""',
      snippet,
      '"""',
      '',
      'OUTPUT RULES:',
      '- Output ONLY a valid JSON object. Do not output anything else.',
      '- Do NOT include any explanation, preamble, or markdown.',
      '- Do NOT wrap in code fences (e.g., no ```json).',
      '- Provide REAL, unique analysis for this specific resume.',
      '',
      'EXPECTED JSON SCHEMA:',
      '{',
      '  "atsScore": <number between 0 and 100 based on overall resume quality and ATS compatibility>,',
      '  "scoreLabel": "<short string label like \'Needs Work\', \'Good\', \'Excellent\'>",',
      '  "scoreBreakdown": {',
      '    "keywords":     { "score": <number 0-10>,  "max": 10 },',
      '    "experience":   { "score": <number 0-20>, "max": 20 },',
      '    "achievements": { "score": <number 0-15>, "max": 15 },',
      '    "format":       { "score": <number 0-15>, "max": 15 },',
      '    "skills":       { "score": <number 0-20>, "max": 20 },',
      '    "education":    { "score": <number 0-10>,  "max": 10 },',
      '    "contact":      { "score": <number 0-10>,  "max": 10 }',
      '  },',
      '  "resumeQuality": { "accessibility": <number 0-100>, "readability": <number 0-100>, "performance": <number 0-100> },',
      '  "improvements": ["<specific actionable tip 1 based on resume>", "<specific actionable tip 2>", "<specific actionable tip 3>"],',
      '  "strengths": ["<specific strength 1 found in resume>", "<specific strength 2 found in resume>"],',
      '  "missingKeywords": ["<missing keyword 1 relevant to target role>", "<missing keyword 2>", "<missing keyword 3>"],',
      '  "candidateName": "<Extracted full name of the candidate, or \'Unknown\' if not found>"',
      '}'
    ].join('\n');

    const raw = await callGemini(prompt, 1800);
    const analysis = extractJSON(raw);

    return res.json({ analysis, resumeText: resumeText.slice(0, 400) });
  } catch (err) {
    console.error('ATS analysis error:', err.message);
    return res.status(500).json({ message: 'Failed to analyze resume', error: err.message });
  }
});

// ─── POST /api/resume-analysis/questions-preview ─────────────────────────────
router.post('/questions-preview', verifyToken, async (req, res) => {
  try {
    const { targetRole, resumeText, experienceLevel } = req.body;
    if (!targetRole) return res.status(400).json({ message: 'targetRole is required' });

    const snippet = (resumeText || '').slice(0, 15000);
    const resumeCtx = snippet
      ? `Resume excerpt:\n"""\n${snippet}\n"""\nGenerate questions 1-4 as "role-specific" and questions 5-6 as "resume-based" (tailored to specific details found in the resume).`
      : 'No resume provided. Generate all 6 questions as "role-specific".';

    const prompt = [
      `You are an expert technical interviewer. Generate exactly 6 highly relevant interview questions for a ${experienceLevel || 'Junior'} level "${targetRole}" candidate.`,
      resumeCtx,
      '',
      'OUTPUT RULES:',
      '- Output ONLY a valid JSON object. Do not output anything else.',
      '- Do NOT include any explanation, preamble, or markdown.',
      '- Do NOT wrap in code fences (e.g., no ```json).',
      '- Ensure the questions are diverse, realistic, and tailored to the candidate\'s experience and the target role.',
      '',
      'EXPECTED JSON SCHEMA:',
      '{',
      '  "questions": [',
      '    { ',
      '      "id": <number, 1 to 6>, ',
      '      "category": "<string, e.g., \'Technical\', \'Behavioral\', \'System Design\', \'Project Deep-Dive\'>",',
      '      "difficulty": "<string, e.g., \'Beginner\', \'Intermediate\', \'Advanced\'>",',
      '      "question": "<string, the actual interview question>",',
      '      "type": "<string, either \'role-specific\' or \'resume-based\'>" ',
      '    },',
      '    // ... 5 more questions matching this structure',
      '  ],',
      '  "roleSummary": "<One sentence summary of what this role involves>",',
      '  "keyTopics": ["<topic1>", "<topic2>", "<topic3>"]',
      '}'
    ].join('\n');

    const raw  = await callGemini(prompt, 1400);
    const data = extractJSON(raw);

    return res.json(data);
  } catch (err) {
    console.error('Questions preview error:', err.message);
    return res.status(500).json({ message: 'Failed to generate question preview' });
  }
});

export default router;
