const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-order', verifyToken, paymentController.createOrder);

router.post('/verify-payment', verifyToken, paymentController.verifyPayment);

module.exports = router;
