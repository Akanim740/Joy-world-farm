const db = require('../config/database');
const config = require('../config/config');

class OrderController {
  static createOrder(req, res) {
    try {
      const {
        customerName, customerPhone, customerEmail, deliveryAddress,
        collectionPreference, city, customerNotes, cartItems
      } = req.body;

      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      let subtotal = 0;
      const productChecks = [];

      for (const item of cartItems) {
        const qty = parseInt(item.quantity, 10);
        if (!item.productId || !Number.isInteger(qty) || qty < 1) {
          return res.status(400).json({ success: false, message: 'Invalid cart item' });
        }
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.productId);
        if (!product) {
          return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
        }
        if (qty < product.min_order_quantity) {
          return res.status(400).json({ success: false, message: `Minimum order for ${product.name} is ${product.min_order_quantity}` });
        }
        if (qty > product.available_quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Only ${product.available_quantity} available.` });
        }
        const itemSubtotal = product.price * qty;
        subtotal += itemSubtotal;
        productChecks.push({ product, quantity: qty, itemSubtotal });
      }

      const deliveryFee = config.deliveryFee || 0;
      const total = subtotal + deliveryFee;
      const orderReference = 'JWF-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

      const orderResult = db.prepare(`
        INSERT INTO orders (order_reference, customer_name, customer_phone, customer_email, delivery_address, collection_preference, city, customer_notes, subtotal, delivery_fee, total, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      `).run(
        orderReference, customerName, customerPhone, customerEmail || null,
        deliveryAddress || null, collectionPreference || 'delivery', city,
        customerNotes || null, subtotal, deliveryFee, total
      );

      const orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const updateStock = db.prepare('UPDATE products SET available_quantity = available_quantity - ? WHERE id = ?');

      const trx = db.transaction(() => {
        for (const pc of productChecks) {
          insertItem.run(orderId, pc.product.id, pc.product.name, pc.product.price, pc.quantity, pc.itemSubtotal);
          updateStock.run(pc.quantity, pc.product.id);
        }
      });
      trx();

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        orderReference,
        orderId
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error creating order' });
    }
  }

  static getOrderByReference(req, res) {
    try {
      const { ref } = req.params;
      const order = db.prepare('SELECT * FROM orders WHERE order_reference = ?').get(ref);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      res.json({ success: true, order, items });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching order' });
    }
  }
}

module.exports = OrderController;
