let currentProduct = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('productDetail');

  if (!id) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Product not found</h3>
        <p>The product ID is missing. Please browse our catalogue.</p>
        <a href="/chicks" class="btn btn-primary">Browse Products</a>
      </div>`;
    return;
  }

  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!data.success || !data.product) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Product not found</h3>
          <p>This product may no longer be available.</p>
          <a href="/chicks" class="btn btn-primary">Browse Products</a>
        </div>`;
      return;
    }

    currentProduct = data.product;
    const p = currentProduct;
    document.title = `${p.name} - Joy World Farm`;

    const priceNum = Number(p.price);
    const priceUnconfirmed = p.is_demo || priceNum === 0 || priceNum === null || priceNum === undefined;
    const priceDisplay = priceUnconfirmed ? 'Request current price' : `₦${priceNum.toLocaleString()}`;

    const metaRows = [];
    if (p.breed) metaRows.push(`<tr><th>Breed</th><td>${escapeHtml ? escapeHtml(p.breed) : p.breed}</td></tr>`);
    if (p.age) metaRows.push(`<tr><th>Age / Growth Stage</th><td>${escapeHtml ? escapeHtml(p.age) : p.age}</td></tr>`);
    if (p.size) metaRows.push(`<tr><th>Size</th><td>${escapeHtml ? escapeHtml(p.size) : p.size}</td></tr>`);
    if (p.quantity_unit) metaRows.push(`<tr><th>Quantity Unit</th><td>${escapeHtml ? escapeHtml(p.quantity_unit) : p.quantity_unit}</td></tr>`);
    metaRows.push(`<tr><th>Availability</th><td>${p.available_quantity > 0 ? `${p.available_quantity} available` : (p.available_quantity === 0 ? 'Out of stock' : 'Contact us for availability')}</td></tr>`);
    metaRows.push(`<tr><th>Minimum Order</th><td>${p.min_order_quantity || 1}</td></tr>`);

    const inStock = p.available_quantity > 0 && !priceUnconfirmed;

    container.innerHTML = `
      <nav aria-label="Breadcrumb" class="breadcrumb">
        <a href="/">Home</a> / <a href="/${p.category}">${p.category}</a> / <span>${escapeHtml ? escapeHtml(p.name) : p.name}</span>
      </nav>
      ${p.is_demo ? '<div class="alert alert-info">This is a demonstration listing. Prices and stock quantities are unconfirmed. Contact us for current prices and availability.</div>' : ''}
      ${priceUnconfirmed && !p.is_demo ? '<div class="alert alert-info">Price not confirmed. Please contact us for current price and availability.</div>' : ''}
      <div class="product-detail">
        <div class="product-detail-image">
          <img src="${p.image_url || '/images/placeholder.svg'}" alt="${escapeHtml ? escapeHtml(p.name) : p.name}" onerror="this.parentElement.classList.add('fallback'); this.parentElement.textContent='';">
        </div>
        <div class="product-detail-info">
          <h1>${escapeHtml ? escapeHtml(p.name) : p.name}</h1>
            <div class="product-detail-price" data-unconfirmed="${priceUnconfirmed ? 'true' : 'false'}" style="${priceUnconfirmed ? 'color:#d97706;font-size:1.2rem;font-weight:600;' : ''}">${priceDisplay}</div>
          <p class="product-detail-desc">${escapeHtml ? escapeHtml(p.description || '') : (p.description || '')}</p>
          <table class="product-meta-table">${metaRows.join('')}</table>
          <div class="product-actions">
            <div class="qty-selector">
              <label for="qtyInput">Quantity:</label>
              <button type="button" class="qty-btn" onclick="changeQty(-1)" aria-label="Decrease quantity">-</button>
              <input type="number" id="qtyInput" value="${p.min_order_quantity || 1}" min="${p.min_order_quantity || 1}" max="${p.available_quantity || 999999}" ${!p.available_quantity ? 'disabled' : ''} aria-label="Quantity">
              <button type="button" class="qty-btn" onclick="changeQty(1)" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn btn-primary btn-full" id="addToCartBtn" ${priceUnconfirmed ? 'disabled title="Price not confirmed - request current price"' : (!inStock ? 'disabled' : '')} onclick="${priceUnconfirmed ? 'whatsappOrderHandler()' : 'addToCartHandler()'}">${priceUnconfirmed ? 'Request Current Price via WhatsApp' : (inStock ? 'Add to Cart' : 'Out of Stock')}</button>
            <button class="btn btn-whatsapp btn-full" id="waOrderBtn" onclick="whatsappOrderHandler()">Order on WhatsApp</button>
          </div>
          <p class="checkout-note" style="margin-top:10px;">Orders are confirmed by our team. Payment is arranged directly after order confirmation.</p>
        </div>
      </div>`;

    // Related products (same category)
    const related = document.createElement('section');
    related.className = 'related-products';
    related.setAttribute('aria-labelledby', 'related-title');
    related.innerHTML = `<h2 class="section-title" id="related-title">More ${escapeHtml(p.category)}</h2><div class="card-grid" id="relatedGrid"></div>`;
    container.appendChild(related);
    loadRelated(p);

    // Structured data (JSON-LD) only for accurate properties
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description || '',
      image: p.image_url ? [p.image_url] : [],
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: 'NGN',
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    });
    document.head.appendChild(ld);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to load product</h3>
        <p>Please refresh the page.</p>
      </div>`;
  }
}

function changeQty(delta) {
  const input = document.getElementById('qtyInput');
  if (!input || !currentProduct) return;
  let val = parseInt(input.value) + delta;
  val = Math.max(currentProduct.min_order_quantity, Math.min(currentProduct.available_quantity, val));
  input.value = val;
}

function addToCartHandler() {
  const input = document.getElementById('qtyInput');
  const qty = parseInt(input.value);
  if (qty < currentProduct.min_order_quantity) {
    showToast(`Minimum order is ${currentProduct.min_order_quantity}`);
    return;
  }
  if (qty > currentProduct.available_quantity) {
    showToast(`Only ${currentProduct.available_quantity} available`);
    return;
  }
  addToCart(currentProduct.product_id, qty);
  showToast('Added to cart!');
}

async function whatsappOrderHandler() {
  const qty = parseInt(document.getElementById('qtyInput').value);
  const config = await fetch('/api/config').then(r => r.json()).catch(() => ({}));
  const num = config.whatsappNumber || '';
  const p = currentProduct;
  const msg = `Hello Joy World Farm, I would like to order:\n\nProduct: ${p.name}\nQuantity: ${qty}\nPrice: ₦${p.price.toLocaleString()} each\nEstimated total: ₦${(p.price * qty).toLocaleString()}\n\nPlease confirm availability. Thank you!`;
  if (num) {
    window.open(getWhatsappUrl(num, msg), '_blank');
  } else {
    showToast('WhatsApp number not configured yet. Please use the contact page.');
  }
}

async function loadRelated(p) {
  const section = document.querySelector('.related-products');
  const grid = document.getElementById('relatedGrid');
  if (!section || !grid) return;
  try {
    const res = await fetch(`/api/products?category=${encodeURIComponent(p.category)}`);
    const data = await res.json();
    const items = (data.products || []).filter(x => x.product_id !== p.product_id).slice(0, 4);
    if (items.length === 0) { section.remove(); return; }
    grid.innerHTML = items.map(x => {
      const meta = [x.breed, x.age, x.size, x.quantity_unit].filter(Boolean).join(' · ');
      const inStock = x.available_quantity > 0;
      return `
        <div class="product-card">
          <div class="product-image">
            <img src="${escapeHtml(x.image_url || '/images/placeholder.svg')}" alt="${escapeHtml(x.name)}" loading="lazy" onerror="this.parentElement.textContent='🐓';">
            <div class="product-badge">${escapeHtml(x.subcategory ? x.subcategory.replace(/-/g, ' ') : x.category)}</div>
          </div>
          <div class="product-info">
            <div class="product-name">${escapeHtml(x.name)}</div>
            <div class="product-meta">${escapeHtml(meta)}</div>
            <div class="product-price">${formatNaira(x.price)}</div>
            <div class="card-actions">
              <button class="btn btn-primary btn-full" data-add="${escapeHtml(x.product_id)}" ${inStock ? '' : 'disabled'}>${inStock ? 'Add to Cart' : 'Out of Stock'}</button>
              <a href="/product?id=${encodeURIComponent(x.product_id)}" class="btn btn-outline btn-full">View Details</a>
            </div>
          </div>
        </div>`;
    }).join('');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      const item = items.find(x => x.product_id === btn.dataset.add);
      if (!item) return;
      addToCart(item.product_id, item.min_order_quantity);
      showToast(`Added ${item.name} to cart`);
    });
  } catch (err) {
    section.remove();
  }
}

document.addEventListener('DOMContentLoaded', loadProduct);
