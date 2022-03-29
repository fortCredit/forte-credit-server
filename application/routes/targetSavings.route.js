const express = require('express');

const router = express.Router();
const targetSavingsController = require('../controllers/targetSavingsController');

const auth = require('../middleware/user-auth');
// user
router.post('/create/targetsavings', auth, targetSavingsController.createTargetSavings);
router.get('/', auth, targetSavingsController.getFortvestPlan);
router.get('/transactions/:type/:page/:size', auth, targetSavingsController.getPlanTranxHistory);
router.get('/filtertransactions/:filter/:page/:size', auth, targetSavingsController.filterTranxHistory);
router.post('/withdraw', auth, targetSavingsController.withdrawal);
router.get('/list/targetsavings', auth, targetSavingsController.listTargetSavings);
router.post('/topup', auth, targetSavingsController.topUp);
router.post('/totalsavings', auth, targetSavingsController.totalSavings);

module.exports = router;
