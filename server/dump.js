import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Interview from './models/Interview.js';
import fs from 'fs';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await Interview.findOne().sort({ createdAt: -1 });
  fs.writeFileSync('dump.json', JSON.stringify(doc, null, 2));
  process.exit(0);
}
run();
