// Removes all demonstration products before launch.
// Usage: node server/scripts/clearDemoData.js
//
// Demonstration products that have already been referenced by an order are
// deactivated instead of deleted, so existing order records stay intact.
// All other demonstration products are permanently deleted.

const path = require('path');
const db = require(path.join(__dirname, '..', 'config', 'database'));

const demoProducts = db.prepare('SELECT id FROM products WHERE is_demo = 1').all();

let deleted = 0;
let deactivated = 0;

const trx = db.transaction(() => {
  for (const { id } of demoProducts) {
    const referenced = db.prepare('SELECT COUNT(*) as c FROM order_items WHERE product_id = ?').get(id).c;
    if (referenced > 0) {
      db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      deactivated++;
    } else {
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      deleted++;
    }
  }
});

trx();

console.log(`Demonstration data cleared: ${deleted} deleted, ${deactivated} deactivated (referenced by orders).`);
const remainingActive = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1').get().c;
console.log(`${remainingActive} active product(s) remaining.`);
console.log('Set ENABLE_DEMO_DATA=false in .env so demonstration data is not re-seeded.');
