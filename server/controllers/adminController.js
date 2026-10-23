const db = require('../config/database');

class AdminController {
  static login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
    const bcrypt = require('bcryptjs');
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    req.session.isAdmin = true;
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    res.json({ success: true, message: 'Login successful' });
  }

  static logout(req, res) {
    req.session.destroy((err) => {
      res.redirect('/admin/login');
    });
  }

  static getDashboard(req, res) {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'").get().count;
    const confirmedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Confirmed'").get().count;
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Completed'").get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count;
    res.json({
      success: true,
      stats: { totalOrders, pendingOrders, confirmedOrders, completedOrders, totalProducts }
    });
  }
}

module.exports = AdminController;
