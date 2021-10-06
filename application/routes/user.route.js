const express = require('express');

const router = express.Router();
const userController = require('../controllers/user-management');
const auth = require('../middleware/user-auth');
// user
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/password/reset/request', userController.resetRequest);
router.post(
  '/password/reset/validatetoken',
  userController.validateToken,
);
router.post('/password/reset', userController.resetPassword);
router.post('/profile/update', auth, userController.updateProfile);
router.post('/update/bankdetails', auth, userController.updateAccountDetails);
// router.post('/all', userController.getAllUsers);

module.exports = router;
