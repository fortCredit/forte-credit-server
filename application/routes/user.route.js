const express = require('express');

const router = express.Router();
const userController = require('../controllers/spectrumteam');

// user
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/password/reset/request', userController.resetRequest);
router.post(
  '/password/reset/validatetoken',
  userController.validateToken,
);
router.post('/password/reset', userController.resetPassword);
router.post('/profile/update', userController.updateProfile);
router.post('/get', userController.getUser);
// router.post('/all', userController.getAllUsers);

module.exports = router;
