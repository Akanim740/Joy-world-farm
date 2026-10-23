const http = require('http');
const app = require('./index');

const server = app.listen(0, async () => {
  const port = server.address().port;
  const pages = [
    '/', '/chicks', '/turkeys', '/catfish', '/product?id=1', '/cart', '/checkout',
    '/order-confirmation', '/about', '/contact', '/wholesale', '/search',
    '/admin/login', '/sitemap.xml', '/robots.txt', '/api/health', '/api/products',
    '/api/config', '/nonexistent-page'
  ];

  const check = (p) => new Promise(resolve => {
    http.get({ host: '127.0.0.1', port, path: p }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ p, status: res.statusCode, len: data.length }));
    }).on('error', e => resolve({ p, status: 'ERR ' + e.message, len: 0 }));
  });

  for (const p of pages) {
    const r = await check(p);
    const ok = r.status === 200 || p === '/nonexistent-page' && r.status === 404;
    console.log(`${ok ? 'OK ' : '!! '} ${String(r.status).padEnd(5)} ${p} (${r.len} bytes)`);
  }

  server.close();
  process.exit(0);
});
