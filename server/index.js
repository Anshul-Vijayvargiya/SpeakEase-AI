import './env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import resumeRoutes from './routes/resume.js';
import sessionsRoutes from './routes/sessions.js';
import dashboardRoutes from './routes/dashboard.js';
import studyPlanRoutes from './routes/studyPlan.js';
import resumeAnalysisRoutes from './routes/resumeAnalysis.js';
import aptitudeRoutes from './routes/aptitude.js';
import codingRoutes from './routes/codingRoutes.js';
import sqlTestRoutes from './routes/sqlTestRoutes.js';
import { startPipeline } from './services/pipelineController.js';
import generateAnalytics from './services/analyticsGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'https://speakease-ai.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        console.warn(`[CORS WS] Rejected origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        console.warn(`[CORS HTTP] Rejected origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true
  })
);

mongoose
  .connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/speakease')
  .then(() => console.log(`[Database] MongoDB Connected to cluster: ${mongoose.connection.host}`))
  .catch((err) => {
    console.error('[Database] MongoDB Connection Error:', err);
    process.exit(1);
  });

app.use('/', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/', sessionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/resume-analysis', resumeAnalysisRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/sql-test', sqlTestRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

const decodeAudioChunk = (data) => {
  if (!data) {
    return null;
  }
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }
  if (data?.type === 'Buffer' && Array.isArray(data.data)) {
    return Buffer.from(data.data);
  }
  if (typeof data === 'string') {
    return Buffer.from(data, 'base64');
  }
  if (typeof data === 'object' && data.chunk) {
    return decodeAudioChunk(data.chunk);
  }
  return null;
};

const socketPipelines = new Map();

io.on('connection', (socket) => {
  socket.on('audio-chunk', async (data) => {
    try {
      const sessionId = data?.sessionId;
      const questionId = Number(data?.questionId ?? 0);
      const rawChunk = decodeAudioChunk(data);

      if (!sessionId || !rawChunk?.length) {
        return;
      }

      let entry = socketPipelines.get(socket.id);
      if (!entry || entry.sessionId !== sessionId || entry.questionId !== questionId) {
        if (entry?.pipeline) {
          await entry.pipeline.stop();
        }
        entry = {
          sessionId,
          questionId,
          pipeline: startPipeline(sessionId, questionId)
        };
        socketPipelines.set(socket.id, entry);
      }

      await entry.pipeline.onChunkReceived(rawChunk, Date.now());
    } catch (err) {
      socket.emit('pipeline-error', { message: 'Failed to process audio chunk' });
    }
  });

  socket.on('question-done', async (data) => {
    try {
      const current = socketPipelines.get(socket.id);
      if (current?.pipeline) {
        await current.pipeline.stop();
      }

      const sessionId = data?.sessionId || current?.sessionId;
      const nextQuestionId = Number(data?.nextQuestionId ?? data?.questionId ?? 0);
      if (sessionId) {
        socketPipelines.set(socket.id, {
          sessionId,
          questionId: nextQuestionId,
          pipeline: startPipeline(sessionId, nextQuestionId)
        });
      }
    } catch (err) {
      socket.emit('pipeline-error', { message: 'Failed to rotate question pipeline' });
    }
  });

  socket.on('interview-complete', async (data) => {
    try {
      const current = socketPipelines.get(socket.id);
      if (current?.pipeline) {
        await current.pipeline.stop();
      }

      const sessionId = data?.sessionId || current?.sessionId;
      if (sessionId) {
        await generateAnalytics(sessionId);
      }

      socketPipelines.delete(socket.id);
      socket.emit('analytics-generated', { sessionId });
    } catch (err) {
      socket.emit('pipeline-error', { message: 'Failed to complete interview pipeline' });
    }
  });

  socket.on('disconnect', async () => {
    const current = socketPipelines.get(socket.id);
    if (current?.pipeline) {
      await current.pipeline.stop();
    }
    socketPipelines.delete(socket.id);
  });
});



// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server: http://localhost:${PORT}/api/test`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this to free it:  npx kill-port ${PORT}`);
    console.error(`   Or use PowerShell:    Get-NetTCPConnection -LocalPort ${PORT} | Select -Expand OwningProcess | % { taskkill /PID $_ /F }\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});