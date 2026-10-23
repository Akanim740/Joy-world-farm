const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/database');
const requireAuth = require('../middleware/auth');
const { validateProduct, handleValidationErrors } = require('../middleware/validation');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '..', '..', 'client', 'images', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

/* ---------- Stats ---------- */
router.get('/stats', requireAuth, (req, res) => {
  const stats = {
    totalOrders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    pendingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Pending'").get().c,
    confirmedOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Confirmed'").get().c,
    processingOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Processing'").get().c,
    completedOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Completed'").get().c,
    cancelledOrders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Cancelled'").get().c,
    totalProducts: db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1').get().c,
    totalEnquiries: db.prepare('SELECT COUNT(*) as c FROM wholesale_enquiries').get().c
  };
  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all();
  const completed = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = 'Completed'").get();
  const allOrders = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'Cancelled'").get();
  const sales = {
    completedRevenue: completed.total,
    potentialRevenue: allOrders.total
  };
  res.json({ success: true, stats, recentOrders, sales });
});

/* ---------- Products ---------- */
router.get('/products', requireAuth, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json({ success: true, products });
});

router.post('/products', requireAuth, upload.single('image'), validateProduct, handleValidationErrors, (req, res) => {
  const { name, category, subcategory, breed, age, size, quantity_unit, price, description, availableQuantity, minOrderQuantity } = req.body;
  const image_url = req.file ? `/images/uploads/${req.file.filename}` : '/images/placeholder.svg';
  try {
    const result = db.prepare(`
      INSERT INTO products (product_id, name, category, subcategory, breed, age, size, quantity_unit, price, description, available_quantity, min_order_quantity, image_url, is_demo, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `).run(
      uuidv4(), name, category, subcategory || null, breed || null, age || null, size || null,
      quantity_unit || null, parseFloat(price), description || null,
      parseInt(availableQuantity, 10), parseInt(minOrderQuantity || 1, 10), image_url
    );
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Error creating product' });
  }
});

router.put('/products/:id', requireAuth, upload.single('image'), validateProduct, handleValidationErrors, (req, res) => {
  const { id } = req.params;
  const { name, category, subcategory, breed, age, size, quantity_unit, price, description, availableQuantity, minOrderQuantity, isActive } = req.body;
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
    const image_url = req.file ? `/images/uploads/${req.file.filename}` : existing.image_url;
    const active = (isActive === 'false' || isActive === '0' || isActive === false) ? 0 : 1;
    db.prepare(`
      UPDATE products SET name=?, category=?, subcategory=?, breed=?, age=?, size=?, quantity_unit=?, price=?, description=?, available_quantity=?, min_order_quantity=?, image_url=?, is_active=?, is_demo=0, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).run(
      name, category, subcategory || null, breed || null, age || null, size || null,
      quantity_unit || null, parseFloat(price), description || null,
      parseInt(availableQuantity, 10), parseInt(minOrderQuantity || 1, 10), image_url, active, id
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Error updating product' });
  }
});

router.post('/products/:id/toggle', requireAuth, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
  db.prepare('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.is_active ? 0 : 1, id);
  res.json({ success: true });
});

router.delete('/products/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  res.json({ success: true });
});

/* ---------- Orders ---------- */
router.get('/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json({ success: true, orders });
});

router.get('/orders/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at DESC').all(id);
  res.json({ success: true, order, items, history });
});

router.put('/orders/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['Pending', 'Confirmed', 'Processing', 'Ready for collection or dispatch', 'Completed', 'Cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  db.prepare('UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, id);
  db.prepare('INSERT INTO order_status_history (order_id, old_status, new_status) VALUES (?, ?, ?)').run(id, order.status, status);
  res.json({ success: true });
});

/* ---------- Enquiries ---------- */
router.get('/enquiries', requireAuth, (req, res) => {
  const enquiries = db.prepare('SELECT * FROM wholesale_enquiries ORDER BY created_at DESC').all();
  res.json({ success: true, enquiries });
});

router.put('/enquiries/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['New', 'Contacted', 'Closed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const enquiry = db.prepare('SELECT * FROM wholesale_enquiries WHERE id = ?').get(id);
  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
  db.prepare('UPDATE wholesale_enquiries SET status = ? WHERE id = ?').run(status, id);
  res.json({ success: true });
});

module.exports = router;
