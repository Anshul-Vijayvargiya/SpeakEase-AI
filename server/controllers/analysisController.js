// server/controllers/analysisController.js
import { client } from '../config/gemini.js';
import Session from '../models/Session.js';
import { extractJSON } from '../utils/jsonHelper.js';

// 🔹 1. Start Session (Context Setting for MERN)
export const startSession = async (req, res) => {
  try {
    const { topic, techStack, experience } = req.body;
    const finalTopic = topic || "General Software Developer";
    const finalStack = techStack || "General Technologies";
    const finalExp = experience || "mid-level";

    const session = await Session.create({
      userId: req.user._id,
      topic: finalTopic,
      techStack: finalStack,
      messages: [],
      status: "active",
    });

    const firstQuestion = `Welcome! I'm your AI interviewer for the ${finalTopic} role. I understand you have ${finalExp} years of experience and work with ${finalStack}. Let's jump right in. Tell me about a challenging technical problem you solved using this stack.`;
    session.messages.push({ role: "assistant", content: firstQuestion });
    await session.save();

    res.status(201).json({ _id: session._id, firstQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start session" });
  }
};

// 🔹 2. Continuous Chat & Live Mentor (Socket/API)
export const analyzeSpeech = async (req, res) => {
  try {
    const { sessionId, transcript } = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const previousMessages = session.messages.map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');

    const systemPrompt = `
      You are an AI Interview Mentor for a ${session.topic} role. 
      
      Here is the interview history so far:
      ${previousMessages}
      
      The candidate just answered the last question with: "${transcript}"
      
      Analyze the candidate's latest answer in the context of the previous question asked by the Interviewer.
      Provide realistic feedback, and then ask the next logical technical question. 
      
      Return ONLY a purely valid JSON object. DO NOT USE MARKDOWN BLOCK FORMATTING OR '\`\`\`json'. MUST start with { and end with }. Do not add any extra text or comments.
      {
        "aiReply": "Next technical question to ask the candidate",
        "quickFix": "English grammar correction or 'Perfect' if no issues",
        "proVersion": "A more professional/structured way to say their answer",
        "techVersion": "An expert-level technical way to phrase their answer",
        "emotionType": "Confident/Nervous/Hesitant",
        "emotionScore": 85
      }
    `;

    const result = await client.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    // Robust JSON Parsing
    const responseText = result.response.text();
    const mentorData = extractJSON(responseText, {
      aiReply: "I see. Let's move on. Can you explain your approach to handling application state?",
      quickFix: "System error: Feedback unavailable.",
      proVersion: "N/A",
      techVersion: "N/A",
      emotionType: "Neutral",
      emotionScore: 50
    });

    session.messages.push({ role: "user", content: transcript }, { role: "assistant", content: mentorData.aiReply });
    await session.save();
    res.json(mentorData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Mentor failed" });
  }
};

// 🔹 3. Finish & Evaluate (Video Dashboard Data)
export const finishSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Guard Clause against immediate quitting without engaging
    const userMessages = session.messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) {
      session.finalAnalysis = {
        confidenceScore: "0/100",
        pace: "N/A",
        fillerCount: "0 Found",
        overallFeedback: "The interview was ended before any candidate responses were recorded.",
        strengths: "N/A",
        improvements: "Please try an interview again and speak to the microphone when it is your turn."
      };
      session.status = "completed";
      await session.save();
      return res.json(session.finalAnalysis);
    }

    const transcript = session.messages.map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');

    const evalPrompt = `
      Evaluate this full interview transcript for a ${session.topic} role:
      ${transcript}
      
      Return ONLY a valid JSON object for the dashboard. DO NOT USE MARKDOWN OR \`\`\`json. MUST start with { and end with }. Do not add any extra text.
      {
        "confidenceScore": "85",
        "pace": "Normal/Fast/Slow",
        "fillerCount": "3 Found",
        "overallFeedback": "Overall professional summary of their execution...",
        "strengths": "Points about technical knowledge and robust communication...",
        "improvements": "Points about areas to focus on for next time..."
      }
    `;

    const result = await client.generateContent({
      contents: [{ role: "user", parts: [{ text: evalPrompt }] }],
    });

    const responseText = result.response.text();
    const finalAnalysis = extractJSON(responseText, {
      confidenceScore: "N/A",
      pace: "N/A",
      fillerCount: "N/A",
      overallFeedback: "Failed to parse final feedback.",
      strengths: "N/A",
      improvements: "N/A"
    });

    session.finalAnalysis = finalAnalysis;
    session.status = "completed";
    await session.save();

    res.json(session.finalAnalysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
};