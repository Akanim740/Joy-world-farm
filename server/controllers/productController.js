const db = require('../config/database');

class ProductController {
  static getAllProducts(req, res) {
    try {
      const category = req.query.category;
      let query = 'SELECT * FROM products WHERE is_active = 1';
      const params = [];
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      query += ' ORDER BY created_at DESC';
      let products = db.prepare(query).all(...params);

      if (req.query.featured === 'true') {
        products = products.slice(0, 6);
      }

      res.json({ success: true, products });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error fetching products' });
    }
  }

  static getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = db.prepare('SELECT * FROM products WHERE (id = ? OR product_id = ?) AND is_active = 1').get(id, id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error fetching product' });
    }
  }

  static getCategories(req, res) {
    try {
      const categories = db.prepare('SELECT DISTINCT category FROM products WHERE is_active = 1').all();
      res.json({ success: true, categories: categories.map(c => c.category) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
  }
}

module.exports = ProductController;
