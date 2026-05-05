const express = require('express');
const jobController = require('../controllers/jobController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, jobController.getJobs);
router.post('/', verifyToken, jobController.addJob);
router.put('/:id', verifyToken, jobController.updateJob);
router.delete('/:id', verifyToken, jobController.deleteJob);

module.exports = router;
