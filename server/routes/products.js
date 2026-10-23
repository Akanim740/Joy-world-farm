const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

router.get('/', ProductController.getAllProducts);
router.get('/categories', ProductController.getCategories);
router.get('/:id', ProductController.getProductById);

module.exports = router;
