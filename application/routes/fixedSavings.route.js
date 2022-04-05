const express = require('express');

const router = express.Router();
const fixedSavingsController = require('../controllers/fixedSavingsController');
const auth = require('../middleware/user-auth');
// user
router.post('/create/fixedsavings', auth, fixedSavingsController.createFixedSavings);
router.get('/transactions/:type/:page/:size', auth, fixedSavingsController.getPlanTranxHistory);
router.get('/filtertransactions/:filter/:page/:size', auth, fixedSavingsController.filterTranxHistory);
router.post('/withdraw', auth, fixedSavingsController.withdrawal);
router.post('/activate/autosave', auth, fixedSavingsController.activateAutoSave);
router.get('/list/fixedsavings', auth, fixedSavingsController.listFixedSavings);
router.post('/savenow', auth, fixedSavingsController.saveNow);
router.post('/totalsavings', auth, fixedSavingsController.totalSavings);

module.exports = router;
