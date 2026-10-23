function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

let cartDetails = [];

async function initCheckout() {
  const cart = getCart();
  const container = document.getElementById('checkoutContent');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add products to your cart before checking out.</p>
        <a href="/chicks" class="btn btn-primary">Shop Products</a>
      </div>`;
    return;
  }

  const details = await Promise.all(
    cart.map(item =>
      fetch(`/api/products/${item.productId}`)
        .then(r => r.json())
        .then(data => data.product)
        .catch(() => null)
    )
  );

  cartDetails = [];
  let subtotal = 0;
  const summaryRows = cart.map((item, i) => {
    const p = details[i];
    if (!p) return '';
    const line = p.price * item.quantity;
    subtotal += line;
    cartDetails.push({ productId: p.id, quantity: item.quantity, name: p.name });
    return `
      <div class="summary-item">
        <span>${p.name} × ${item.quantity}</span>
        <span>₦${line.toLocaleString()}</span>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="checkout-grid">
      <form id="checkoutForm" class="checkout-form" novalidate>
        <h2>Delivery Information</h2>

        <div class="form-group">
          <label for="customerName">Full Name *</label>
          <input type="text" id="customerName" name="customerName" class="form-control" required maxlength="100" autocomplete="name">
          <span class="field-error" id="err-customerName"></span>
        </div>

        <div class="form-group">
          <label for="customerPhone">Phone Number *</label>
          <input type="tel" id="customerPhone" name="customerPhone" class="form-control" required maxlength="20" placeholder="e.g. 08031234567" autocomplete="tel">
          <span class="field-error" id="err-customerPhone"></span>
        </div>

        <div class="form-group">
          <label for="customerEmail">Email (optional)</label>
          <input type="email" id="customerEmail" name="customerEmail" class="form-control" maxlength="100" autocomplete="email">
        </div>

        <fieldset class="form-group">
          <legend>Fulfilment Preference *</legend>
          <label class="radio-label">
            <input type="radio" name="collectionPreference" value="delivery" checked onchange="toggleAddress(true)"> Delivery
          </label>
          <label class="radio-label">
            <input type="radio" name="collectionPreference" value="collection" onchange="toggleAddress(false)"> Collection from farm
          </label>
        </fieldset>

        <div class="form-group" id="addressGroup">
          <label for="deliveryAddress">Delivery Address</label>
          <textarea id="deliveryAddress" name="deliveryAddress" class="form-control" rows="3" maxlength="500"></textarea>
        </div>

        <div class="form-group">
          <label for="city">City / Area *</label>
          <input type="text" id="city" name="city" class="form-control" required maxlength="100" placeholder="e.g. Port Harcourt, GRA">
          <span class="field-error" id="err-city"></span>
        </div>

        <div class="form-group">
          <label for="customerNotes">Notes (optional)</label>
          <textarea id="customerNotes" name="customerNotes" class="form-control" rows="3" maxlength="500" placeholder="Any special instructions..."></textarea>
        </div>

        <div id="formErrors" class="alert alert-danger" hidden></div>

        <button type="submit" class="btn btn-primary btn-full" id="submitBtn">Place Order</button>
        <p class="checkout-note">Your order will be recorded and confirmed by our team. Payment is arranged directly after confirmation — no online payment is taken at this step.</p>
      </form>

      <aside class="checkout-summary" aria-label="Order summary">
        <h2>Order Summary</h2>
        <div class="summary-items">${summaryRows}</div>
        <div class="summary-row total"><span>Subtotal</span><strong>₦${subtotal.toLocaleString()}</strong></div>
        <div class="summary-row"><span>Delivery fee</span><span>Confirmed after review</span></div>
        <p class="summary-note">Total is calculated on our server using current product prices. Any delivery fee will be disclosed before payment.</p>
      </aside>
    </div>`;

  document.getElementById('checkoutForm').addEventListener('submit', submitOrder);
}

function toggleAddress(show) {
  const group = document.getElementById('addressGroup');
  group.style.display = show ? 'block' : 'none';
  const addr = document.getElementById('deliveryAddress');
  if (show) addr.setAttribute('required', 'required');
  else addr.removeAttribute('required');
}

async function submitOrder(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const errorsBox = document.getElementById('formErrors');

  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  errorsBox.hidden = true;
  errorsBox.innerHTML = '';

  const payload = {
    customerName: form.customerName.value.trim(),
    customerPhone: form.customerPhone.value.trim(),
    customerEmail: form.customerEmail.value.trim() || undefined,
    deliveryAddress: form.deliveryAddress.value.trim() || undefined,
    collectionPreference: form.collectionPreference.value,
    city: form.city.value.trim(),
    customerNotes: form.customerNotes.value.trim() || undefined,
    cartItems: cartDetails
  };

  let hasErrors = false;
  if (!payload.customerName) { document.getElementById('err-customerName').textContent = 'Name is required'; hasErrors = true; }
  if (!payload.customerPhone || !/^[0-9+\-\s()]{7,20}$/.test(payload.customerPhone)) { document.getElementById('err-customerPhone').textContent = 'Valid phone number is required'; hasErrors = true; }
  if (!payload.city) { document.getElementById('err-city').textContent = 'City / area is required'; hasErrors = true; }
  if (payload.collectionPreference === 'delivery' && !payload.deliveryAddress) { document.getElementById('err-address').textContent = 'Delivery address is required for delivery'; hasErrors = true; }

  if (hasErrors || payload.cartItems.length === 0) {
    errorsBox.hidden = false;
    errorsBox.textContent = 'Please correct the errors above.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing order…';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      clearCart();
      window.location.href = `/order-confirmation?ref=${encodeURIComponent(data.orderReference)}`;
    } else {
      errorsBox.hidden = false;
      errorsBox.textContent = data.message || (data.errors && data.errors.map(e => e.msg).join('; ')) || 'Failed to place order. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Order';
    }
  } catch (err) {
    errorsBox.hidden = false;
    errorsBox.textContent = 'Network error. Please check your connection and try again.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
  }
}

document.addEventListener('DOMContentLoaded', initCheckout);
