import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './models/User.js';

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const email = 'test@example.com'; // Change to a user you know exists
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found');
      process.exit(0);
    }

    console.log('User found:', user.email);
    console.log('Password Hash:', user.passwordHash ? 'Present' : 'Missing');

    if (user.passwordHash) {
      const isMatch = await bcrypt.compare('password123', user.passwordHash);
      console.log('Password match:', isMatch);
    }

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

testLogin();
