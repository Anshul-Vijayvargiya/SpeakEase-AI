import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const OPENROUTER_URL    = 'https://openrouter.ai/api/v1/chat/completions';

const cleanJson = (raw) => {
  let text = raw.trim();
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  else if (text.startsWith('```')) text = text.replace(/^```\s*/i, '').replace(/\s*```$/, '');
  return text.trim();
};

const DIFFICULTY_GUIDE = {
  Easy:   'Basic formula application, single-step problems. Very straightforward.',
  Medium: '2-3 step calculation, requires solid concept understanding.',
  Hard:   'Multi-step reasoning, tricky distractors, advanced concept application.',
  Mixed:  'Mix of Easy (40%), Medium (40%), Hard (20%)'
};

const buildPrompt = (topics, difficulty, count) => `
You are an expert aptitude question setter for placement exams at companies like TCS, Infosys, Wipro, Amazon, and Google.

Generate exactly ${count} MCQ aptitude questions.
Topics: ${topics.join(', ')}
Difficulty: ${difficulty} — ${DIFFICULTY_GUIDE[difficulty] || DIFFICULTY_GUIDE.Mixed}

STRICT RULES:
- Every question must have exactly 4 options (A, B, C, D)
- Only ONE correct answer per question
- Wrong options must be realistic (common mistakes, not obviously wrong)
- Solution must be step-by-step, easy to understand
- Use simple English
- For numerical problems: show complete calculation in solution steps
- For logical/verbal: explain the reasoning step by step
- Vary question patterns — do not repeat the same type consecutively
- The "id" field must be a sequential integer starting at 1
- Do not add any extra commentary outside the JSON

Return ONLY a valid JSON array (no wrapping object, no markdown fences, no extra text):
[
  {
    "id": 1,
    "topic": "Speed & Distance",
    "difficulty": "Medium",
    "question": "A train travels 360 km in 4 hours. What is its speed in m/s?",
    "options": {
      "A": "20 m/s",
      "B": "25 m/s",
      "C": "30 m/s",
      "D": "35 m/s"
    },
    "correctAnswer": "B",
    "solution": {
      "steps": [
        "Step 1: Speed = Distance ÷ Time",
        "Step 2: Speed = 360 km ÷ 4 hours = 90 km/h",
        "Step 3: Convert km/h to m/s by multiplying by 5/18",
        "Step 4: 90 × 5/18 = 25 m/s"
      ],
      "finalAnswer": "25 m/s",
      "formula": "Speed = Distance/Time | km/h to m/s: multiply by 5/18",
      "tip": "Always remember: to convert km/h to m/s, multiply by 5/18"
    }
  }
]
`.trim();

const callAI = async (prompt) => {
  if (!OPENROUTER_API_KEY) throw new Error('No OpenRouter/OpenAI API key found in environment');

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an aptitude exam expert. Return ONLY a valid JSON array. No markdown fences, no extra text, no wrapping objects.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    },
    {
      headers: {
        Authorization:  `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title':      'SpeakEase AI - Aptitude Practice',
      },
      timeout: 60000,
    }
  );

  return response.data.choices[0].message.content;
};

const parseQuestions = (raw) => {
  const cleaned = cleanJson(raw);
  const parsed  = JSON.parse(cleaned);
  // Accept bare array or { questions: [...] } wrapper
  const arr = Array.isArray(parsed) ? parsed : (parsed.questions || []);
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('AI returned an empty or malformed questions array');
  }
  // Normalise ids to be sequential integers
  return arr.map((q, i) => ({ ...q, id: i + 1 }));
};

/**
 * Generate MCQ aptitude questions using OpenRouter (GPT-4o-mini).
 * @param {string[]} topics     - List of topic names
 * @param {string}   difficulty - Easy | Medium | Hard | Mixed
 * @param {number}   count      - Number of questions (max 20)
 * @returns {Promise<object[]>}
 */
export const generateAptitudeQuestions = async (topics, difficulty, count) => {
  const safeCount = Math.min(Math.max(count, 1), 20);
  const prompt    = buildPrompt(topics, difficulty, safeCount);

  try {
    const raw = await callAI(prompt);
    return parseQuestions(raw);
  } catch (firstErr) {
    console.error('[AptitudeGen] First attempt failed, retrying…', firstErr.message);
    // Retry once with a tighter prompt
    const retryPrompt = buildPrompt(topics, difficulty, safeCount) +
      '\n\nIMPORTANT: Your last response was invalid JSON. Fix it and return a raw JSON array only.';
    const raw = await callAI(retryPrompt);
    return parseQuestions(raw);
  }
};

export default generateAptitudeQuestions;
