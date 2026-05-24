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

// ─── In-memory score history (keyed by userId) ─────────────────────────────
// In production you'd persist this in MongoDB
const scoreHistory = {};

// ─── Call AI with a strict JSON instruction ───────────────────────────────
const callGemini = async (prompt, maxTokens = 4000) => {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert ATS resume analyzer and career counselor specializing in helping engineering students get placed at top tech companies. Always return valid JSON only. Do not include markdown fences or any text outside the JSON.'
                },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'SpeakEase AI'
            },
            timeout: 60000
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
  let text = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try { return JSON.parse(text); } catch (_) {}

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
    const { resumeBase64, fileName, targetRole, jobDescription } = req.body;
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

    const snippet = resumeText.slice(0, 12000);
    const role = targetRole || 'General Software Engineer';

    const prompt = `
Perform a comprehensive resume analysis and return ONLY a single valid JSON object.

Target Role: ${role}
Job Description: ${jobDescription || 'Not provided'}

Resume Text:
"""
${snippet}
"""

Return this exact JSON structure with all fields populated with real analysis:
{
  "atsScore": <number 0-100 overall ATS compatibility>,
  "atsGrade": "<Excellent|Good|Average|Poor>",
  "scoreLabel": "<short label like 'Needs Work', 'Good', 'Excellent'>",
  "candidateName": "<full name or 'Unknown'>",
  "scoreBreakdown": {
    "keywords":     { "score": <0-10>,  "max": 10,  "feedback": "<specific feedback>" },
    "experience":   { "score": <0-20>, "max": 20,  "feedback": "<specific feedback>" },
    "achievements": { "score": <0-15>, "max": 15,  "feedback": "<specific feedback>" },
    "format":       { "score": <0-15>, "max": 15,  "feedback": "<specific feedback>" },
    "skills":       { "score": <0-20>, "max": 20,  "feedback": "<specific feedback>" },
    "education":    { "score": <0-10>,  "max": 10,  "feedback": "<specific feedback>" },
    "contact":      { "score": <0-10>,  "max": 10,  "feedback": "<specific feedback>" }
  },
  "resumeQuality": {
    "accessibility": <0-100>,
    "readability": <0-100>,
    "performance": <0-100>
  },
  "strengths": ["<strength 1 from resume>", "<strength 2>", "<strength 3>"],
  "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "improvements": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>", "<tip 5>"],
  "jobMatch": {
    "matchScore": <0-100>,
    "matchedSkills": ["<skill1>", "<skill2>"],
    "missingSkills": ["<skill1>", "<skill2>", "<skill3>"],
    "matchedKeywords": ["<kw1>", "<kw2>"],
    "missingKeywords": ["<kw1>", "<kw2>"],
    "recommendation": "<2-3 sentence recommendation with specific actions>"
  },
  "sectionFeedback": {
    "objective": {
      "exists": <true|false>,
      "score": <0-10>,
      "isGeneric": <true|false>,
      "charCount": <number>,
      "current": "<exact text of objective if found, else empty string>",
      "feedback": "<specific feedback>",
      "rewrite": "<AI rewritten version tailored to target role>"
    },
    "skills": {
      "score": <0-10>,
      "totalCount": <number>,
      "feedback": "<specific feedback>",
      "categories": {
        "frontend": ["<skill1>"],
        "backend": ["<skill1>"],
        "database": ["<skill1>"],
        "tools": ["<skill1>"],
        "softSkills": ["<skill1>"]
      },
      "toAdd": ["<missing high-demand skill 1>", "<skill 2>", "<skill 3>"],
      "toRemove": ["<overused/generic skill>"]
    },
    "projects": [
      {
        "name": "<project name>",
        "score": <0-10>,
        "hasDescription": <true|false>,
        "hasTechStack": <true|false>,
        "hasImpact": <true|false>,
        "hasGithubLink": <true|false>,
        "issues": ["<issue 1>", "<issue 2>"],
        "improved": "<AI rewritten project description with impact, tech stack, and metrics>"
      }
    ],
    "experience": {
      "score": <0-10>,
      "hasInternship": <true|false>,
      "usesActionVerbs": <true|false>,
      "hasQuantifiedAchievements": <true|false>,
      "feedback": "<specific feedback>",
      "suggestions": ["<rewrite suggestion 1>", "<suggestion 2>"]
    },
    "education": {
      "score": <0-10>,
      "hasCgpa": <true|false>,
      "hasRelevantCoursework": <true|false>,
      "hasCertifications": <true|false>,
      "degree": "<detected degree>",
      "institution": "<detected institution>",
      "feedback": "<specific feedback>"
    }
  },
  "studentInsights": {
    "fresherReadiness": "<Placement Ready|Almost Ready|Needs Work|Not Ready>",
    "readinessScore": <0-100>,
    "percentileRank": "<Top X% of fresher resumes>",
    "placementProbability": {
      "serviceBased": "<X%>",
      "serviceBased_tips": ["<what to improve>"],
      "midTierProduct": "<X%>",
      "midTierProduct_tips": ["<what to improve>"],
      "topProduct": "<X%>",
      "topProduct_tips": ["<what to improve>"]
    },
    "hasGithub": <true|false>,
    "hasLinkedin": <true|false>,
    "hasPortfolio": <true|false>,
    "githubBoost": "+8 ATS points",
    "linkedinBoost": "+5 ATS points",
    "portfolioBoost": "+7 ATS points"
  },
  "quickWins": {
    "easy": [
      { "fix": "<easy fix 1>", "atsBoost": "+X points" },
      { "fix": "<easy fix 2>", "atsBoost": "+X points" },
      { "fix": "<easy fix 3>", "atsBoost": "+X points" }
    ],
    "medium": [
      { "fix": "<medium fix 1>", "atsBoost": "+X points" },
      { "fix": "<medium fix 2>", "atsBoost": "+X points" },
      { "fix": "<medium fix 3>", "atsBoost": "+X points" }
    ],
    "critical": [
      { "fix": "<critical fix 1>", "atsBoost": "+X points" },
      { "fix": "<critical fix 2>", "atsBoost": "+X points" }
    ]
  },
  "certificationSuggestions": [
    {
      "name": "<cert name>",
      "platform": "<Coursera|Udemy|Google|AWS|Meta>",
      "duration": "<e.g., 6 weeks>",
      "cost": "<Free|Paid ~$XX>",
      "impact": "<why this cert helps for target role>"
    }
  ],
  "lineFeedback": [
    {
      "section": "<OBJECTIVE|SKILLS|PROJECTS|EXPERIENCE|EDUCATION>",
      "status": "<warning|good|error>",
      "original": "<original text snippet from resume>",
      "comment": "<inline comment>",
      "suggestion": "<specific rewrite or addition>"
    }
  ],
  "predictedInterviewQuestions": {
    "fromProjects": ["<specific question about a project found in resume>", "<question 2>", "<question 3>"],
    "fromSkills": ["<technical question based on a skill in resume>", "<question 2>", "<question 3>"],
    "fromEducation": ["<general question>", "<question 2>"]
  }
}

Rules:
- Be SPECIFIC to this resume — use actual project names, skills, company names found in the text
- All arrays must have at least 2-3 items
- All strings must be non-empty
- lineFeedback must have 4-6 entries covering key sections
- projects array in sectionFeedback must reflect actual projects found (if any)
`;

    const raw = await callGemini(prompt, 4000);
    const analysis = extractJSON(raw);

    // ─── Track score history ────────────────────────────────────────────────
    const userId = req.user?._id?.toString() || 'anonymous';
    if (!scoreHistory[userId]) scoreHistory[userId] = [];
    const historyEntry = {
      score: analysis.atsScore,
      date: new Date().toISOString(),
      label: `Upload ${scoreHistory[userId].length + 1}`,
      improvements: analysis.improvements?.slice(0, 2) || []
    };
    scoreHistory[userId].push(historyEntry);
    // keep last 10 uploads
    if (scoreHistory[userId].length > 10) scoreHistory[userId].shift();

    analysis.scoreHistory = scoreHistory[userId];

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

// ─── GET /api/resume-analysis/score-history ──────────────────────────────────
router.get('/score-history', verifyToken, async (req, res) => {
  const userId = req.user?._id?.toString() || 'anonymous';
  return res.json({ history: scoreHistory[userId] || [] });
});

export default router;
