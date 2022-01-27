const express = require('express');

const router = express.Router();
const paymentController = require('../controllers/transaction-management');
const withdrawalController = require('../controllers/withdrawalController');

const auth = require('../middleware/user-auth');

// user

router.post('/payment/init', auth, paymentController.initializeTransaction);
router.post('/payment/verify', auth, paymentController.verifyTransaction);
router.post('/withdrawal/init', auth, withdrawalController.initializeWithdrawal);
router.post('/withdrawal/verify', auth, withdrawalController.verifyWithdrawal);

module.exports = router;
