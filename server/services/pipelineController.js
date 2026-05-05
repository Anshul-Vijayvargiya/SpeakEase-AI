import AudioBuffer from './audioBuffer.js';
import { convertToPCM } from './converter.js';
import { findSilenceCutPoint } from './vad.js';
import { sendToWhisper } from './whisper.js';
import Event from '../models/Event.js';
import Analytics from '../models/Analytics.js';
import Session from '../models/Session.js';

const FLUSH_INTERVAL_MS = 8000;

export const startPipeline = (sessionId, questionId) => {
  const audioBuffer = new AudioBuffer();
  let active = true;
  let processing = Promise.resolve();

  const flushAndTranscribe = async (payload) => {
    if (!payload?.audio?.length) {
      return null;
    }
    return sendToWhisper(payload.audio, payload.startMs, sessionId, questionId);
  };

  const tick = async () => {
    if (!active || audioBuffer.totalBytes === 0) {
      return;
    }
    const drained = audioBuffer.drain();
    await flushAndTranscribe(drained);
  };

  const timer = setInterval(() => {
    processing = processing.then(() => tick()).catch(() => null);
  }, FLUSH_INTERVAL_MS);

  const onChunkReceived = (rawChunk, receivedAtMs) => {
    processing = processing
      .then(async () => {
        if (!active || !rawChunk) {
          return;
        }

        const pcmChunk = await convertToPCM(rawChunk);
        const forced = audioBuffer.push(pcmChunk, receivedAtMs);
        if (forced?.audio?.length) {
          await flushAndTranscribe(forced);
        }

        const merged = audioBuffer.getMerged();
        const cutPoint = findSilenceCutPoint(merged);
        if (cutPoint > 0) {
          const drained = audioBuffer.drainUpTo(cutPoint);
          await flushAndTranscribe(drained);
        }
      })
      .catch(() => null);

    return processing;
  };

  const stop = async () => {
    active = false;
    clearInterval(timer);
    await processing;

    const finalDrain = audioBuffer.drain();
    if (finalDrain.audio.length) {
      await flushAndTranscribe(finalDrain);
    }
  };

  return { onChunkReceived, stop };
};

export const generateSessionAnalytics = async (sessionId) => {
  const [events, session] = await Promise.all([
    Event.find({ sessionId }).lean(),
    Session.findById(sessionId).lean()
  ]);

  const fillerEvents = events.filter((e) => e.type === 'filler_word');
  const fillerBreakdown = {
    um: 0,
    uh: 0,
    like: 0,
    basically: 0,
    literally: 0
  };

  fillerEvents.forEach((event) => {
    const key = String(event.word || '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(fillerBreakdown, key)) {
      fillerBreakdown[key] += 1;
    }
  });

  const fullTranscript = (session?.questions || [])
    .map((q) => q.transcript || '')
    .join(' ')
    .trim();

  const words = fullTranscript ? fullTranscript.split(/\s+/).filter(Boolean) : [];
  const totalWords = words.length;
  const maxTimestamp = events.reduce((max, event) => Math.max(max, event.timestampMs || 0), 0);
  const mins = maxTimestamp > 0 ? maxTimestamp / 60000 : 1;
  const wordsPerMin = Math.round(totalWords / mins);

  const analyticsPayload = {
    sessionId,
    fillerCount: fillerEvents.length,
    fillerBreakdown,
    eyeContactPct: 0,
    avgPauseSec: 0,
    longPauseCount: events.filter((e) => e.type === 'long_pause').length,
    totalWords,
    wordsPerMin,
    overallScore: 0,
    feedbackReport: '',
    questionScores: []
  };

  return Analytics.findOneAndUpdate({ sessionId }, analyticsPayload, {
    new: true,
    upsert: true
  });
};

export const generateAnalytics = async (sessionId) => generateSessionAnalytics(sessionId);

export default startPipeline;
