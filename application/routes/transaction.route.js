const express = require('express');

const router = express.Router();
const paymentController = require('../controllers/transaction-management');
const withdrawalController = require('../controllers/withdrawalController');

const auth = require('../middleware/user-auth');

// user

router.post('/payment/init', auth, paymentController.initializeTransaction);
router.post('/payment/verify', auth, paymentController.verifyTransaction);
// router.post('/targetsavings/withdrawal/init',
// auth,
// withdrawalController.initializeTargetWithdrawal);
// router.post('/fixedsavings/withdrawal/init',
// auth,
// withdrawalController.initializeFixedWithdrawal);
router.post('/withdrawal/verify', auth, withdrawalController.verifyWithdrawal);
router.post('/log', auth, paymentController.transactionLog);

module.exports = router;
