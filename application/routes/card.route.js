const express = require('express');

const router = express.Router();
const cardController = require('../controllers/card-management');
const auth = require('../middleware/user-auth');

// user

router.post('/register/init', auth, cardController.initializeCardReg);
router.post('/register/complete', auth, cardController.completeCardReg);
router.post('/all', auth, cardController.getAllCards);
router.post('/make-default', auth, cardController.makeCardDefault);
router.post('/remove', auth, cardController.removeCard);

module.exports = router;
