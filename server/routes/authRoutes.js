import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import admin from '../config/firebaseAdmin.js';
import resend from '../config/resend.js';

const router = express.Router();

const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

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

router.post('/api/auth/forgot-password', async (req, res) => {
  const genericResponse = { message: 'If that email is registered, a reset link has been sent. Check your inbox.' };

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // Only real email/password accounts have a passwordHash to reset.
    // Respond identically either way so we never reveal whether the email exists.
    if (user && user.passwordHash) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordTokenHash = hashResetToken(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;

      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
            subject: 'Reset your SpeakEase AI password',
            html: `
              <p>We received a request to reset your SpeakEase AI password.</p>
              <p><a href="${resetLink}">Click here to reset your password</a> (expires in 1 hour).</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
            `
          });
        } catch (emailErr) {
          console.error('[Forgot Password] Email send failed:', emailErr);
        }
      }
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error('[Forgot Password Error]:', err);
    // Still return the generic response so failures don't leak account existence
    return res.status(200).json(genericResponse);
  }
});

router.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const tokenHash = hashResetToken(token);
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    console.error('[Reset Password Error]:', err);
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
