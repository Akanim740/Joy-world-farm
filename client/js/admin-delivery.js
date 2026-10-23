document.addEventListener('DOMContentLoaded', () => {
  loadZones();
  loadOrders();

  document.getElementById('addZoneBtn').addEventListener('click', () => {
    document.getElementById('zoneModalTitle').textContent = 'Add Delivery Zone';
    document.getElementById('zoneId').value = '';
    document.getElementById('zoneForm').reset();
    document.getElementById('zoneActive').checked = true;
    document.getElementById('zoneModal').style.display = 'flex';
  });
  document.getElementById('cancelZone').addEventListener('click', () => {
    document.getElementById('zoneModal').style.display = 'none';
  });
  document.getElementById('cancelDelivery').addEventListener('click', () => {
    document.getElementById('deliveryModal').style.display = 'none';
  });

  document.getElementById('zoneForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('zoneId').value;
    const payload = {
      zoneName: document.getElementById('zoneName').value,
      cityArea: document.getElementById('zoneArea').value,
      description: document.getElementById('zoneDesc').value,
      deliveryFee: document.getElementById('zoneFee').value,
      estimatedTimeframe: document.getElementById('zoneTime').value,
      minimumOrderAmount: document.getElementById('zoneMin').value,
      active: document.getElementById('zoneActive').checked,
      specialNotes: document.getElementById('zoneNotes').value
    };
    const url = id ? `/api/admin/delivery-zones/${id}` : '/api/admin/delivery-zones';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      document.getElementById('zoneModal').style.display = 'none';
      loadZones();
    }
  });

  document.getElementById('deliveryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('deliveryOrderId').value;
    const payload = {
      deliveryStatus: document.getElementById('deliveryStatus').value,
      deliveryDate: document.getElementById('deliveryDate').value,
      deliveryTimeWindow: document.getElementById('deliveryTimeWindow').value,
      deliveryPersonName: document.getElementById('deliveryPerson').value,
      deliveryPersonPhone: document.getElementById('deliveryPersonPhone').value,
      note: document.getElementById('deliveryNote').value
    };
    const res = await fetch(`/api/admin/orders/${id}/delivery`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      document.getElementById('deliveryModal').style.display = 'none';
      loadOrders();
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/admin/logout');
    window.location.href = '/admin/login';
  });
});

async function loadZones() {
  const res = await fetch('/api/admin/delivery-zones');
  const data = await res.json();
  const tbody = document.getElementById('zonesTable');
  tbody.innerHTML = (data.zones || []).map(z => `
    <tr>
      <td>${z.zone_name}</td>
      <td>${z.city_area}</td>
      <td>₦${Number(z.delivery_fee).toLocaleString()}</td>
      <td>${z.estimated_timeframe || '-'}</td>
      <td>${z.minimum_order_amount > 0 ? '₦' + Number(z.minimum_order_amount).toLocaleString() : '-'}</td>
      <td>${z.active ? 'Active' : 'Inactive'}</td>
      <td><button class="btn btn-outline" onclick='editZone(${JSON.stringify(z).replace(/'/g, "&apos;")})'>Edit</button></td>
    </tr>
  `).join('');
}

function editZone(z) {
  document.getElementById('zoneModalTitle').textContent = 'Edit Delivery Zone';
  document.getElementById('zoneId').value = z.id;
  document.getElementById('zoneName').value = z.zone_name;
  document.getElementById('zoneArea').value = z.city_area;
  document.getElementById('zoneDesc').value = z.description || '';
  document.getElementById('zoneFee').value = z.delivery_fee;
  document.getElementById('zoneTime').value = z.estimated_timeframe || '';
  document.getElementById('zoneMin').value = z.minimum_order_amount || 0;
  document.getElementById('zoneNotes').value = z.special_notes || '';
  document.getElementById('zoneActive').checked = z.active == 1;
  document.getElementById('zoneModal').style.display = 'flex';
}

async function loadOrders() {
  const res = await fetch('/api/admin/orders');
  const data = await res.json();
  const tbody = document.getElementById('deliveryOrdersTable');
  tbody.innerHTML = (data.orders || []).filter(o => o.delivery_method === 'delivery' || o.collection_preference === 'delivery' || o.delivery_method).map(o => `
    <tr>
      <td><strong>${o.order_reference}</strong><br><small>${o.created_at}</small></td>
      <td>${o.customer_name}<br><small>${o.customer_phone}</small></td>
      <td>${o.customer_phone}</td>
      <td>${o.delivery_method || o.collection_preference || 'delivery'}</td>
      <td>${o.delivery_zone_name || o.city || '-'}</td>
      <td>₦${Number(o.delivery_fee || 0).toLocaleString()}</td>
      <td>${o.status}</td>
      <td>${o.delivery_status || 'Awaiting confirmation'}</td>
      <td><button class="btn btn-primary" onclick="manageDelivery(${o.id}, '${o.order_reference}')">Manage</button></td>
    </tr>
  `).join('');
}

function manageDelivery(id, ref) {
  document.getElementById('deliveryOrderId').value = id;
  document.getElementById('deliveryForm').reset();
  document.getElementById('deliveryModal').style.display = 'flex';
}
