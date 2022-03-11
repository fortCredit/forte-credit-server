const express = require('express');

const router = express.Router();
const fortvestController = require('../controllers/fortvestController');
const auth = require('../middleware/user-auth');
// user
router.post('/newplan', auth, fortvestController.addFortvestPlan);
router.get('/', auth, fortvestController.getFortvestPlan);
router.get('/transactions/:type/:page/:size', auth, fortvestController.getPlanTranxHistory);
router.get('/filtertransactions/:filter/:page/:size', auth, fortvestController.filterTranxHistory);
router.post('/withdraw', auth, fortvestController.withdrawal);
router.post('/activate/autosave', auth, fortvestController.activateAutoSave);

module.exports = router;
