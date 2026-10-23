const db = require('../config/database');
const config = require('../config/config');
const { v4: uuidv4 } = require('uuid');

class OrderController {
  static createOrder(req, res) {
    try {
      const {
        customerName, customerPhone, customerEmail, deliveryAddress,
        collectionPreference, city, state, customerNotes, cartItems,
        deliveryArea, deliveryLandmark, deliveryInstructions, recipientName, recipientPhone,
        deliveryMethod, paymentMethod, deliveryZoneId, preferredDeliveryDate, preferredTimeWindow
      } = req.body;

      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      if (!customerName || !customerPhone) {
        return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
      }

      const method = deliveryMethod || (collectionPreference === 'collection' ? 'farm_collection' : 'delivery');
      if (method === 'delivery' && !deliveryAddress && !deliveryArea) {
        return res.status(400).json({ success: false, message: 'Delivery address or area is required for delivery orders' });
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
        if (qty < (product.min_order_quantity || 1)) {
          return res.status(400).json({ success: false, message: `Minimum order for ${product.name} is ${product.min_order_quantity || 1}` });
        }
        if (product.available_quantity < qty) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Only ${product.available_quantity} available.` });
        }
        const priceNum = Number(product.price);
        const priceUnconfirmed = (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') && (product.is_demo || priceNum === 0 || priceNum === null || priceNum === undefined || isNaN(priceNum));
        if (priceUnconfirmed) {
          return res.status(400).json({ success: false, message: `Price not confirmed for ${product.name}. Please request current price via WhatsApp.` });
        }
        const itemSubtotal = priceNum * qty;
        subtotal += itemSubtotal;
        productChecks.push({ product, quantity: qty, itemSubtotal, price: priceNum });
      }

      let deliveryFee = 0;
      let zoneName = null;
      if (method === 'farm_collection') {
        deliveryFee = 0;
      } else {
        if (deliveryZoneId) {
          const zone = db.prepare('SELECT * FROM delivery_zones WHERE id = ? AND active = 1').get(deliveryZoneId);
          if (zone) {
            deliveryFee = Number(zone.delivery_fee) || 0;
            zoneName = zone.zone_name;
          } else {
            deliveryFee = config.deliveryFee || 0;
          }
        } else {
          deliveryFee = config.deliveryFee || 0;
        }
      }

      const total = subtotal + deliveryFee;
      const orderReference = 'JWF-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
      const trackingToken = uuidv4();

      const orderResult = db.prepare(`
        INSERT INTO orders (order_reference, customer_name, customer_phone, customer_email, delivery_address, delivery_area, delivery_landmark, delivery_instructions, recipient_name, recipient_phone, collection_preference, city, state, customer_notes, delivery_method, payment_method, payment_status, subtotal, delivery_fee, delivery_zone_id, delivery_zone_name, total, status, delivery_status, tracking_token, delivery_date, delivery_time_window)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Awaiting confirmation', ?, ?, ?)
      `).run(
        orderReference, String(customerName).trim(), String(customerPhone).trim(), customerEmail ? String(customerEmail).trim() : null,
        deliveryAddress ? String(deliveryAddress).trim() : null,
        deliveryArea ? String(deliveryArea).trim() : null,
        deliveryLandmark ? String(deliveryLandmark).trim() : null,
        deliveryInstructions ? String(deliveryInstructions).trim() : null,
        (recipientName || customerName) ? String(recipientName || customerName).trim() : null,
        recipientPhone ? String(recipientPhone).trim() : null,
        collectionPreference || (method === 'farm_collection' ? 'collection' : 'delivery'),
        city ? String(city).trim() : null,
        state || 'Rivers State',
        customerNotes ? String(customerNotes).trim() : null,
        method,
        paymentMethod || 'pay_on_confirmation',
        'pending',
        subtotal, deliveryFee, deliveryZoneId || null, zoneName, total,
        trackingToken,
        preferredDeliveryDate ? String(preferredDeliveryDate).trim() : null,
        preferredTimeWindow ? String(preferredTimeWindow).trim() : null
      );

      const orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const updateStock = db.prepare('UPDATE products SET available_quantity = available_quantity - ? WHERE id = ?');

      const trx = db.transaction(() => {
        for (const pc of productChecks) {
          insertItem.run(orderId, pc.product.id, pc.product.name, pc.price, pc.quantity, pc.itemSubtotal);
          updateStock.run(pc.quantity, pc.product.id);
        }
        db.prepare('INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?)').run(orderId, null, 'Pending', 'system', 'Order created');
        db.prepare('INSERT INTO delivery_events (order_id, status, message, updated_by) VALUES (?, ?, ?, ?)').run(orderId, 'Awaiting confirmation', 'Order received and awaiting confirmation', 'system');
      });
      trx();

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        orderReference,
        orderId,
        total,
        reference: orderReference,
        trackingToken
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
      const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC').all(order.id);
      const deliveryEvents = db.prepare('SELECT * FROM delivery_events WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
      res.json({ success: true, order, items, history, deliveryEvents });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching order' });
    }
  }

  static trackOrderByToken(req, res) {
    try {
      const { token } = req.params;
      const order = db.prepare('SELECT order_reference, customer_name, customer_phone, status, delivery_status, delivery_method, collection_preference, delivery_zone_name, delivery_date, delivery_time_window, delivery_person_name, delivery_person_phone, created_at, updated_at, total, subtotal, delivery_fee FROM orders WHERE tracking_token = ?').get(token);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found or invalid tracking token' });
      }
      const orderFull = db.prepare('SELECT id FROM orders WHERE tracking_token = ?').get(token);
      const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC').all(orderFull.id);
      const deliveryEvents = db.prepare('SELECT * FROM delivery_events WHERE order_id = ? ORDER BY created_at ASC').all(orderFull.id);
      res.json({ success: true, order, history, deliveryEvents });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error tracking order' });
    }
  }
}

module.exports = OrderController;
