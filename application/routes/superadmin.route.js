const express = require('express');

const router = express.Router();
const saController = require('../controllers/admin');
const auth = require('../middleware/user-auth');

// user
router.post('/register', saController.register);
router.post('/login', saController.login);
router.post('/getuser', auth, saController.getUser);
router.post('/password/change', auth, saController.changePassword);
router.patch('/delete-customer', auth, saController.deleteCustomer);
router.post('/create', auth, saController.createAdmin);
router.get('/getverifiedusers', auth, saController.getVerifiedUsers);
router.get('/getnonverifiedusers', auth, saController.getNonVerifiedUsers);
router.post('/get/customer', auth, saController.getCustomer);
router.post('/get/customer/savings', auth, saController.getCustomerSavings);
router.get('/get/totalsavings', auth, saController.getTotalSavings);
router.get('/target/totalsavings', auth, saController.getTotalTargetSavings);
router.get('/fixed/totalsavings', auth, saController.getTotalFixedSavings);
router.post('/get-user', auth, saController.getUser);
router.get('/fixedsavings/withdrawals', auth, saController.getFixedSavingsWithdrawals);
router.get('/targetsavings/withdrawals', auth, saController.getTargetSavingsWithdrawals);

module.exports = router;
