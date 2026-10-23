function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

let cartDetails = [];
let cartSubtotal = 0;

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

        <div id="deliveryFields">
          <div class="form-group">
            <label for="deliveryZone">Delivery Zone *</label>
            <select id="deliveryZone" name="deliveryZone" class="form-control">
              <option value="">Select your delivery area</option>
            </select>
            <span class="field-hint" id="zoneHint"></span>
            <span class="field-error" id="err-zone"></span>
          </div>

          <div class="form-group" id="addressGroup">
            <label for="deliveryAddress">Street Address *</label>
            <textarea id="deliveryAddress" name="deliveryAddress" class="form-control" rows="2" maxlength="500" placeholder="House number, street name"></textarea>
            <span class="field-error" id="err-address"></span>
          </div>

          <div class="form-group">
            <label for="deliveryLandmark">Nearest Landmark</label>
            <input type="text" id="deliveryLandmark" name="deliveryLandmark" class="form-control" maxlength="200" placeholder="e.g. Beside Market Junction">
          </div>

          <div class="form-group">
            <label for="state">State *</label>
            <input type="text" id="state" name="state" class="form-control" maxlength="100" value="Rivers State" required>
            <span class="field-error" id="err-state"></span>
          </div>

          <div class="form-group">
            <label for="city">City / Area *</label>
            <input type="text" id="city" name="city" class="form-control" maxlength="100" placeholder="e.g. Port Harcourt, GRA">
            <span class="field-error" id="err-city"></span>
          </div>

          <div class="form-group">
            <label for="preferredDeliveryDate">Preferred Delivery Date</label>
            <input type="date" id="preferredDeliveryDate" name="preferredDeliveryDate" class="form-control">
            <span class="field-hint">We will confirm availability for your selected date.</span>
          </div>

          <div class="form-group">
            <label for="preferredTimeWindow">Preferred Time Window</label>
            <select id="preferredTimeWindow" name="preferredTimeWindow" class="form-control">
              <option value="">No preference</option>
              <option value="Morning (8am - 12pm)">Morning (8am - 12pm)</option>
              <option value="Afternoon (12pm - 4pm)">Afternoon (12pm - 4pm)</option>
              <option value="Evening (4pm - 7pm)">Evening (4pm - 7pm)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="recipientName">Recipient Name (if different)</label>
            <input type="text" id="recipientName" name="recipientName" class="form-control" maxlength="100">
          </div>

          <div class="form-group">
            <label for="recipientPhone">Recipient Phone</label>
            <input type="tel" id="recipientPhone" name="recipientPhone" class="form-control" maxlength="20">
            <span class="field-error" id="err-recipientPhone"></span>
          </div>

          <div class="form-group">
            <label for="deliveryInstructions">Delivery Instructions</label>
            <textarea id="deliveryInstructions" name="deliveryInstructions" class="form-control" rows="2" maxlength="500" placeholder="Gate code, call on arrival, etc."></textarea>
          </div>
        </div>

        <div class="form-group">
          <label for="customerNotes">Order Notes (optional)</label>
          <textarea id="customerNotes" name="customerNotes" class="form-control" rows="3" maxlength="500" placeholder="Any other information about your order..."></textarea>
        </div>

        <div id="formErrors" class="alert alert-danger" hidden></div>

        <button type="submit" class="btn btn-primary btn-full" id="submitBtn">Place Order</button>
        <p class="checkout-note">Your order will be recorded and confirmed by our team. Payment is arranged directly after confirmation �?" no online payment is taken at this step. For live animals, delivery is subject to availability and weather conditions.</p>
      </form>

      <aside class="checkout-summary" aria-label="Order summary">
        <h2>Order Summary</h2>
        <div class="summary-items">${summaryRows}</div>
        <div class="summary-row total"><span>Subtotal</span><strong>�,�${subtotal.toLocaleString()}</strong></div>
        <div class="summary-row"><span>Delivery fee</span><span id="deliveryFeeDisplay">Select a zone</span></div>
        <div class="summary-row total"><span>Estimated Total</span><strong id="grandTotalDisplay">�,�${subtotal.toLocaleString()}</strong></div>
        <p class="summary-note">Total is calculated on our server using current product prices. Delivery fees shown are estimates and will be confirmed before payment.</p>
      </aside>
    </div>`;

  cartSubtotal = subtotal;
  document.getElementById('checkoutForm').addEventListener('submit', submitOrder);
  await loadDeliveryZones(subtotal);
}

async function loadDeliveryZones(subtotal) {
  const select = document.getElementById('deliveryZone');
  if (!select) return;
  try {
    const res = await fetch('/api/delivery/zones');
    const data = await res.json();
    const zones = data.zones || [];
    if (zones.length === 0) {
      select.innerHTML = '<option value="">Delivery areas to be confirmed - contact us</option>';
      document.getElementById('zoneHint').textContent = 'Contact us to confirm delivery availability and fees.';
      return;
    }
    select.innerHTML = '<option value="">Select your delivery area</option>' + zones.map(z =>
      `<option value="${z.id}" data-fee="${z.delivery_fee}" data-name="${z.zone_name}">${z.zone_name} - �,�${Number(z.delivery_fee).toLocaleString()}</option>`
    ).join('');
    select.addEventListener('change', () => {
      const selected = select.options[select.selectedIndex];
      const fee = Number(selected.dataset.fee || 0);
      const hint = document.getElementById('zoneHint');
      const feeDisplay = document.getElementById('deliveryFeeDisplay');
      const grandDisplay = document.getElementById('grandTotalDisplay');
      if (!select.value) {
        feeDisplay.textContent = 'Select a zone';
        grandDisplay.textContent = '�,�' + subtotal.toLocaleString();
        hint.textContent = '';
      } else {
        feeDisplay.textContent = '�,�' + fee.toLocaleString();
        grandDisplay.textContent = '�,�' + (subtotal + fee).toLocaleString();
        hint.textContent = 'Estimated delivery fee for ' + selected.dataset.name + '. Confirmed before payment.';
      }
    });
  } catch (err) {
    select.innerHTML = '<option value="">Unable to load zones</option>';
  }
}

function toggleAddress(show) {
  const fields = document.getElementById('deliveryFields');
  if (fields) fields.style.display = show ? 'block' : 'none';
  const addr = document.getElementById('deliveryAddress');
  const state = document.getElementById('state');
  if (show) {
    if (addr) addr.setAttribute('required', 'required');
    if (state) state.setAttribute('required', 'required');
  } else {
    if (addr) addr.removeAttribute('required');
    if (state) state.removeAttribute('required');
    const feeDisplay = document.getElementById('deliveryFeeDisplay');
    if (feeDisplay) feeDisplay.textContent = 'No delivery fee (collection)';
    const grand = document.getElementById('grandTotalDisplay');
    if (grand) grand.textContent = '�,�' + cartSubtotal.toLocaleString();
  }
}

async function submitOrder(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const errorsBox = document.getElementById('formErrors');

  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  errorsBox.hidden = true;
  errorsBox.innerHTML = '';

  const isDelivery = form.collectionPreference.value === 'delivery';
  const payload = {
    customerName: form.customerName.value.trim(),
    customerPhone: form.customerPhone.value.trim(),
    customerEmail: form.customerEmail.value.trim() || undefined,
    deliveryAddress: isDelivery ? form.deliveryAddress.value.trim() || undefined : undefined,
    collectionPreference: form.collectionPreference.value,
    deliveryMethod: isDelivery ? 'delivery' : 'farm_collection',
    city: form.city.value.trim(),
    state: form.state.value.trim() || 'Rivers State',
    deliveryArea: isDelivery && form.deliveryZone.value ? form.deliveryZone.options[form.deliveryZone.selectedIndex].dataset.name : undefined,
    deliveryZoneId: isDelivery && form.deliveryZone.value ? Number(form.deliveryZone.value) : undefined,
    deliveryLandmark: isDelivery ? form.deliveryLandmark.value.trim() || undefined : undefined,
    deliveryInstructions: isDelivery ? form.deliveryInstructions.value.trim() || undefined : undefined,
    recipientName: isDelivery ? form.recipientName.value.trim() || undefined : undefined,
    recipientPhone: isDelivery ? form.recipientPhone.value.trim() || undefined : undefined,
    preferredDeliveryDate: isDelivery ? form.preferredDeliveryDate.value || undefined : undefined,
    preferredTimeWindow: isDelivery ? form.preferredTimeWindow.value || undefined : undefined,
    customerNotes: form.customerNotes.value.trim() || undefined,
    cartItems: cartDetails
  };

  let hasErrors = false;
  if (!payload.customerName) { document.getElementById('err-customerName').textContent = 'Name is required'; hasErrors = true; }
  if (!payload.customerPhone || !/^[0-9+\-\s()]{7,20}$/.test(payload.customerPhone)) { document.getElementById('err-customerPhone').textContent = 'Valid phone number is required'; hasErrors = true; }
  if (!payload.city) { document.getElementById('err-city').textContent = 'City / area is required'; hasErrors = true; }
  if (isDelivery && !payload.state) { document.getElementById('err-state').textContent = 'State is required'; hasErrors = true; }
  if (isDelivery && !payload.deliveryAddress) { document.getElementById('err-address').textContent = 'Street address is required for delivery'; hasErrors = true; }
  if (isDelivery && !payload.deliveryZoneId) { document.getElementById('err-zone').textContent = 'Please select a delivery zone, or contact us if your area is not listed'; hasErrors = true; }
  if (payload.recipientPhone && !/^[0-9+\-\s()]{7,20}$/.test(payload.recipientPhone)) { document.getElementById('err-recipientPhone').textContent = 'Invalid recipient phone'; hasErrors = true; }

  if (hasErrors || payload.cartItems.length === 0) {
    errorsBox.hidden = false;
    errorsBox.textContent = 'Please correct the errors above.';
    return;
  }

  if (submitBtn.disabled) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing order…';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      clearCart();
      if (data.trackingToken) localStorage.setItem('lastOrderToken', data.trackingToken);
      window.location.href = `/order-confirmation?ref=${encodeURIComponent(data.orderReference || data.reference)}`;
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
