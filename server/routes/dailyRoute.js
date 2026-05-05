const express = require('express');
const dailyController = require('../controllers/dailyController');

const router = express.Router();

router.get('/', dailyController.getDailyQuestion);

module.exports = router;
