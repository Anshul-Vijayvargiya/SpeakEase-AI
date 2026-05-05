import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  type: { type: String, enum: ['filler_word', 'eye_contact_lost', 'long_pause', 'word'] },
  timestampMs: { type: Number, required: true },
  endMs: Number,
  word: String,
  eyeScore: Number,
  pauseDurMs: Number
});

eventSchema.index({ sessionId: 1, timestampMs: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
