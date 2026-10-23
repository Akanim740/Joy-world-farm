const { body, validationResult } = require('express-validator');

const validateOrder = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required').escape(),
  body('customerPhone').trim().notEmpty().withMessage('Phone number is required').matches(/^[0-9+\-\s()]{7,30}$/).withMessage('Invalid phone number'),
  body('customerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email').normalizeEmail(),
  body('city').optional({ checkFalsy: true }).trim().escape(),
  body('state').optional({ checkFalsy: true }).trim().escape(),
  body('deliveryAddress').optional({ checkFalsy: true }).trim().escape(),
  body('deliveryArea').optional({ checkFalsy: true }).trim().escape(),
  body('deliveryLandmark').optional({ checkFalsy: true }).trim().escape(),
  body('deliveryInstructions').optional({ checkFalsy: true }).trim().escape(),
  body('recipientName').optional({ checkFalsy: true }).trim().escape(),
  body('recipientPhone').optional({ checkFalsy: true }).matches(/^[0-9+\-\s()]{7,30}$/).withMessage('Invalid recipient phone number'),
  body('deliveryMethod').optional({ checkFalsy: true }).isIn(['delivery', 'farm_collection']).withMessage('Invalid delivery method'),
  body('collectionPreference').optional({ checkFalsy: true }).trim().escape(),
  body('paymentMethod').optional({ checkFalsy: true }).trim().escape(),
  body('deliveryZoneId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Invalid delivery zone'),
  body('preferredDeliveryDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid delivery date'),
  body('preferredTimeWindow').optional({ checkFalsy: true }).trim().escape(),
  body('customerNotes').optional({ checkFalsy: true }).trim().escape(),
  body('cartItems').isArray({ min: 1 }).withMessage('Cart must have at least one item')
];

const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required').escape(),
  body('category').trim().notEmpty().withMessage('Category is required').escape(),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('availableQuantity').isInt({ min: 0 }).withMessage('Quantity must be valid'),
  body('minOrderQuantity').isInt({ min: 1 }).withMessage('Minimum order must be at least 1')
];

const validateWholesale = [
  body('customerName').trim().notEmpty().withMessage('Name is required').escape(),
  body('customerPhone').trim().notEmpty().withMessage('Phone is required').matches(/^[0-9+\-\s()]{7,30}$/).withMessage('Invalid phone number'),
  body('businessName').optional({ checkFalsy: true }).trim().escape(),
  body('productsRequired').optional({ checkFalsy: true }).trim().escape(),
  body('estimatedQuantity').optional({ checkFalsy: true }).trim().escape(),
  body('notes').optional({ checkFalsy: true }).trim().escape()
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateOrder,
  validateProduct,
  validateWholesale,
  handleValidationErrors
};
