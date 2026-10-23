const { body, validationResult } = require('express-validator');

const validateOrder = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required').escape(),
  body('customerPhone').trim().notEmpty().withMessage('Phone number is required'),
  body('city').trim().notEmpty().withMessage('City is required').escape(),
  body('deliveryAddress').optional().trim().escape(),
  body('collectionPreference').optional().trim().escape(),
  body('customerNotes').optional().trim().escape(),
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
  body('customerPhone').trim().notEmpty().withMessage('Phone is required'),
  body('businessName').optional().trim().escape(),
  body('productsRequired').optional().trim().escape(),
  body('estimatedQuantity').optional().trim().escape(),
  body('notes').optional().trim().escape()
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
