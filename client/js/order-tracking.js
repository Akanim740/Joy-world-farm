document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');
  const tokenInput = document.getElementById('trackingToken');
  const trackBtn = document.getElementById('trackBtn');
  const content = document.getElementById('trackingContent');

  if (tokenFromUrl) {
    tokenInput.value = tokenFromUrl;
    trackOrder(tokenFromUrl);
  }

  trackBtn.addEventListener('click', () => {
    trackOrder(tokenInput.value.trim());
  });

  async function trackOrder(token) {
    if (!token) return;
    content.innerHTML = '<p>Loading...</p>';
    try {
      const res = await fetch('/api/orders/track/' + encodeURIComponent(token));
      const data = await res.json();
      if (!data.success) {
        content.innerHTML = `<p style="color:red;">${data.message}</p><button class="btn btn-outline" onclick="location.reload()">Try Again</button>`;
        return;
      }
      const o = data.order;
      const events = data.deliveryEvents || [];
      const history = data.history || [];
      content.innerHTML = `
        <div style="background:#f9f9f9;padding:20px;border-radius:8px;margin-top:20px;">
          <h2>Order ${o.order_reference}</h2>
          <p><strong>Status:</strong> ${o.status}</p>
          <p><strong>Delivery Status:</strong> ${o.delivery_status}</p>
          <p><strong>Method:</strong> ${o.delivery_method || o.collection_preference}</p>
          ${o.delivery_zone_name ? `<p><strong>Zone:</strong> ${o.delivery_zone_name}</p>` : ''}
          ${o.delivery_date ? `<p><strong>Delivery Date:</strong> ${o.delivery_date} ${o.delivery_time_window || ''}</p>` : ''}
          ${o.delivery_person_name ? `<p><strong>Delivery Person:</strong> ${o.delivery_person_name} ${o.delivery_person_phone || ''}</p>` : ''}
          <p><strong>Total:</strong> ₦${Number(o.total).toLocaleString()}</p>
        </div>
        <h3 style="margin-top:30px;">Delivery Timeline</h3>
        <div style="border-left:2px solid #2d5f3b;padding-left:20px;margin-top:15px;">
          ${[...events, ...history].sort((a,b) => new Date(a.created_at || a.changed_at) - new Date(b.created_at || b.changed_at)).map(e => `
            <div style="margin-bottom:20px;position:relative;">
              <div style="position:absolute;left:-29px;width:16px;height:16px;background:#2d5f3b;border-radius:50%;"></div>
              <strong>${e.status || e.new_status}</strong>
              <p style="color:#666;margin:5px 0;">${e.message || e.note || ''}</p>
              <small style="color:#999;">${e.created_at || e.changed_at}</small>
            </div>
          `).join('') || '<p>No updates yet.</p>'}
        </div>
        <a href="/" class="btn btn-outline" style="margin-top:20px;">Back to Home</a>
      `;
    } catch (err) {
      content.innerHTML = '<p style="color:red;">Error loading tracking information.</p>';
    }
  }
});
