function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

let cartProducts = {};

async function loadCart() {
  const cart = getCart();
  const container = document.getElementById('cartContent');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Browse our products and add items to your cart.</p>
        <a href="/chicks" class="btn btn-primary">Shop Chicks</a>
      </div>`;
    return;
  }

  // Fetch product details for cart items
  const details = await Promise.all(
    cart.map(item =>
      fetch(`/api/products/${item.productId}`)
        .then(r => r.json())
        .then(data => data.product)
        .catch(() => null)
    )
  );

  cartProducts = {};
  details.forEach(p => { if (p) cartProducts[p.product_id] = p; });

  let subtotal = 0;
  let hasUnconfirmed = false;
  const rows = cart.map((item, i) => {
    const p = cartProducts[item.productId];
    if (!p) {
      return `<tr data-id="${item.productId}"><td colspan="5">Product unavailable <button class="btn btn-danger" onclick="removeItem('${item.productId}')">Remove</button></td></tr>`;
    }
    const priceNum = Number(p.price);
    const priceUnconfirmed = p.is_demo || priceNum === 0 || priceNum === null || priceNum === undefined;
    if (priceUnconfirmed) hasUnconfirmed = true;
    const lineTotal = priceUnconfirmed ? NaN : (priceNum * item.quantity);
    if (!priceUnconfirmed) subtotal += lineTotal;
    const priceDisplay = priceUnconfirmed ? '<span style="color:#d97706;">Request current price</span>' : `₦${priceNum.toLocaleString()}`;
    const lineDisplay = priceUnconfirmed ? '<span style="color:#d97706;">Request current price</span>' : `₦${lineTotal.toLocaleString()}`;
    return `
      <tr class="cart-row" data-id="${item.productId}">
        <td>
          <div class="cart-product">
            <img src="${p.image_url || '/images/placeholder.svg'}" alt="${escapeHtml ? escapeHtml(p.name) : p.name}" loading="lazy">
            <div>
              <strong>${escapeHtml ? escapeHtml(p.name) : p.name}</strong>
              ${p.is_demo ? '<span class="badge-demo">Demo</span>' : ''}
              <div class="product-meta">${[p.breed, p.age, p.size].filter(Boolean).join(' • ')}</div>
            </div>
          </div>
        </td>
        <td>${priceDisplay}</td>
        <td>
          <div class="qty-controls">
            <button class="qty-btn" onclick="updateItemQty('${item.productId}', -1)" aria-label="Decrease quantity">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" onclick="updateItemQty('${item.productId}', 1)" aria-label="Increase quantity">+</button>
          </div>
          <div class="stock-hint">Max: ${p.available_quantity != null ? p.available_quantity : 'N/A'} | Min: ${p.min_order_quantity || 1}</div>
        </td>
        <td>${lineDisplay}</td>
        <td><button class="btn btn-danger" onclick="removeItem('${item.productId}')">Remove</button></td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="cart-table-wrap">
      <table class="cart-table">
        <thead>
          <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th>Action</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="cart-summary">
      <h3>Order Summary</h3>
      ${hasUnconfirmed ? '<p style="color:#d97706;margin-bottom:10px;">Some items have unconfirmed prices. Totals will be confirmed by our team.</p>' : ''}
      <div class="summary-row"><span>Subtotal</span><strong>${hasUnconfirmed ? 'To be confirmed' : `₦${subtotal.toLocaleString()}`}</strong></div>
      <div class="summary-row"><span>Delivery fee</span><span>Confirmed at order processing</span></div>
      <div class="summary-row total"><span>Total</span><strong>${hasUnconfirmed ? 'To be confirmed' : `₦${subtotal.toLocaleString()}`}</strong></div>
      <p class="summary-note">Final total and any delivery fee will be confirmed by our team after your order is reviewed.</p>
      <a href="/checkout" class="btn btn-primary btn-full">Proceed to Checkout</a>
      <a href="/chicks" class="btn btn-outline btn-full" style="margin-top:10px;">Continue Shopping</a>
    </div>`;
}

function updateItemQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.productId == productId);
  if (!item) return;
  const p = cartProducts[productId];
  if (!p) return;
  let newQty = item.quantity + delta;
  const minQty = p.min_order_quantity || 1;
  if (newQty < minQty) {
    showToast(`Minimum order for ${p.name} is ${minQty}`);
    newQty = minQty;
  }
  if (p.available_quantity != null && newQty > p.available_quantity) {
    showToast(`Only ${p.available_quantity} available for ${p.name}`);
    newQty = p.available_quantity;
  }
  updateCart(productId, newQty);
  loadCart();
}

function removeItem(productId) {
  removeFromCart(productId);
  showToast('Item removed from cart');
  loadCart();
}

document.addEventListener('DOMContentLoaded', loadCart);
