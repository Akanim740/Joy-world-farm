const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { validateOrder, handleValidationErrors } = require('../middleware/validation');
const { createRateLimiter } = require('../middleware/rateLimit');

const orderLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, message: 'Too many order attempts. Please wait a few minutes or contact us on WhatsApp.' });

router.post('/', orderLimiter, validateOrder, handleValidationErrors, OrderController.createOrder);
router.get('/track/:token', OrderController.trackOrderByToken);
router.get('/:ref', OrderController.getOrderByReference);

module.exports = router;
