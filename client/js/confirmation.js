async function loadConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  const container = document.getElementById('confirmationContent');

  if (!ref) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Order reference not found</h3>
        <p>Please check your order reference or contact us directly.</p>
        <a href="/" class="btn btn-primary">Return Home</a>
      </div>`;
    return;
  }

  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(ref)}`);
    const data = await res.json();
    if (!data.success || !data.order) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Order not found</h3>
          <p>We could not find an order with reference <strong>${ref}</strong>.</p>
          <a href="/" class="btn btn-primary">Return Home</a>
        </div>`;
      return;
    }

    const o = data.order;
    const items = data.items;

    const config = await fetch('/api/config').then(r => r.json()).catch(() => ({}));
    const waNum = config.whatsappNumber || '';

    const waMsg = `Hello Joy World Farm, I placed order ${o.order_reference}.\n\n` +
      items.map(i => `- ${i.product_name} x ${i.quantity} (₦${i.subtotal.toLocaleString()})`).join('\n') +
      `\n\nSubtotal: ₦${o.subtotal.toLocaleString()}\nPlease confirm availability and next steps. Thank you!`;

    const waBtn = waNum
      ? `<a href="${getWhatsappUrl(waNum, waMsg)}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-full">Contact Us on WhatsApp About This Order</a>`
      : `<p class="wa-unavailable">WhatsApp number not configured yet. Please use the contact page.</p>`;

    container.innerHTML = `
      <div class="confirmation-card">
        <div class="confirm-icon">✅</div>
        <h1>Order Received!</h1>
        <p class="confirm-sub">Thank you, ${o.customer_name}. Your order has been recorded and is pending confirmation by our team.</p>

        <div class="alert alert-info">
          <strong>Order Reference:</strong> <span class="order-ref">${o.order_reference}</span><br>
          <strong>Status:</strong> ${o.status}<br>
          <strong>Note:</strong> This order has <em>not</em> been paid for. Our team will contact you to confirm the order and arrange payment.
        </div>

        <h2>Order Items</h2>
        <table class="order-items-table">
          <thead><tr><th>Product</th><th>Qty</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${items.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>₦${i.subtotal.toLocaleString()}</td></tr>`).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="summary-row"><span>Subtotal</span><strong>₦${o.subtotal.toLocaleString()}</strong></div>
          <div class="summary-row"><span>Delivery fee</span><span>Confirmed by our team</span></div>
          <div class="summary-row total"><span>Total (excl. delivery)</span><strong>₦${o.total.toLocaleString()}</strong></div>
        </div>

        <div class="confirm-details">
          <p><strong>Name:</strong> ${o.customer_name}</p>
          <p><strong>Phone:</strong> ${o.customer_phone}</p>
          <p><strong>City / Area:</strong> ${o.city}</p>
          <p><strong>Fulfilment:</strong> ${o.collection_preference === 'collection' ? 'Collection from farm' : 'Delivery'}</p>
          ${o.delivery_address ? `<p><strong>Address:</strong> ${o.delivery_address}</p>` : ''}
        </div>

        <div class="confirm-actions">
          ${waBtn}
          <a href="/order-tracking.html" class="btn btn-primary btn-full" style="margin-top:10px;" id="trackOrderBtn">Track Your Order</a>
          <a href="/" class="btn btn-outline btn-full" style="margin-top:10px;">Continue Shopping</a>
        </div>`;
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to load order</h3>
        <p>Please refresh the page.</p>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadConfirmation);
