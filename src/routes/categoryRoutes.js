const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', categoryController.create);
router.get('/', categoryController.list);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;
