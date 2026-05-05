import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Readable } from 'stream';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export const convertToPCM = (webmBuffer) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    const inputStream = new Readable({
      read() {
        this.push(webmBuffer);
        this.push(null);
      }
    });

    ffmpeg(inputStream)
      .inputFormat('webm')
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(48000)
      .format('s16le')
      .on('error', (err) => reject(err))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe()
      .on('data', (chunk) => chunks.push(chunk))
      .on('error', (err) => reject(err));
  });

export default convertToPCM;
