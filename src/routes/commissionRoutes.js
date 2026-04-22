const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);
router.use(permissionMiddleware(['commissions']));

router.get('/', commissionController.index);
router.post('/', commissionController.create);
router.put('/:id', commissionController.update);
router.delete('/:id', commissionController.destroy);
router.delete('/purge/all', commissionController.purge);

module.exports = router;
