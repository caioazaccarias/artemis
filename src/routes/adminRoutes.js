const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const adminController = require('../controllers/adminController');

// Todas as rotas de administração exigem autenticação e permissão de backup
router.use(authMiddleware);
router.use(permissionMiddleware('backup'));

router.get('/backup', adminController.exportData);
router.post('/restore', adminController.importData);

module.exports = router;
