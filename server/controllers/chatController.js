const Session = require('../models/Session');
const { client, modelName } = require('../config/gemini');

exports.handleChatMessage = async (req, res) => {
  try {
    const { sessionId, transcript } = req.body;
    const session = await Session.findById(sessionId);

    if (!session || session.status === 'completed') {
      return res.status(400).json({ error: "Session not found or finished" });
    }

    // 1. Save User Message
    session.messages.push({ role: 'user', content: transcript });

    // 2. Prepare Context (Last 6 turns for speed/efficiency)
    const history = session.messages.slice(-6).map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    // 3. AI Generation with Persona
    const result = await client.models.generateContent({
      model: modelName,
      contents: history,
      systemInstruction: "You are an HR Interviewer. Ask a short, natural follow-up question."
    });

    const aiReply = result.candidates[0].content.parts[0].text;

    // 4. Save AI Reply & Return
    session.messages.push({ role: 'assistant', content: aiReply });
    await session.save();

    res.json({ aiReply });
  } catch (error) {
    console.error("Chat Turn Error:", error.message);
    res.status(500).json({ error: "Failed to process conversation" });
  }
};