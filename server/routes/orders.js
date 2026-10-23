const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { validateOrder, handleValidationErrors } = require('../middleware/validation');

router.post('/', validateOrder, handleValidationErrors, OrderController.createOrder);
router.get('/:ref', OrderController.getOrderByReference);

module.exports = router;
