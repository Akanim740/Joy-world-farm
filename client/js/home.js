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
    const meta = [p.breed, p.age, p.size, p.quantity_unit].filter(Boolean).join(' • ');
    const inStock = p.available_quantity > 0;
    const priceNum = Number(p.price);
    const priceUnconfirmed = p.is_demo || priceNum === 0 || priceNum === null || priceNum === undefined || isNaN(priceNum);
    const priceDisplay = priceUnconfirmed ? 'Request current price' : `₦${priceNum.toLocaleString()}`;
    return `
      <div class="product-card">
        ${p.is_demo ? '<div class="demo-notice">Demonstration listing - pricing unconfirmed</div>' : ''}
        <div class="product-image">
          <img src="${escapeHtml ? escapeHtml(p.image_url || '/images/placeholder.svg') : (p.image_url || '/images/placeholder.svg')}" alt="${escapeHtml ? escapeHtml(p.name) : p.name}" loading="lazy" onerror="this.src='/images/placeholder.svg'">
          <div class="product-badge">${escapeHtml ? escapeHtml(p.subcategory ? p.subcategory.replace(/-/g, ' ') : p.category) : (p.subcategory ? p.subcategory.replace(/-/g, ' ') : p.category)}</div>
        </div>
        <div class="product-info">
          <div class="product-name">${escapeHtml ? escapeHtml(p.name) : p.name} ${p.is_demo ? '<span class="badge-demo">Demo/unconfirmed</span>' : ''}</div>
          <div class="product-meta">${escapeHtml ? escapeHtml(meta) : meta}</div>
          <div class="product-price" style="${priceUnconfirmed ? 'color:#d97706;font-weight:600;' : ''}">${priceDisplay}</div>
          <div class="product-stock">${inStock ? (p.available_quantity + ' available') : 'Contact us for availability'}</div>
          <div class="card-actions">
            <button class="btn btn-primary btn-full" data-add="${escapeHtml ? escapeHtml(p.product_id) : p.product_id}" ${priceUnconfirmed ? 'disabled title="Request current price"' : (inStock ? '' : 'disabled')}>${priceUnconfirmed ? 'Request Price' : (inStock ? 'Add to Cart' : 'Out of Stock')}</button>
            <a href="/product?id=${encodeURIComponent(p.product_id)}" class="btn btn-outline btn-full">View Details</a>
            <button class="btn btn-whatsapp btn-full" data-wa="${escapeHtml ? escapeHtml(p.product_id) : p.product_id}">Order on WhatsApp</button>
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
      const priceNum = Number(p.price);
      const priceUnconfirmed = p.is_demo || priceNum === 0 || priceNum === null || priceNum === undefined || isNaN(priceNum);
      if (priceUnconfirmed) {
        if (!waNumber) { showToast('WhatsApp number not configured yet. Please use the contact page.'); return; }
        const msg = `Hello Joy World Farm, I would like to enquire about:\n\nProduct: ${p.name} (ID: ${p.product_id})\nCategory: ${p.category}\nPlease send current price, availability and delivery details.`;
        if (typeof getWhatsappUrl === 'function') window.open(getWhatsappUrl(waNumber, msg), '_blank');
        else window.open(`https://wa.me/${String(waNumber).replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
        return;
      }
      if (!p.available_quantity) { showToast('Out of stock'); return; }
      addToCart(p.product_id, p.min_order_quantity || 1);
      showToast(`Added ${p.name} to cart (min order: ${p.min_order_quantity || 1})`);
      return;
    }
    if (waBtn) {
      const p = featured.find(x => x.product_id === waBtn.dataset.wa);
      if (!p) return;
      if (!waNumber) { showToast('WhatsApp number not configured yet. Please use the contact page.'); return; }
      const priceNum = Number(p.price);
      const priceUnconfirmed = p.is_demo || priceNum === 0 || priceNum === null || priceNum === undefined || isNaN(priceNum);
      const msg = priceUnconfirmed
        ? `Hello Joy World Farm, I would like to enquire about:\n\nProduct: ${p.name} (ID: ${p.product_id})\nCategory: ${p.category}\nPlease send current price, availability and delivery details.`
        : `Hello Joy World Farm, I am interested in:\n\n${p.name}\nPrice: ₦${priceNum.toLocaleString()}\nProduct ID: ${p.product_id}\n\nPlease confirm availability and delivery to my area.`;
      if (typeof getWhatsappUrl === 'function') window.open(getWhatsappUrl(waNumber, msg), '_blank');
      else window.open(`https://wa.me/${String(waNumber).replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
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
