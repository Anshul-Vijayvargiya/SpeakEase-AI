import admin from '../config/firebaseAdmin.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let user = null;

    // Strategy 1: Try Firebase ID token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!user) {
        user = new User({
          firebaseUid: decodedToken.uid,
          name: decodedToken.name || 'User',
          email: decodedToken.email,
          credits: 1000000
        });
        await user.save();
      }
    } catch (firebaseErr) {
      // Strategy 2: Fallback to local JWT (from /api/auth/login)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id);
      } catch (jwtErr) {
        // Both failed - only log once with both error reasons
        console.error(`[Auth] Unauthorized access attempt. Firebase Error: ${firebaseErr.code || firebaseErr.message}, JWT Error: ${jwtErr.message}`);
        return res.status(403).json({ error: 'Unauthorized: Invalid or expired token' });
      }
    }

    if (!user) {
      return res.status(403).json({ error: 'User context not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Critical Auth Error:', error.message);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};