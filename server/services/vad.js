export const SILENCE_THRESHOLD = 0.01;
export const SILENCE_DURATION_MS = 300;
export const SAMPLE_RATE = 48000;
export const BYTES_PER_SAMPLE = 2;

const WINDOW_MS = 20;
const WINDOW_BYTES = Math.floor((SAMPLE_RATE * WINDOW_MS) / 1000) * BYTES_PER_SAMPLE;

export const calcRMS = (buffer) => {
  if (!buffer || buffer.length < BYTES_PER_SAMPLE) {
    return 0;
  }

  const sampleCount = Math.floor(buffer.length / BYTES_PER_SAMPLE);
  if (sampleCount === 0) {
    return 0;
  }

  let sumSquares = 0;
  for (let i = 0; i < sampleCount; i += 1) {
    const sample = buffer.readInt16LE(i * BYTES_PER_SAMPLE);
    const normalized = sample / 32768;
    sumSquares += normalized * normalized;
  }

  return Math.sqrt(sumSquares / sampleCount);
};

export const findSilenceCutPoint = (pcmBuffer) => {
  if (!pcmBuffer || pcmBuffer.length < WINDOW_BYTES) {
    return -1;
  }

  let silenceRunMs = 0;

  for (let offset = 0; offset + WINDOW_BYTES <= pcmBuffer.length; offset += WINDOW_BYTES) {
    const window = pcmBuffer.subarray(offset, offset + WINDOW_BYTES);
    const rms = calcRMS(window);

    if (rms < SILENCE_THRESHOLD) {
      silenceRunMs += WINDOW_MS;
      if (silenceRunMs >= SILENCE_DURATION_MS) {
        return offset + WINDOW_BYTES;
      }
    } else {
      silenceRunMs = 0;
    }
  }

  return -1;
};

