import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './models/User.js';

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).limit(5);
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log(`- ${u.email} | Hash: ${u.passwordHash ? 'Yes' : 'No'}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listUsers();
