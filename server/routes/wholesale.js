const express = require('express');
const router = express.Router();
const { validateWholesale, handleValidationErrors } = require('../middleware/validation');
const db = require('../config/database');
const { createRateLimiter } = require('../middleware/rateLimit');

const enquiryLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, message: 'Too many enquiries submitted. Please try again later.' });

router.post('/', enquiryLimiter, validateWholesale, handleValidationErrors, (req, res) => {
  try {
    const { customerName, customerPhone, businessName, productsRequired, estimatedQuantity, notes } = req.body;
    db.prepare(`
      INSERT INTO wholesale_enquiries (customer_name, customer_phone, business_name, products_required, estimated_quantity, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(customerName, customerPhone, businessName || null, productsRequired || null, estimatedQuantity || null, notes || null);
    res.status(201).json({ success: true, message: 'Wholesale enquiry submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting enquiry' });
  }
});

module.exports = router;
