const db = require('../config/database');

function initializeDatabase() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      breed TEXT,
      age TEXT,
      size TEXT,
      quantity_unit TEXT,
      price REAL NOT NULL,
      description TEXT,
      available_quantity INTEGER NOT NULL DEFAULT 0,
      min_order_quantity INTEGER NOT NULL DEFAULT 1,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      delivery_eligible INTEGER DEFAULT 1,
      unit_of_sale TEXT,
      variants TEXT,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Add columns if they don't exist (for existing DBs)
  try { db.prepare("ALTER TABLE products ADD COLUMN delivery_eligible INTEGER DEFAULT 1").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE products ADD COLUMN unit_of_sale TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE products ADD COLUMN variants TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE products ADD COLUMN featured INTEGER DEFAULT 0").run(); } catch(e) {}

  db.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_reference TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_address TEXT,
      delivery_area TEXT,
      delivery_landmark TEXT,
      delivery_instructions TEXT,
      recipient_name TEXT,
      recipient_phone TEXT,
      collection_preference TEXT,
      city TEXT,
      state TEXT DEFAULT 'Rivers State',
      customer_notes TEXT,
      delivery_method TEXT DEFAULT 'delivery',
      payment_method TEXT DEFAULT 'pay_on_confirmation',
      payment_status TEXT DEFAULT 'pending',
      subtotal REAL NOT NULL,
      delivery_fee REAL DEFAULT 0,
      delivery_zone_id INTEGER,
      delivery_zone_name TEXT,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      delivery_status TEXT DEFAULT 'Awaiting confirmation',
      delivery_date TEXT,
      delivery_time_window TEXT,
      delivery_person_name TEXT,
      delivery_person_phone TEXT,
      tracking_token TEXT,
      estimated_delivery_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Add columns if they don't exist
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_area TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_landmark TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_instructions TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN recipient_name TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN recipient_phone TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN state TEXT DEFAULT 'Rivers State'").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_method TEXT DEFAULT 'delivery'").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'pay_on_confirmation'").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_zone_id INTEGER").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_zone_name TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'Awaiting confirmation'").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_date TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_time_window TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_person_name TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN delivery_person_phone TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN tracking_token TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE orders ADD COLUMN estimated_delivery_date TEXT").run(); } catch(e) {}

  db.prepare(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS wholesale_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      business_name TEXT,
      products_required TEXT,
      estimated_quantity TEXT,
      notes TEXT,
      status TEXT DEFAULT 'New',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by TEXT,
      note TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `).run();

  try { db.prepare("ALTER TABLE order_status_history ADD COLUMN changed_by TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE order_status_history ADD COLUMN note TEXT").run(); } catch(e) {}

  // Delivery zones
  db.prepare(`
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_name TEXT NOT NULL,
      city_area TEXT NOT NULL,
      description TEXT,
      delivery_fee REAL NOT NULL DEFAULT 0,
      estimated_timeframe TEXT,
      minimum_order_amount REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      special_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Delivery events
  db.prepare(`
    CREATE TABLE IF NOT EXISTS delivery_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `).run();

  // Insert default Port Harcourt zones if none exist
  const zoneCount = db.prepare('SELECT COUNT(*) as c FROM delivery_zones').get().c;
  if (zoneCount === 0) {
    const insertZone = db.prepare(`
      INSERT INTO delivery_zones (zone_name, city_area, description, delivery_fee, estimated_timeframe, minimum_order_amount, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    insertZone.run('Port Harcourt Central', 'Port Harcourt (Central)', 'Diobu, Old GRA, New GRA, Borokiri', 1500, 'Same day - Next day (to be confirmed)', 0);
    insertZone.run('Port Harcourt Outskirts', 'Port Harcourt (Outskirts)', 'Rumuola, Rukpokwu, Eliozu, Choba', 2000, 'Next day (to be confirmed)', 0);
    insertZone.run('Obio-Akpor', 'Obio-Akpor LGA', 'Rumuokoro, Mgbuoba, Rumuepirikom', 2500, 'Next day (to be confirmed)', 0);
  }
}

module.exports = initializeDatabase;

module.exports = initializeDatabase;
