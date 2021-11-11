const express = require('express');

const router = express.Router();
const paymentController = require('../controllers/transaction-management');
const auth = require('../middleware/user-auth');

// user

router.post('/payment/init', auth, paymentController.initializeTransaction);
router.post('/payment/verify', auth, paymentController.verifyTransaction);

module.exports = router;
