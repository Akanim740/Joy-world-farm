const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const requireAuth = require('../middleware/auth');

router.post('/login', AdminController.login);
router.get('/logout', AdminController.logout);
router.get('/dashboard', requireAuth, AdminController.getDashboard);

module.exports = router;
