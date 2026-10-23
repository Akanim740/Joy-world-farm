function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function logout() {
  try {
    await fetch('/api/admin/logout');
  } catch (e) {}
  window.location.href = '/admin/login';
}

async function guard() {
  try {
    const res = await fetch('/api/admin/dashboard');
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return false;
    }
    return true;
  } catch (e) {
    window.location.href = '/admin/login';
    return false;
  }
}

function initAdmin(page) {
  guard().then(ok => {
    if (!ok) return;
    if (page === 'dashboard') loadDashboard();
    if (page === 'products') loadProductsPage();
    if (page === 'orders') loadOrdersPage();
    if (page === 'enquiries') loadEnquiriesPage();
  });
}

/* ---------- Dashboard ---------- */
async function loadDashboard() {
  const res = await fetch('/api/admin/stats');
  const data = await res.json();
  const s = data.stats || {};

  const cards = [
    { label: 'Total Orders', value: s.totalOrders },
    { label: 'Pending', value: s.pendingOrders },
    { label: 'Confirmed', value: s.confirmedOrders },
    { label: 'Processing', value: s.processingOrders },
    { label: 'Completed', value: s.completedOrders },
    { label: 'Cancelled', value: s.cancelledOrders },
    { label: 'Active Products', value: s.totalProducts },
    { label: 'Wholesale Enquiries', value: s.totalEnquiries }
  ];
  document.getElementById('statsGrid').innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-value">${c.value || 0}</div>
      <div class="stat-label">${c.label}</div>
    </div>`).join('');

  const sales = data.sales || {};
  const salesGrid = document.getElementById('salesGrid');
  if (salesGrid) {
    salesGrid.innerHTML = `
      <div class="sales-card">
        <h3>Completed Revenue</h3>
        <p>From orders marked completed</p>
        <strong style="font-size:1.6rem;">${formatNaira(sales.completedRevenue || 0)}</strong>
      </div>
      <div class="sales-card">
        <h3>Potential Revenue</h3>
        <p>All active (non-cancelled) orders</p>
        <strong style="font-size:1.6rem;">${formatNaira(sales.potentialRevenue || 0)}</strong>
      </div>
      <div class="sales-card">
        <h3>Orders In Progress</h3>
        <p>Pending, confirmed &amp; processing</p>
        <strong style="font-size:1.6rem;">${(s.pendingOrders || 0) + (s.confirmedOrders || 0) + (s.processingOrders || 0)}</strong>
      </div>`;
  }

  const orders = data.recentOrders || [];
  document.getElementById('recentOrdersBody').innerHTML = orders.length === 0
    ? '<tr><td colspan="5">No orders yet.</td></tr>'
    : orders.map(o => `
      <tr>
        <td><a href="/admin/orders?ref=${encodeURIComponent(o.order_reference)}" style="color:var(--primary); font-weight:600;">${escapeHtml(o.order_reference)}</a></td>
        <td>${escapeHtml(o.customer_name)}</td>
        <td>${formatNaira(o.total)}</td>
        <td><span class="badge-status ${o.status.toLowerCase().split(' ')[0]}">${escapeHtml(o.status)}</span></td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
      </tr>`).join('');
}

/* ---------- Products ---------- */
async function loadProductsPage() {
  const res = await fetch('/api/admin/products');
  const data = await res.json();
  const body = document.getElementById('productsBody');
  const products = data.products || [];
  body.innerHTML = products.length === 0
    ? '<tr><td colspan="6">No products yet.</td></tr>'
    : products.map(p => `
      <tr>
        <td>${p.name} ${p.is_demo ? '<span class="demo-badge">Demo</span>' : ''}</td>
        <td>${p.category}${p.subcategory ? ' / ' + p.subcategory : ''}</td>
        <td>₦${p.price.toLocaleString()}</td>
        <td>${p.available_quantity}</td>
        <td>${p.is_active ? 'Active' : 'Inactive'}</td>
        <td class="actions">
          <button class="outline" onclick='editProduct(${JSON.stringify(p)})'>Edit</button>
          <button class="${p.is_active ? 'danger' : 'primary'}" onclick="toggleProduct(${p.id}, ${p.is_active})">${p.is_active ? 'Deactivate' : 'Activate'}</button>
        </td>
      </tr>`).join('');

  document.getElementById('productForm').addEventListener('submit', saveProduct);
}

function editProduct(p) {
  document.getElementById('formTitle').textContent = 'Edit Product';
  document.getElementById('productId').value = p.id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pSubcategory').value = p.subcategory || '';
  document.getElementById('pBreed').value = p.breed || '';
  document.getElementById('pAge').value = p.age || '';
  document.getElementById('pSize').value = p.size || '';
  document.getElementById('pUnit').value = p.quantity_unit || '';
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pQuantity').value = p.available_quantity;
  document.getElementById('pMinOrder').value = p.min_order_quantity;
  document.getElementById('pDescription').value = p.description || '';
  document.getElementById('pActive').checked = !!p.is_active;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetProductForm() {
  document.getElementById('formTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('pActive').checked = true;
}

async function saveProduct(e) {
  e.preventDefault();
  const msgBox = document.getElementById('productFormMsg');
  const btn = document.getElementById('productSubmitBtn');
  msgBox.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const id = document.getElementById('productId').value;
  const formData = new FormData();
  formData.append('name', document.getElementById('pName').value.trim());
  formData.append('category', document.getElementById('pCategory').value);
  formData.append('subcategory', document.getElementById('pSubcategory').value);
  formData.append('breed', document.getElementById('pBreed').value.trim());
  formData.append('age', document.getElementById('pAge').value.trim());
  formData.append('size', document.getElementById('pSize').value.trim());
  formData.append('quantity_unit', document.getElementById('pUnit').value.trim());
  formData.append('price', document.getElementById('pPrice').value);
  formData.append('availableQuantity', document.getElementById('pQuantity').value);
  formData.append('minOrderQuantity', document.getElementById('pMinOrder').value);
  formData.append('description', document.getElementById('pDescription').value.trim());
  formData.append('isActive', document.getElementById('pActive').checked);
  const file = document.getElementById('pImage').files[0];
  if (file) formData.append('image', file);

  try {
    const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Product updated' : 'Product created');
      resetProductForm();
      loadProductsPage();
    } else {
      msgBox.hidden = false;
      msgBox.className = 'alert alert-danger';
      msgBox.textContent = data.message || (data.errors && data.errors.map(x => x.msg).join('; ')) || 'Failed to save';
    }
  } catch (err) {
    msgBox.hidden = false;
    msgBox.className = 'alert alert-danger';
    msgBox.textContent = 'Network error';
  }
  btn.disabled = false;
  btn.textContent = 'Save Product';
}

async function toggleProduct(id, isActive) {
  if (isActive && !confirm('Deactivate this product? It will no longer appear on the website.')) return;
  const res = await fetch(`/api/admin/products/${id}/toggle`, { method: 'POST' });
  const data = await res.json();
  if (data.success) {
    showToast(isActive ? 'Product deactivated' : 'Product activated');
    loadProductsPage();
  }
}

/* ---------- Orders ---------- */
let allOrders = [];
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Ready for collection or dispatch', 'Completed', 'Cancelled'];

async function loadOrdersPage() {
  const res = await fetch('/api/admin/orders');
  const data = await res.json();
  allOrders = data.orders || [];

  const search = document.getElementById('orderSearch');
  const statusFilter = document.getElementById('orderStatusFilter');
  if (search && !search.dataset.bound) {
    search.addEventListener('input', renderOrders);
    search.dataset.bound = '1';
  }
  if (statusFilter && !statusFilter.dataset.bound) {
    statusFilter.addEventListener('change', renderOrders);
    statusFilter.dataset.bound = '1';
  }

  renderOrders();

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    const target = allOrders.find(o => o.order_reference === ref);
    if (target) viewOrder(target.id);
  }
}

function renderOrders() {
  const body = document.getElementById('ordersBody');
  if (!body) return;

  const q = (document.getElementById('orderSearch')?.value || '').trim().toLowerCase();
  const status = document.getElementById('orderStatusFilter')?.value || '';

  let orders = allOrders;
  if (status) orders = orders.filter(o => o.status === status);
  if (q) {
    orders = orders.filter(o =>
      (o.order_reference || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q)
    );
  }

  const countEl = document.getElementById('ordersCount');
  if (countEl) countEl.textContent = `${orders.length} of ${allOrders.length} order(s)`;

  body.innerHTML = orders.length === 0
    ? '<tr><td colspan="8">No orders match.</td></tr>'
    : orders.map(o => `
      <tr>
        <td style="font-weight:600;">${escapeHtml(o.order_reference)}</td>
        <td>${escapeHtml(o.customer_name)}</td>
        <td>${escapeHtml(o.customer_phone)}</td>
        <td>${escapeHtml(o.city || '')}</td>
        <td>${formatNaira(o.total)}</td>
        <td>
          <select onchange="updateOrderStatus(${o.id}, this.value)" aria-label="Change status for ${escapeHtml(o.order_reference)}">
            ${ORDER_STATUSES.map(s =>
              `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td class="actions">
          <button class="primary" onclick="viewOrder(${o.id})">View</button>
          <button class="outline" onclick="messageCustomer(${o.id})">WhatsApp</button>
        </td>
      </tr>`).join('');
}

function messageCustomer(orderId) {
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;
  const digits = String(o.customer_phone || '').replace(/[^0-9]/g, '');
  if (digits.length < 7) {
    showToast('No valid phone number for this order', 'error');
    return;
  }
  const msg = `Hello ${o.customer_name}, this is Joy World Farm regarding your order ${o.order_reference}. `;
  window.open(getWhatsappUrl(o.customer_phone, msg), '_blank');
}

async function updateOrderStatus(id, status) {
  const res = await fetch(`/api/admin/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (data.success) {
    showToast('Status updated to ' + status);
    loadOrdersPage();
  } else {
    showToast(data.message || 'Failed to update status', 'error');
  }
}

async function viewOrder(id) {
  const res = await fetch(`/api/admin/orders/${id}`);
  const data = await res.json();
  if (!data.success) return;
  const o = data.order;
  const items = data.items || [];
  const waDigits = String(o.customer_phone || '').replace(/[^0-9]/g, '');
  const waBtn = waDigits.length >= 7
    ? `<a class="btn btn-whatsapp" style="margin-bottom:16px;" href="${getWhatsappUrl(o.customer_phone, 'Hello ' + o.customer_name + ', this is Joy World Farm regarding your order ' + o.order_reference + '.')}" target="_blank" rel="noopener">Message customer on WhatsApp</a>`
    : '';
  document.getElementById('orderDetail').innerHTML = `
    <div class="order-detail-panel">
      <h2>Order ${escapeHtml(o.order_reference)}</h2>
      ${waBtn}
      <dl>
        <dt>Customer</dt><dd>${escapeHtml(o.customer_name)}</dd>
        <dt>Phone</dt><dd>${escapeHtml(o.customer_phone)}</dd>
        <dt>Email</dt><dd>${escapeHtml(o.customer_email || '—')}</dd>
        <dt>City / Area</dt><dd>${escapeHtml(o.city || '')}</dd>
        <dt>Fulfilment</dt><dd>${o.collection_preference === 'collection' ? 'Collection from farm' : 'Delivery'}</dd>
        ${o.delivery_address ? `<dt>Address</dt><dd>${escapeHtml(o.delivery_address)}</dd>` : ''}
        ${o.customer_notes ? `<dt>Notes</dt><dd>${escapeHtml(o.customer_notes)}</dd>` : ''}
        <dt>Subtotal</dt><dd>${formatNaira(o.subtotal)}</dd>
        <dt>Delivery Fee</dt><dd>${formatNaira(o.delivery_fee)}</dd>
        <dt>Total</dt><dd><strong>${formatNaira(o.total)}</strong></dd>
        <dt>Status</dt><dd><span class="badge-status ${o.status.toLowerCase().split(' ')[0]}">${escapeHtml(o.status)}</span></dd>
        <dt>Placed</dt><dd>${new Date(o.created_at).toLocaleString()}</dd>
      </dl>
      <h3 style="color:var(--primary); margin:20px 0 10px;">Items</h3>
      <table class="admin-table">
        <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${items.map(i => `<tr><td>${escapeHtml(i.product_name)}</td><td>${formatNaira(i.product_price)}</td><td>${i.quantity}</td><td>${formatNaira(i.subtotal)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  document.getElementById('orderDetail').scrollIntoView({ behavior: 'smooth' });
}

/* ---------- Enquiries ---------- */
let allEnquiries = [];
const ENQUIRY_STATUSES = ['New', 'Contacted', 'Closed'];

async function loadEnquiriesPage() {
  const res = await fetch('/api/admin/enquiries');
  const data = await res.json();
  allEnquiries = data.enquiries || [];
  document.getElementById('enquiriesBody').innerHTML = allEnquiries.length === 0
    ? '<tr><td colspan="9">No enquiries yet.</td></tr>'
    : allEnquiries.map(e => `
      <tr>
        <td>${escapeHtml(e.customer_name)}</td>
        <td>${escapeHtml(e.customer_phone)}</td>
        <td>${escapeHtml(e.business_name || '—')}</td>
        <td>${escapeHtml(e.products_required || '—')}</td>
        <td>${escapeHtml(e.estimated_quantity || '—')}</td>
        <td>${escapeHtml(e.notes || '—')}</td>
        <td>${new Date(e.created_at).toLocaleDateString()}</td>
        <td><span class="badge-status">${escapeHtml(e.status || 'New')}</span></td>
        <td class="actions">
          <select onchange="updateEnquiryStatus(${e.id}, this.value)" aria-label="Change enquiry status">
            ${ENQUIRY_STATUSES.map(s =>
              `<option value="${s}" ${(e.status || 'New') === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="outline" onclick="messageEnquiry(${e.id})">WhatsApp</button>
        </td>
      </tr>`).join('');
}

async function updateEnquiryStatus(id, status) {
  const res = await fetch(`/api/admin/enquiries/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (data.success) {
    showToast('Enquiry marked ' + status);
    loadEnquiriesPage();
  } else {
    showToast(data.message || 'Failed to update enquiry', 'error');
  }
}

function messageEnquiry(id) {
  const e = allEnquiries.find(x => x.id === id);
  if (!e) return;
  const digits = String(e.customer_phone || '').replace(/[^0-9]/g, '');
  if (digits.length < 7) {
    showToast('No valid phone number for this enquiry', 'error');
    return;
  }
  const msg = `Hello ${e.customer_name}, this is Joy World Farm following up on your wholesale enquiry. `;
  window.open(getWhatsappUrl(e.customer_phone, msg), '_blank');
}
