import axios from 'axios';
import Event from '../models/Event.js';
import Session from '../models/Session.js';
import Analytics from '../models/Analytics.js';
import User from '../models/User.js';
import { extractJSON } from '../utils/jsonHelper.js';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const callClaudeText = async (prompt, temperature = 0.3, maxTokens = 1800) => {
  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 30000
    }
  );

  const textBlock = (response.data?.content || []).find((b) => b.type === 'text');
  return (textBlock?.text || '').trim();
};

const getFillerBreakdown = (fillerEvents) => {
  const breakdown = {
    um: 0,
    uh: 0,
    like: 0,
    basically: 0,
    literally: 0
  };

  fillerEvents.forEach((event) => {
    const key = String(event.word || '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(breakdown, key)) {
      breakdown[key] += 1;
    }
  });

  return breakdown;
};

const buildQuestionScorePrompt = (session) => {
  const qaPairs = (session.questions || []).map((q, idx) => ({
    questionId: q.id ?? idx,
    question: q.question || '',
    answer: q.transcript || ''
  }));

  return `
You are a senior technical interviewer. Score each answer 0-10.
Candidate targeting: ${session.targetRole || 'Unknown role'} at ${(session.targetCompanies || []).join(', ') || 'Unknown companies'}
Experience: ${session.experienceLevel || 'Unknown'}

For each question-answer pair, return JSON:
[{ "questionId": 1, "score": 7.5, "verdict": "1 sentence", "improvement": "1 actionable tip" }]

Return ONLY valid JSON array, no markdown.

Question-answer pairs:
${JSON.stringify(qaPairs)}
`.trim();
};

const buildFeedbackPrompt = ({ session, metrics, questionScores }) => `
You are an interview coach. Write a personalized 300-word feedback report.

Candidate target:
- Role: ${session.targetRole || 'Unknown'}
- Companies: ${(session.targetCompanies || []).join(', ') || 'Unknown'}
- Experience: ${session.experienceLevel || 'Unknown'}

Metrics:
${JSON.stringify(metrics, null, 2)}

Question scores:
${JSON.stringify(questionScores, null, 2)}

Requirements:
- Cover strongest areas
- Cover critical improvements needed
- Add company-specific tips (e.g., for Amazon suggest STAR structure)
- End with exactly 3 specific action items for next session

Return plain text only.
`.trim();

const parseQuestionScores = (raw) => {
  const parsed = extractJSON(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map((item) => ({
    questionId: Number(item.questionId ?? 0),
    score: Math.max(0, Math.min(10, Number(item.score ?? 0))),
    verdict: String(item.verdict || '').trim(),
    improvement: String(item.improvement || '').trim()
  }));
};

export async function generateAnalytics(sessionId) {
  const [events, session] = await Promise.all([
    Event.find({ sessionId }).lean(),
    Session.findById(sessionId)
  ]);

  if (!session) {
    throw new Error('Session not found');
  }

  const fillerEvents = events.filter((e) => e.type === 'filler_word');
  const longPauseEvents = events.filter((e) => e.type === 'long_pause');
  const eyeEvents = events.filter((e) => typeof e.eyeScore === 'number');

  const fillerCount = fillerEvents.length;
  const fillerBreakdown = getFillerBreakdown(fillerEvents);
  const framesAboveThreshold = eyeEvents.filter((e) => e.eyeScore > 0.35).length;
  const eyeContactPct = eyeEvents.length ? (framesAboveThreshold / eyeEvents.length) * 100 : 0;
  const avgPauseSec = longPauseEvents.length
    ? longPauseEvents.reduce((sum, e) => sum + (e.pauseDurMs || 0), 0) / longPauseEvents.length / 1000
    : 0;
  const longPauseCount = longPauseEvents.length;

  const fullTranscript = (session.questions || [])
    .map((q) => q.transcript || '')
    .join(' ')
    .trim();
  const totalWords = fullTranscript ? fullTranscript.split(/\s+/).filter(Boolean).length : 0;
  const wordsPerMin = session.durationMs ? totalWords / (session.durationMs / 60000) : 0;

  let questionScores = [];
  try {
    const qaPrompt = buildQuestionScorePrompt(session);
    const qaRaw = await callClaudeText(qaPrompt, 0.2, 2000);
    questionScores = parseQuestionScores(qaRaw);
  } catch (err) {
    questionScores = (session.questions || []).map((q, idx) => ({
      questionId: q.id ?? idx,
      score: 5,
      verdict: 'Average answer with room for more depth.',
      improvement: 'Use a clearer structure and add one concrete example.'
    }));
  }

  const avgAnswerScore = questionScores.length
    ? questionScores.reduce((sum, q) => sum + q.score, 0) / questionScores.length
    : 0;

  const fillerPenalty = Math.floor(fillerCount / 5) * 2;
  const pausePenalty = Math.floor(longPauseCount / 3);
  const communicationScore = Math.max(0, 10 - fillerPenalty - pausePenalty);
  const eyeScore = Math.max(0, Math.min(10, eyeContactPct / 10));
  const overallScore = Number(
    (avgAnswerScore * 0.5 + communicationScore * 0.3 + eyeScore * 0.2).toFixed(2)
  );

  const metricsForPrompt = {
    fillerCount,
    fillerBreakdown,
    eyeContactPct,
    avgPauseSec,
    longPauseCount,
    totalWords,
    wordsPerMin,
    overallScore
  };

  let feedbackReport = '';
  try {
    const feedbackPrompt = buildFeedbackPrompt({
      session,
      metrics: metricsForPrompt,
      questionScores
    });
    feedbackReport = await callClaudeText(feedbackPrompt, 0.4, 1200);
  } catch (err) {
    feedbackReport =
      'You showed solid effort and intent. Focus on concise, structured responses, reduce filler usage, and add concrete impact examples. Keep practicing with role-specific scenarios and measurable outcomes.';
  }

  const analytics = await Analytics.findOneAndUpdate(
    { sessionId },
    {
      sessionId,
      fillerCount,
      fillerBreakdown,
      eyeContactPct,
      avgPauseSec,
      longPauseCount,
      totalWords,
      wordsPerMin,
      overallScore,
      feedbackReport,
      questionScores
    },
    { new: true, upsert: true }
  );

  session.status = 'done';
  await session.save();

  const user = await User.findById(session.userId);
  if (user) {
    const allAnalytics = await Analytics.find({}).select('sessionId overallScore').lean();
    const sessionIds = await Session.find({ userId: user._id }).select('_id').lean();
    const ownSet = new Set(sessionIds.map((s) => String(s._id)));
    const ownScores = allAnalytics
      .filter((a) => ownSet.has(String(a.sessionId)))
      .map((a) => Number(a.overallScore || 0));

    const readinessScore = ownScores.length
      ? Number((ownScores.reduce((sum, s) => sum + s, 0) / ownScores.length).toFixed(2))
      : 0;

    const lowest = [...questionScores].sort((a, b) => a.score - b.score)[0];
    let weakTopic = '';
    if (lowest) {
      const match = (session.questions || []).find((q, idx) => (q.id ?? idx) === lowest.questionId);
      weakTopic = match?.category || '';
    }

    user.stats = user.stats || {};
    user.stats.interviewsTaken = (user.stats.interviewsTaken || 0) + 1;
    user.stats.readinessScore = readinessScore;
    user.stats.weakTopic = weakTopic;
    await user.save();
  }

  return analytics;
}

export default generateAnalytics;
