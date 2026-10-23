const db = require('../config/database');
const { enableDemoData } = require('../config/config');
const { v4: uuidv4 } = require('uuid');

function seedDemoData() {
  if (!enableDemoData) return;

  const count = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_demo = 1').get();
  if (count.count > 0) return;

  const products = [
    {
      product_id: uuidv4(), name: 'Broiler Chicks - Day Old (Demo)', category: 'chicks', subcategory: 'day-old',
      breed: 'Broilers', age: 'Day old', price: 850,
      description: 'Healthy day-old broiler chicks. DEMONSTRATION LISTING - pricing and stock unconfirmed.',
      available_quantity: 500, min_order_quantity: 10, image_url: '/images/chick.svg', is_demo: 1, is_active: 1
    },
    {
      product_id: uuidv4(), name: 'Layer Chicks - Day Old (Demo)', category: 'chicks', subcategory: 'day-old',
      breed: 'Layers', age: 'Day old', price: 950,
      description: 'Quality layer chicks. DEMONSTRATION LISTING - pricing and stock unconfirmed.',
      available_quantity: 400, min_order_quantity: 10, image_url: '/images/chick.svg', is_demo: 1, is_active: 1
    },
    {
      product_id: uuidv4(), name: 'Noiler Chicks - Day Old (Demo)', category: 'chicks', subcategory: 'day-old',
      breed: 'Noilers', age: 'Day old', price: 900,
      description: 'Dual-purpose noiler chicks. DEMONSTRATION LISTING - pricing and stock unconfirmed.',
      available_quantity: 300, min_order_quantity: 10, image_url: '/images/chick.svg', is_demo: 1, is_active: 1
    },
    {
      product_id: uuidv4(), name: 'Broiler Grow-Out Birds (Demo)', category: 'chicks', subcategory: 'grow-out',
      breed: 'Broilers', age: '4 weeks', price: 3200,
      description: 'Grow-out broiler birds. DEMONSTRATION LISTING - pricing and stock unconfirmed.',
      available_quantity: 150, min_order_quantity: 5, image_url: '/images/chick.svg', is_demo: 1, is_active: 1
    },
    {
      product_id: uuidv4(), name: 'Turkey Poults - Day Old (Demo)', category: 'turkeys', subcategory: 'day-old',
      breed: 'Turkey', age: 'Day old', price: 3500,
      description: 'Day-old turkey poults. DEMONSTRATION LISTING - pricing and stock unconfirmed.',
      available_quantity: 150, min_order_quantity: 5, image_url: '/images/turkey.svg', is_demo: 1, is_active: 1
    },
    {
      product_id: uuidv4(), name: 'Turkey Grow-Outs (Demo)', category: 'turkeys', subcategory: 'grow-out',
      breed: 'Turkey', age: '8 weeks', price: 12000,
      description: 'Turkey grow-out birds. DEMONSTRATION LISTING - pricing and stock unconfirmed.',
      available_quantity: 80, min_order_quantity: 2, image_url: '/images/turkey.svg', is_demo: 1, is_active: 1
    },
    {
      product_id: uuidv4(), name: 'Catfish Fingerlings (Demo)', category: 'catfish', subcategory: 'fingerlings',
      size: 'Fingerlings (3-5cm)', quantity_unit: 'per 100', price: 1500,
      description: 'Healthy catfish fingerlings. DEMONSTRATION LISTING - pricing and stock unconfirmed.',
      available_quantity: 1000, min_order_quantity: 1, image_url: '/images/catfish.svg', is_demo: 1, is_active: 1
    },
    {
      product_id: uuidv4(), name: 'Catfish Juveniles (Demo)', category: 'catfish', subcategory: 'juveniles',
      size: 'Juveniles (6-8cm)', quantity_unit: 'per 100', price: 2500,
      description: 'Catfish juveniles. DEMONSTRATION LISTING - pricing and stock unconfirmed.',
      available_quantity: 800, min_order_quantity: 1, image_url: '/images/catfish.svg', is_demo: 1, is_active: 1
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO products (product_id, name, category, subcategory, breed, age, size, quantity_unit, price, description, available_quantity, min_order_quantity, image_url, is_demo, is_active)
    VALUES (@product_id, @name, @category, @subcategory, @breed, @age, @size, @quantity_unit, @price, @description, @available_quantity, @min_order_quantity, @image_url, @is_demo, @is_active)
  `);

  const insertMany = db.transaction((prods) => {
    for (const p of prods) {
      stmt.run({
        product_id: p.product_id, name: p.name, category: p.category, subcategory: p.subcategory || null,
        breed: p.breed || null, age: p.age || null, size: p.size || null, quantity_unit: p.quantity_unit || null,
        price: p.price, description: p.description, available_quantity: p.available_quantity,
        min_order_quantity: p.min_order_quantity, image_url: p.image_url, is_demo: p.is_demo, is_active: p.is_active
      });
    }
  });

  insertMany(products);
  console.log('Demo data seeded (' + products.length + ' demonstration products)');
}

module.exports = seedDemoData;
