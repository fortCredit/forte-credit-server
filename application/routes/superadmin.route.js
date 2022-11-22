const express = require('express');

const router = express.Router();
const saController = require('../controllers/admin');
const auth = require('../middleware/user-auth');

// user
router.post('/register', saController.register);
router.post('/login', saController.login);
router.post('/getuser', auth, saController.getUser);
router.post('/password/change', auth, saController.changePassword);
router.post('/create', auth, saController.createAdmin);
router.get('/getverifiedusers', auth, saController.getVerifiedUsers);
router.get('/getnonverifiedusers', auth, saController.getNonVerifiedUsers);
router.post('/get/customer', auth, saController.getCustomer);
router.post('/get/customer/savings', auth, saController.getCustomerSavings);
router.get('/get/totalsavings', auth, saController.getTotalSavings);
router.get('/target/totalsavings', auth, saController.getTotalTargetSavings);
router.get('/fixed/totalsavings', auth, saController.getTotalFixedSavings);

module.exports = router;
