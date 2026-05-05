import express from 'express';
import { 
  getAllReports, 
  generateReport, 
  getReportById, 
  deleteReport 
} from '../controllers/reportController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get all reports for user
router.get('/', verifyToken, getAllReports);

// Generate report for specific interview
router.get('/generate/:id', verifyToken, generateReport);

// Get specific report by ID
router.get('/:id', verifyToken, getReportById);

// Delete report
router.delete('/:id', verifyToken, deleteReport);

export default router;