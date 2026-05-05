const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_SECRET || 'dummy_secret',
});

exports.createOrder = async (req, res) => {
    try {
        const { amount, creditsAdded } = req.body;

        // Convert to paise
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        const transaction = new Transaction({
            userId: req.user._id,
            razorpayOrderId: order.id,
            amount,
            creditsAdded
        });

        await transaction.save();

        res.status(200).json(order);
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Find transaction
            const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

            // Update transaction status
            transaction.status = 'Success';
            transaction.razorpayPaymentId = razorpay_payment_id;
            await transaction.save();

            // Add credits to user
            const user = await User.findById(transaction.userId);
            user.credits += transaction.creditsAdded;
            await user.save();

            res.status(200).json({ success: true, credits: user.credits });
        } else {
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Razorpay Verification Error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};
