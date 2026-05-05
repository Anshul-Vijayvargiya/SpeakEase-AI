import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Interview from './models/Interview.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await Interview.findOne().sort({ createdAt: -1 });
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}
run();
