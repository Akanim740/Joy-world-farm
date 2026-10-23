let allProducts = [];
let currentFilter = 'all';

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">🔍</div>
        <h3>No products found</h3>
        <p>Try a different filter or search term.</p>
      </div>`;
    return;
  }
  grid.innerHTML = products.map(p => {
    const meta = [p.breed, p.age, p.size, p.quantity_unit].filter(Boolean).join(' · ');
    const demo = p.is_demo ? '<span class="badge-demo">Demo</span>' : '';
    return `
      <div class="product-card">
        ${p.is_demo ? '<div class="demo-notice">Demonstration listing — pricing and stock unconfirmed</div>' : ''}
        <div class="product-image">
          <img src="${p.image_url || '/images/placeholder.svg'}" alt="${p.name}" loading="lazy" onerror="this.parentElement.textContent='🐓';">
          <div class="product-badge">${p.subcategory ? p.subcategory.replace(/-/g,' ') : p.category}</div>
        </div>
        <div class="product-info">
          <div class="product-name">${p.name} ${demo}</div>
          <div class="product-meta">${meta}</div>
          <div class="product-price">₦${p.price.toLocaleString()}</div>
          <div class="product-stock">Available: ${p.available_quantity}</div>
          <div class="card-actions">
            <button class="btn btn-primary btn-full" onclick="quickAdd('${p.product_id}', ${p.available_quantity}, ${p.min_order_quantity})">Add to Cart</button>
            <a href="/product?id=${p.product_id}" class="btn btn-outline btn-full">View Details</a>
            <button class="btn btn-whatsapp btn-full" onclick="whatsappOrder('${p.product_id}')">Order on WhatsApp</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function applyFilter() {
  let products = allProducts;
  if (currentFilter !== 'all') {
    products = products.filter(p => p.subcategory === currentFilter);
  }
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  if (search) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.breed && p.breed.toLowerCase().includes(search)) ||
      (p.description && p.description.toLowerCase().includes(search))
    );
  }
  renderProducts(products);
}

function quickAdd(productId, available, minOrder) {
  if (available < 1) {
    showToast('Sorry, this product is out of stock.');
    return;
  }
  addToCart(productId, minOrder || 1);
  showToast(`Added to cart! (min order: ${minOrder})`);
}

async function whatsappOrder(productId) {
  const p = allProducts.find(x => x.product_id === productId);
  if (!p) return;
  const config = await fetch('/api/config').then(r => r.json()).catch(() => ({}));
  const num = config.whatsappNumber || '';
  const msg = `Hello Joy World Farm, I am interested in:\n\n${p.name}\nPrice: ₦${p.price.toLocaleString()}\nProduct ID: ${p.product_id}\n\nPlease confirm availability and delivery to my area.`;
  if (num) {
    window.open(getWhatsappUrl(num, msg), '_blank');
  } else {
    showToast('WhatsApp number not configured yet. Please contact us directly.');
  }
}

function loadCategory(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      currentFilter = btn.dataset.filter;
      applyFilter();
    });
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', applyFilter);

  fetch(`/api/products?category=${category}`)
    .then(r => r.json())
    .then(data => {
      allProducts = data.products || [];
      renderProducts(allProducts);
    })
    .catch(() => {
      document.getElementById('productGrid').innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">⚠️</div>
          <h3>Failed to load products</h3>
          <p>Please refresh the page or try again later.</p>
        </div>`;
    });
}
