const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas de transações são protegidas pelo middleware de autenticação
router.use(authMiddleware);

router.post('/', transactionController.create);
router.get('/', transactionController.list);
router.get('/summary', transactionController.summary); // Atenção: /summary precisa estar antes de /:id para não ser tratado como um ID
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;
