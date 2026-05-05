import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Get Current User Profile & Credits
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-__v');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

export default router;
