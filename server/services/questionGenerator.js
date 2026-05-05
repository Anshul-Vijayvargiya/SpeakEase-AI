import axios from 'axios';

const cleanJsonText = (raw) => {
  let text = raw.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/i, '').replace(/\s*```$/, '');
  }
  return text.trim();
};

const buildCompanyInstructions = (targetCompanies = []) => {
  const normalized = targetCompanies.map((c) => String(c).toLowerCase());
  const lines = [];

  if (normalized.some((c) => c.includes('amazon'))) {
    lines.push('- Include exactly 2 Behavioural questions tied to Amazon Leadership Principles.');
  }

  if (normalized.some((c) => c.includes('google'))) {
    lines.push('- Include at least 1 System Design question with scale and tradeoff focus.');
  }

  if (normalized.some((c) => c.includes('tcs') || c.includes('infosys') || c.includes('wipro'))) {
    lines.push('- Include aptitude-style problem solving and basic CS fundamentals (DBMS/OS/CN/OOP).');
  }

  return lines.length ? lines.join('\n') : '- Keep company targeting balanced and role-relevant.';
};

const buildModeInstructions = (interviewMode) => {
  if (interviewMode === 'technical') {
    return [
      '- GOAL: Generate exactly 10 Technical questions.',
      '- Distribution: DSA (3), DBMS/OS/CN (3), Project Deep-Dive (2), Language/Framework (2).',
      '- Difficulty: Strictly use "Beginner", "Intermediate", or "Advanced" based on candidate experience.',
      '- Questions MUST be strictly based on resume skills, projects, and standard CS fundamentals.'
    ].join('\n');
  }

  if (interviewMode === 'hr') {
    return [
      '- GOAL: Generate exactly 8 HR/Behavioral questions.',
      '- Question 1: MUST ask the candidate to walk you through their resume.',
      '- Questions 2-5: Standard behavioral (Conflict, Leadership, etc.).',
      '- Questions 6-8: Personalized (based on specific projects in resume).',
      '- Difficulty: Use appropriate levels for HR questions.',
      '- Ensure personalized questions reference project names from the resume.'
    ].join('\n');
  }

  return [
    '- Full mode distribution: coding(3) + technical(3) + system design(2) + HR(2).',
    '- Categories: DSA, DBMS, OS, CN, System Design, HR.',
    '- Keep the mix balanced, role-specific, and tied to resume evidence.'
  ].join('\n');
};

const basePrompt = ({ resumeText, targetRole, targetCompanies, experienceLevel, interviewMode, strict }) => `
You are an expert mock interviewer for hiring teams.
Generate interview questions for this candidate.

Candidate context:
- Target role: ${targetRole || 'Not provided'}
- Experience level: ${experienceLevel || 'Not provided'}
- Interview mode: ${interviewMode || 'full'}
- Target companies: ${(targetCompanies || []).join(', ') || 'Not specified'}

Requirements:
${buildCompanyInstructions(targetCompanies)}
${buildModeInstructions(interviewMode)}
- Always reference specific projects, tools, and skills from the resume in "whyAsked".
- Ensure each question has actionable expectedPoints.

Resume text:
${resumeText || 'No resume text provided'}

Return ONLY a valid JSON object with a key "questions" containing an array of questions:
{
  "questions": [
    {
      "id": 1,
      "category": "DSA|System Design|Project Deep-Dive|Behavioural|Language/Framework",
      "difficulty": "Beginner|Intermediate|Advanced",
      "question": "...",
      "whyAsked": "specific reason referencing resume",
      "expectedPoints": ["key point 1", "key point 2", "key point 3"]
    }
  ]
}

Do not include markdown, prose, explanations, or code fences.
${strict ? 'If your output is not valid JSON, regenerate internally and output valid JSON only.' : ''}
`.trim();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const callOpenRouter = async (prompt) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('No OpenRouter/OpenAI API key found in environment');
  }

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt + ' Return output as JSON.' }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'SpeakEase AI'
      },
      timeout: 30000
    }
  );

  return response.data.choices[0].message.content.trim();
};

const parseQuestions = (raw) => {
  const parsed = JSON.parse(cleanJsonText(raw));
  const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
  if (!Array.isArray(questions)) {
    throw new Error('AI output does not contain a questions array');
  }
  return questions;
};

export const generateQuestions = async ({
  resumeText,
  targetRole,
  targetCompanies,
  experienceLevel,
  interviewMode
}) => {
  const prompt = basePrompt({
    resumeText,
    targetRole,
    targetCompanies,
    experienceLevel,
    interviewMode,
    strict: false
  });

  try {
    const raw = await callOpenRouter(prompt);
    return parseQuestions(raw);
  } catch (firstErr) {
    const strictPrompt = basePrompt({
      resumeText,
      targetRole,
      targetCompanies,
      experienceLevel,
      interviewMode,
      strict: true
    });

    const retryRaw = await callOpenRouter(strictPrompt);
    return parseQuestions(retryRaw);
  }
};

export default generateQuestions;
