const express = require('express');

const router = express.Router();
const fortvestController = require('../controllers/fortvestController');
const auth = require('../middleware/user-auth');
// user
router.post('/newplan', auth, fortvestController.addFortvestPlan);
router.get('/', auth, fortvestController.getFortvestPlan);
router.get('/transactions', auth, fortvestController.getPlanTranxHistory);

module.exports = router;
