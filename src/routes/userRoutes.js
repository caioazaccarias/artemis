const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Todas as rotas de usuários devem passar pelo authMiddleware e depois adminMiddleware
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', userController.index);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

module.exports = router;
