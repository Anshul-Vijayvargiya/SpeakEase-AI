export class AudioBuffer {
  constructor() {
    this.chunks = [];
    this.totalBytes = 0;
    this.startTimeMs = null;
    this.MAX_BYTES = 5 * 1024 * 1024;
  }

  push(chunk, receivedAtMs) {
    if (!chunk || chunk.length === 0) {
      return null;
    }

    if (this.startTimeMs === null) {
      this.startTimeMs = receivedAtMs;
    }

    this.chunks.push(chunk);
    this.totalBytes += chunk.length;

    if (this.totalBytes > this.MAX_BYTES) {
      return this.forceDrain();
    }

    return null;
  }

  getMerged() {
    return Buffer.concat(this.chunks, this.totalBytes);
  }

  drain() {
    const audio = this.getMerged();
    const startMs = this.startTimeMs;
    this.chunks = [];
    this.totalBytes = 0;
    this.startTimeMs = null;
    return { audio, startMs };
  }

  forceDrain() {
    return this.drain();
  }

  drainUpTo(byteOffset) {
    const merged = this.getMerged();
    const safeOffset = Math.max(0, Math.min(byteOffset, merged.length));
    const drainedAudio = merged.subarray(0, safeOffset);
    const remainder = merged.subarray(safeOffset);
    const startMs = this.startTimeMs;

    this.chunks = remainder.length ? [Buffer.from(remainder)] : [];
    this.totalBytes = remainder.length;

    if (safeOffset >= merged.length) {
      this.startTimeMs = null;
    } else if (startMs === null) {
      this.startTimeMs = null;
    }

    return { audio: drainedAudio, startMs };
  }
}

export default AudioBuffer;
