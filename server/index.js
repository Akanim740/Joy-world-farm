const express = require('express');
const path = require('path');
const config = require('./config/config');
const db = require('./config/database');
const initializeDatabase = require('./models/schema');
const seedDemoData = require('./utils/seed');
const initializeAdmin = require('./utils/adminInit');

const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'client')));

app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 86400000
  }
}));

initializeDatabase();
initializeAdmin();
seedDemoData();

/* ---------- API Routes ---------- */
app.use('/api/config', require('./routes/config'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/wholesale', require('./routes/wholesale'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/adminApi'));
app.use('/api/auth', require('./routes/auth'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ---------- Admin pages (server-side auth gate) ---------- */
function serveIfAdmin(file) {
  return (req, res) => {
    if (req.session && req.session.isAdmin) {
      res.sendFile(path.join(__dirname, '..', 'client', file));
    } else {
      res.redirect('/admin/login');
    }
  };
}

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin/dashboard');
  res.sendFile(path.join(__dirname, '..', 'client', 'admin-login.html'));
});
app.get('/admin/dashboard', serveIfAdmin('admin-dashboard.html'));
app.get('/admin/products', serveIfAdmin('admin-products.html'));
app.get('/admin/orders', serveIfAdmin('admin-orders.html'));
app.get('/admin/enquiries', serveIfAdmin('admin-enquiries.html'));
app.get('/admin/delivery', serveIfAdmin('admin-delivery.html'));

/* ---------- Static pages (clean URLs) ---------- */
const pages = {
  '/': 'index.html',
  '/about': 'about.html',
  '/contact': 'contact.html',
  '/wholesale': 'wholesale.html',
  '/cart': 'cart.html',
  '/checkout': 'checkout.html',
  '/order-confirmation': 'order-confirmation.html',
  '/order-tracking': 'order-tracking.html',
  '/delivery-info': 'delivery-info.html',
  '/privacy': 'privacy.html',
  '/terms': 'terms.html',
  '/returns': 'returns.html',
  '/chicks': 'chicks.html',
  '/turkeys': 'turkeys.html',
  '/catfish': 'catfish.html',
  '/product': 'product.html',
  '/search': 'search.html'
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, '..', 'client', file)));
});

/* ---------- SEO ---------- */
function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

app.get('/sitemap.xml', (req, res) => {
  const base = config.siteUrl.replace(/\/$/, '');
  const staticPages = ['/', '/chicks', '/turkeys', '/catfish', '/about', '/contact', '/wholesale', '/delivery-info', '/privacy', '/terms', '/returns'];

  let products = [];
  try {
    products = db.prepare('SELECT product_id, updated_at FROM products WHERE is_active = 1').all();
  } catch (e) {
    products = [];
  }

  const entries = [
    ...staticPages.map(u => ({ loc: base + u, lastmod: null })),
    ...products.map(p => ({
      loc: `${base}/product?id=${encodeURIComponent(p.product_id)}`,
      lastmod: p.updated_at
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => {
    const lastmod = e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
    return `  <url><loc>${escapeXml(e.loc)}</loc>${lastmod}</url>`;
  }).join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${config.siteUrl}/sitemap.xml`);
});

/* ---------- 404 ---------- */
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  res.status(404).sendFile(path.join(__dirname, '..', 'client', '404.html'));
});

/* ---------- Error handler ---------- */
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
  res.status(500).send('Something went wrong.');
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Joy World Farm server running on http://localhost:${config.port} (${config.nodeEnv})`);
    if (!config.whatsappNumber) {
      console.log('NOTE: WHATSAPP_NUMBER is not set. WhatsApp buttons are hidden until configured.');
    }
  });
}

module.exports = app;
