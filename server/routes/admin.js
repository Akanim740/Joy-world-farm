const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const requireAuth = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Please try again in 15 minutes.' });

router.post('/login', loginLimiter, AdminController.login);
router.get('/logout', AdminController.logout);
router.get('/dashboard', requireAuth, AdminController.getDashboard);

module.exports = router;
