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
  const rows = cart.map((item, i) => {
    const p = cartProducts[item.productId];
    if (!p) {
      return `<tr data-id="${item.productId}"><td colspan="5">Product unavailable <button class="btn btn-danger" onclick="removeItem('${item.productId}')">Remove</button></td></tr>`;
    }
    const lineTotal = p.price * item.quantity;
    subtotal += lineTotal;
    return `
      <tr class="cart-row" data-id="${item.productId}">
        <td>
          <div class="cart-product">
            <img src="${p.image_url || '/images/placeholder.svg'}" alt="${p.name}" loading="lazy">
            <div>
              <strong>${p.name}</strong>
              ${p.is_demo ? '<span class="badge-demo">Demo</span>' : ''}
              <div class="product-meta">${[p.breed, p.age, p.size].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        </td>
        <td>₦${p.price.toLocaleString()}</td>
        <td>
          <div class="qty-controls">
            <button class="qty-btn" onclick="updateItemQty('${item.productId}', -1)" aria-label="Decrease quantity">−</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" onclick="updateItemQty('${item.productId}', 1)" aria-label="Increase quantity">+</button>
          </div>
          <div class="stock-hint">Max: ${p.available_quantity} | Min: ${p.min_order_quantity}</div>
        </td>
        <td>₦${lineTotal.toLocaleString()}</td>
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
      <div class="summary-row"><span>Subtotal</span><strong>₦${subtotal.toLocaleString()}</strong></div>
      <div class="summary-row"><span>Delivery fee</span><span>Confirmed at order processing</span></div>
      <div class="summary-row total"><span>Total (excl. delivery)</span><strong>₦${subtotal.toLocaleString()}</strong></div>
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
  if (newQty < p.min_order_quantity) {
    showToast(`Minimum order for ${p.name} is ${p.min_order_quantity}`);
    newQty = p.min_order_quantity;
  }
  if (newQty > p.available_quantity) {
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
