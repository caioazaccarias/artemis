const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.get('/', authMiddleware, permissionMiddleware(['settings', 'dashboard']), settingController.index); // Qualquer um que vê dashboard ou tem settings pode VER as taxas.
router.put('/', authMiddleware, permissionMiddleware(['settings']), settingController.update); // Apenas admin (com rule 'settings') pode ATUALIZAR.

module.exports = router;
