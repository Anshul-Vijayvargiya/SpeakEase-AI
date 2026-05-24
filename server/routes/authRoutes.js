import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import admin from '../config/firebaseAdmin.js';

const router = express.Router();

const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

const buildUserResponse = (userDoc) => {
  const user = userDoc.toObject();
  delete user.passwordHash;
  return user;
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

router.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, college, yearOfStudy } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      passwordHash,
      college,
      yearOfStudy
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: buildUserResponse(user)
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ 
        message: 'This account was created via Social Login. Please sign up again to create a password.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.json({
      token,
      user: buildUserResponse(user)
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    if (!admin || typeof admin.auth !== 'function') {
      console.error('[Google Auth Error]: Firebase Admin has not been correctly initialized.');
      return res.status(500).json({ 
        message: 'Firebase Admin is not configured on the server. Please verify environment variables.' 
      });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseErr) {
      console.error('[Firebase Token Verification Error]:', firebaseErr);
      return res.status(401).json({ 
        message: 'Invalid Google token. Authentication failed.',
        error: firebaseErr.message
      });
    }

    const { email, name } = decodedToken;
    if (!email) {
      return res.status(400).json({ message: 'Email address not found in Google account.' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create new user for social signup
      user = await User.create({
        name: name || email.split('@')[0],
        email: email,
        firebaseUid: decodedToken.uid,
        credits: 10,
        preferredLanguage: 'JavaScript',
        plan: 'free',
        stats: {
          readinessScore: 0,
          interviewsTaken: 0,
          practiceHours: 0,
          weakTopic: ''
        }
      });
    } else if (!user.firebaseUid) {
      // Link the existing user with their Firebase UID if it is missing
      user.firebaseUid = decodedToken.uid;
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: buildUserResponse(user)
    });
  } catch (err) {
    console.error('[Auth Google Error]:', err);
    return res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

router.get('/api/auth/me', verifyToken, (req, res) => {
  return res.json(buildUserResponse(req.user));
});

router.put("/api/auth/update-profile", verifyToken, async (req, res) => {
  try {
    const { name, college, preferredLanguage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, // User object in authMiddleware has _id, not id
      { name, college, preferredLanguage },
      { new: true }
    ).select("-passwordHash");
    res.json({ user });
  } catch (err) {
    console.error('[Update Profile Error]:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
