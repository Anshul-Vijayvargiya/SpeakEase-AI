import OpenAI, { toFile } from 'openai';
import Event from '../models/Event.js';
import Session from '../models/Session.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const FILLERS = ['um', 'uh', 'like', 'basically', 'literally', 'you know', 'kind of'];

const isFillerWord = (word) => {
  const normalized = String(word || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '');

  return FILLERS.includes(normalized);
};

export const sendToWhisper = async (pcmBuffer, startMs, sessionId, questionId) => {
  if (!pcmBuffer || !pcmBuffer.length) {
    return { words: [], fillerHits: 0, fullTranscript: '' };
  }

  const file = await toFile(pcmBuffer, 'chunk.wav');
  const response = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word']
  });

  const words = (response.words || []).map((wordObj) => {
    const absoluteMs = (startMs || 0) + Math.round((wordObj.start || 0) * 1000);
    return {
      ...wordObj,
      absoluteMs
    };
  });

  const fillerEvents = words
    .filter((w) => isFillerWord(w.word))
    .map((w) => ({
      sessionId,
      type: 'filler_word',
      timestampMs: w.absoluteMs,
      word: String(w.word || '').toLowerCase()
    }));

  if (fillerEvents.length) {
    await Event.insertMany(fillerEvents);
  }

  const fullTranscript = String(response.text || '').trim();
  if (fullTranscript) {
    const session = await Session.findById(sessionId);
    if (session && session.questions?.[questionId]) {
      const existing = session.questions[questionId].transcript || '';
      session.questions[questionId].transcript = `${existing}${existing ? ' ' : ''}${fullTranscript}`;
      await session.save();
    }
  }

  return {
    words,
    fillerHits: fillerEvents.length,
    fullTranscript
  };
};

export default sendToWhisper;
