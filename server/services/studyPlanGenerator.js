import StudyPlan from '../models/StudyPlan.js';
import Analytics from '../models/Analytics.js';
import Session from '../models/Session.js';
import Interview from '../models/Interview.js';
import axios from 'axios';
import { extractJSON } from '../utils/jsonHelper.js';

export async function generateStudyPlan(userId) {
  // Fetch from Session (AI Mentor)
  const latestSessions = await Session.find({ userId, status: 'done' }).sort({ createdAt: -1 }).limit(3);
  const sessionIds = latestSessions.map(s => s._id);
  const analyticsList = await Analytics.find({ sessionId: { $in: sessionIds } });

  let rawData = analyticsList.map(a => ({
    source: 'mentor_session',
    score: a.overallScore,
    weakTopics: a.questionScores.filter(q => q.score < 6).map(q => q.improvement)
  }));

  // Fetch from Interview
  const latestInterviews = await Interview.find({ userId, status: 'Completed' }).sort({ createdAt: -1 }).limit(3);
  const interviewData = latestInterviews.map(interview => {
    let weakTopics = [];
    const allResults = [
      ...(interview.codingResults || []),
      ...(interview.technicalResults || []),
      ...(interview.hrResults || [])
    ];
    
    allResults.forEach(q => {
      if (q.metrics) {
        const score = (q.metrics.technicalCorrectness || q.metrics.communicationSkills || 10);
        if (score < 6 || score <= 60) {
          weakTopics.push({
            question: q.questionText,
            feedback: q.metrics.feedback || "Needs improvement"
          });
        }
      }
    });

    return {
      source: 'mock_interview',
      role: interview.role,
      score: interview.overallScore,
      weakTopics: weakTopics.slice(0, 5) // limit to top 5 weak topics
    };
  });

  rawData = [...rawData, ...interviewData];

  if (rawData.length === 0) return null;

  const prompt = `
    Based on this interview performance data: ${JSON.stringify(rawData)}
    Generate a highly targeted study plan for the candidate.
    Return JSON format EXACTLY like this:
    {
      "focusArea": "Overall theme (e.g. System Design, Communication)",
      "topics": [
        { "title": "Topic Name", "priority": "High/Medium/Low", "resourceLink": "A generic google search URL for this topic" }
      ]
    }
  `;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    }
  );

  const planData = extractJSON(response.data.choices[0].message.content);
  
  const newPlan = new StudyPlan({
    userId,
    focusArea: planData.focusArea,
    topics: planData.topics
  });

  await newPlan.save();
  return newPlan;
}
