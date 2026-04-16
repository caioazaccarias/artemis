const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Todas as rotas de usuários devem passar pelo authMiddleware e depois permissionMiddleware
router.use(authMiddleware);
router.use(permissionMiddleware('users'));

router.get('/', userController.index);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

module.exports = router;
