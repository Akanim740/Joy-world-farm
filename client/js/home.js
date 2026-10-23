document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  let featured = [];
  let waNumber = '';

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function card(p) {
    const meta = [p.breed, p.age, p.size, p.quantity_unit].filter(Boolean).join(' · ');
    const inStock = p.available_quantity > 0;
    return `
      <div class="product-card">
        <div class="product-image">
          <img src="${escapeHtml(p.image_url || '/images/placeholder.svg')}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.parentElement.textContent='🐓';">
          <div class="product-badge">${escapeHtml(p.subcategory ? p.subcategory.replace(/-/g, ' ') : p.category)}</div>
        </div>
        <div class="product-info">
          <div class="product-name">${escapeHtml(p.name)} ${p.is_demo ? '<span class="badge-demo">Demo</span>' : ''}</div>
          <div class="product-meta">${escapeHtml(meta)}</div>
          <div class="product-price">${formatNaira(p.price)}</div>
          <div class="product-stock">${inStock ? escapeHtml(p.available_quantity) + ' available' : 'Out of stock'}</div>
          <div class="card-actions">
            <button class="btn btn-primary btn-full" data-add="${escapeHtml(p.product_id)}" ${inStock ? '' : 'disabled'}>${inStock ? 'Add to Cart' : 'Out of Stock'}</button>
            <a href="/product?id=${encodeURIComponent(p.product_id)}" class="btn btn-outline btn-full">View Details</a>
            <button class="btn btn-whatsapp btn-full" data-wa="${escapeHtml(p.product_id)}" ${inStock ? '' : 'disabled'}>Order on WhatsApp</button>
          </div>
        </div>
      </div>`;
  }

  grid.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    const waBtn = e.target.closest('[data-wa]');
    if (addBtn) {
      const p = featured.find(x => x.product_id === addBtn.dataset.add);
      if (!p) return;
      addToCart(p.product_id, p.min_order_quantity);
      showToast(`Added ${p.name} to cart (min order: ${p.min_order_quantity})`);
      return;
    }
    if (waBtn) {
      const p = featured.find(x => x.product_id === waBtn.dataset.wa);
      if (!p) return;
      if (!waNumber) { showToast('WhatsApp number not configured yet. Please use the contact page.'); return; }
      const msg = `Hello Joy World Farm, I am interested in:\n\n${p.name}\nPrice: ${formatNaira(p.price)}\nProduct ID: ${p.product_id}\n\nPlease confirm availability and delivery to my area.`;
      window.open(getWhatsappUrl(waNumber, msg), '_blank');
    }
  });

  fetch('/api/config')
    .then(r => r.json())
    .then(c => { waNumber = c.whatsappNumber || ''; })
    .catch(() => {});

  fetch('/api/products?featured=true')
    .then(r => r.json())
    .then(data => {
      featured = (data.products || []).slice(0, 6);
      if (featured.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><h3>No products available yet</h3><p>Check back soon for our latest stock.</p></div>';
        return;
      }
      grid.innerHTML = featured.map(card).join('');
    })
    .catch(() => {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load products</h3><p>Please refresh the page.</p></div>';
    });
});
