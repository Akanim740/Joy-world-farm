const path = require('path');
const fs = require('fs');
process.env.NODE_ENV = 'test';
process.env.ENABLE_DEMO_DATA = 'true';
process.env.SESSION_SECRET = 'test-secret-key';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.WHATSAPP_NUMBER = '2348000000000';

// Use an isolated database so tests never touch development data.
const testDbPath = path.join(__dirname, 'db', 'test.db');
for (const suffix of ['', '-shm', '-wal']) {
  const f = testDbPath + suffix;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
process.env.DB_PATH = testDbPath;

const assert = require('assert');
const http = require('http');

const app = require('./index');

let server;
let baseUrl;
let passed = 0;
let failed = 0;
let adminCookie = '';
let createdProductId = null;
let orderReference = null;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log('  PASS: ' + name); })
    .catch(err => { failed++; console.error('  FAIL: ' + name + ' -> ' + err.message); });
}

function request(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, body: json, raw: data, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  await new Promise(resolve => {
    server = app.listen(0, () => {
      baseUrl = 'http://127.0.0.1:' + server.address().port;
      resolve();
    });
  });

  console.log('\nJoy World Farm — Test Suite\n');

  console.log('Health & Config');
  await test('GET /api/health returns ok', async () => {
    const r = await request('GET', '/api/health');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.status, 'ok');
  });
  await test('GET /api/config exposes whatsapp number', async () => {
    const r = await request('GET', '/api/config');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.whatsappNumber, '2348000000000');
  });

  console.log('\nProduct browsing');
  await test('GET /api/products returns demo products', async () => {
    const r = await request('GET', '/api/products');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.body.products));
    assert.ok(r.body.products.length > 0, 'expected seeded products');
  });
  await test('GET /api/products?category=chicks filters', async () => {
    const r = await request('GET', '/api/products?category=chicks');
    assert.ok(r.body.products.every(p => p.category === 'chicks'));
  });
  await test('GET /api/products/:id returns a product', async () => {
    const list = await request('GET', '/api/products');
    const id = list.body.products[0].product_id;
    const r = await request('GET', '/api/products/' + id);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.product.product_id, id);
  });
  await test('GET /api/products/:id 404 for unknown', async () => {
    const r = await request('GET', '/api/products/does-not-exist-xyz');
    assert.strictEqual(r.status, 404);
  });
  await test('GET /api/products/categories works', async () => {
    const r = await request('GET', '/api/products/categories');
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(r.body.categories));
  });

  console.log('\nOrder creation & server-side pricing');
  await test('POST /api/orders creates order with server-calculated total', async () => {
    const list = await request('GET', '/api/products');
    const p = list.body.products[0];
    const r = await request('POST', '/api/orders', {
      customerName: 'Test Customer',
      customerPhone: '08031234567',
      city: 'Port Harcourt',
      collectionPreference: 'delivery',
      deliveryAddress: '1 Test Street',
      cartItems: [{ productId: p.id, quantity: p.min_order_quantity }]
    });
    assert.strictEqual(r.status, 201);
    assert.ok(r.body.orderReference.startsWith('JWF-'));
    orderReference = r.body.orderReference;

    const lookup = await request('GET', '/api/orders/' + orderReference);
    const expected = p.price * p.min_order_quantity;
    assert.strictEqual(lookup.body.order.subtotal, expected, 'subtotal must equal server price x qty');
  });
  await test('POST /api/orders rejects empty cart', async () => {
    const r = await request('POST', '/api/orders', {
      customerName: 'X', customerPhone: '08031234567', city: 'PH', cartItems: []
    });
    assert.strictEqual(r.status, 400);
  });
  await test('POST /api/orders rejects missing customer name', async () => {
    const r = await request('POST', '/api/orders', {
      customerPhone: '08031234567', city: 'PH', cartItems: [{ productId: 1, quantity: 10 }]
    });
    assert.strictEqual(r.status, 400);
  });
  await test('POST /api/orders rejects excessive quantity (stock validation)', async () => {
    const list = await request('GET', '/api/products');
    const p = list.body.products[0];
    const r = await request('POST', '/api/orders', {
      customerName: 'Test', customerPhone: '08031234567', city: 'PH',
      cartItems: [{ productId: p.id, quantity: p.available_quantity + 9999 }]
    });
    assert.strictEqual(r.status, 400);
  });
  await test('POST /api/orders rejects below minimum order', async () => {
    const list = await request('GET', '/api/products');
    const p = list.body.products.find(x => x.min_order_quantity > 1);
    const r = await request('POST', '/api/orders', {
      customerName: 'Test', customerPhone: '08031234567', city: 'PH',
      cartItems: [{ productId: p.id, quantity: 1 }]
    });
    assert.strictEqual(r.status, 400);
  });

  console.log('\nWholesale enquiries');
  await test('POST /api/wholesale saves enquiry', async () => {
    const r = await request('POST', '/api/wholesale', {
      customerName: 'Bulk Buyer', customerPhone: '08031234567',
      businessName: 'Farm Ltd', productsRequired: 'Broilers', estimatedQuantity: '500/month'
    });
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.body.success, true);
  });
  await test('POST /api/wholesale rejects missing phone', async () => {
    const r = await request('POST', '/api/wholesale', { customerName: 'No Phone' });
    assert.strictEqual(r.status, 400);
  });

  console.log('\nAdmin authentication & authorization');
  await test('GET /api/admin/stats blocked without auth', async () => {
    const r = await request('GET', '/api/admin/stats');
    assert.strictEqual(r.status, 401);
  });
  await test('POST /api/admin/login rejects bad credentials', async () => {
    const r = await request('POST', '/api/admin/login', { username: 'admin', password: 'wrong' });
    assert.strictEqual(r.status, 401);
  });
  await test('POST /api/admin/login succeeds with correct credentials', async () => {
    const r = await request('POST', '/api/admin/login', { username: 'admin', password: 'admin123' });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.success, true);
    const setCookie = r.headers['set-cookie'];
    assert.ok(setCookie, 'session cookie expected');
    adminCookie = setCookie[0].split(';')[0];
  });
  await test('GET /api/admin/stats works with auth', async () => {
    const r = await request('GET', '/api/admin/stats', null, { Cookie: adminCookie });
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.stats.totalOrders >= 1);
  });

  console.log('\nProduct management');
  await test('POST /api/admin/products creates product', async () => {
    const r = await request('POST', '/api/admin/products', {
      name: 'Test Product', category: 'chicks', price: 1000,
      availableQuantity: 25, minOrderQuantity: 2
    }, { Cookie: adminCookie });
    assert.strictEqual(r.status, 201);
    assert.ok(r.body.id);
    createdProductId = r.body.id;
  });
  await test('PUT /api/admin/products/:id updates price', async () => {
    const r = await request('PUT', '/api/admin/products/' + createdProductId, {
      name: 'Test Product Updated', category: 'chicks', price: 1500,
      availableQuantity: 30, minOrderQuantity: 2
    }, { Cookie: adminCookie });
    assert.strictEqual(r.status, 200);
    const check = await request('GET', '/api/products/' + createdProductId);
    assert.strictEqual(check.body.product.price, 1500);
  });
  await test('POST /api/admin/products/:id/toggle deactivates product', async () => {
    const r = await request('POST', '/api/admin/products/' + createdProductId + '/toggle', null, { Cookie: adminCookie });
    assert.strictEqual(r.status, 200);
    const list = await request('GET', '/api/products');
    assert.ok(!list.body.products.find(p => p.id === createdProductId), 'deactivated product should be hidden');
  });

  console.log('\nOrder management');
  await test('PUT /api/admin/orders/:id/status updates status', async () => {
    const orders = await request('GET', '/api/admin/orders', null, { Cookie: adminCookie });
    const o = orders.body.orders[0];
    const r = await request('PUT', '/api/admin/orders/' + o.id + '/status', { status: 'Confirmed' }, { Cookie: adminCookie });
    assert.strictEqual(r.status, 200);
    const detail = await request('GET', '/api/admin/orders/' + o.id, null, { Cookie: adminCookie });
    assert.strictEqual(detail.body.order.status, 'Confirmed');
    assert.ok(detail.body.history.length >= 1, 'status history should be recorded');
  });
  await test('PUT /api/admin/orders/:id/status rejects invalid status', async () => {
    const orders = await request('GET', '/api/admin/orders', null, { Cookie: adminCookie });
    const o = orders.body.orders[0];
    const r = await request('PUT', '/api/admin/orders/' + o.id + '/status', { status: 'Bogus' }, { Cookie: adminCookie });
    assert.strictEqual(r.status, 400);
  });

  console.log('\nDatabase persistence');
  await test('products persist in SQLite (queryable after operations)', async () => {
    const r = await request('GET', '/api/products');
    assert.ok(r.body.products.length >= 6, 'seeded products should persist');
  });

  console.log('\nWhatsApp link generation');
  await test('config provides clean numeric whatsapp number', async () => {
    const r = await request('GET', '/api/config');
    assert.ok(/^\d+$/.test(r.body.whatsappNumber), 'number must be digits only for URL');
  });

  console.log('\nStatic pages & SEO');
  await test('GET / returns home page', async () => {
    const r = await request('GET', '/');
    assert.strictEqual(r.status, 200);
  });
  await test('GET /sitemap.xml returns xml', async () => {
    const r = await request('GET', '/sitemap.xml');
    assert.strictEqual(r.status, 200);
    assert.ok(r.raw.includes('<urlset'));
  });
  await test('GET /robots.txt returns text', async () => {
    const r = await request('GET', '/robots.txt');
    assert.strictEqual(r.status, 200);
    assert.ok(r.raw.includes('Sitemap'));
  });
  await test('GET /admin/dashboard redirects when not authed', async () => {
    const r = await request('GET', '/admin/dashboard');
    assert.ok([301, 302].includes(r.status), 'expected redirect, got ' + r.status);
  });

  console.log('\nLogout');
  await test('GET /api/admin/logout ends session', async () => {
    await request('GET', '/api/admin/logout', null, { Cookie: adminCookie });
    const r = await request('GET', '/api/admin/stats', null, { Cookie: adminCookie });
    assert.strictEqual(r.status, 401);
  });

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  server.close();
  // Clean up the isolated test database.
  for (const suffix of ['', '-shm', '-wal']) {
    const f = testDbPath + suffix;
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch (e) {}
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test runner crashed:', err);
  if (server) server.close();
  process.exit(1);
});
