const dashboard = document.getElementById('dashboard');
const featuresBody = document.getElementById('featuresBody');
const ordersBody = document.getElementById('ordersBody');
const clientsBody = document.getElementById('clientsBody');
const featureForm = document.getElementById('featureForm');
const featureStatus = document.getElementById('featureStatus');
const logoutBtn = document.getElementById('logoutBtn');

async function api(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }
  return res;
}

function renderDashboard(data) {
  dashboard.innerHTML = `
    <div class="metric"><strong>Total Features</strong><div>${data.features}</div></div>
    <div class="metric"><strong>Total Clients</strong><div>${data.clients}</div></div>
    <div class="metric"><strong>Total Orders</strong><div>${data.orders}</div></div>
    <div class="metric"><strong>Pending Orders</strong><div>${data.pendingOrders}</div></div>
  `;
}

function renderFeatures(features) {
  featuresBody.innerHTML = features
    .map(
      (feature) => `
      <tr>
        <td>${feature.id}</td>
        <td>${feature.name}</td>
        <td>${feature.description}</td>
        <td>$${feature.price}</td>
        <td><button class="danger" data-delete-feature="${feature.id}">Delete</button></td>
      </tr>`
    )
    .join('');

  document.querySelectorAll('[data-delete-feature]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-delete-feature');
      await api(`/api/admin/features/${id}`, { method: 'DELETE' });
      await refreshAll();
    });
  });
}

function renderOrders(orders) {
  ordersBody.innerHTML = orders
    .map(
      (order) => `
      <tr>
        <td>${order.id}</td>
        <td>${order.clientName}<br><span class="small">${order.clientEmail}</span></td>
        <td>${order.featureName}</td>
        <td><span class="badge status-${order.status}">${order.status}</span></td>
        <td>${order.details || ''}</td>
        <td>
          <select data-order-status="${order.id}">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>pending</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>processing</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>completed</option>
          </select>
        </td>
      </tr>`
    )
    .join('');

  document.querySelectorAll('[data-order-status]').forEach((select) => {
    select.addEventListener('change', async () => {
      const id = select.getAttribute('data-order-status');
      await api(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: select.value }),
      });
      await refreshAll();
    });
  });
}

function renderClients(clients) {
  clientsBody.innerHTML = clients
    .map(
      (client) => `
      <tr>
        <td>${client.id}</td>
        <td>${client.name}</td>
        <td>${client.email}</td>
        <td>${client.companyName || ''}</td>
      </tr>`
    )
    .join('');
}

async function refreshAll() {
  const [dashboardRes, featuresRes, ordersRes, clientsRes] = await Promise.all([
    api('/api/admin/dashboard'),
    api('/api/admin/features'),
    api('/api/admin/orders'),
    api('/api/admin/clients'),
  ]);

  if (!dashboardRes || !featuresRes || !ordersRes || !clientsRes) return;

  const [dashboardData, features, orders, clients] = await Promise.all([
    dashboardRes.json(),
    featuresRes.json(),
    ordersRes.json(),
    clientsRes.json(),
  ]);

  renderDashboard(dashboardData);
  renderFeatures(features);
  renderOrders(orders);
  renderClients(clients);
}

featureForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(featureForm).entries());

  const res = await api('/api/admin/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res) return;

  const payload = await res.json();
  featureStatus.style.display = 'block';
  featureStatus.className = `notice small ${res.ok ? '' : 'error'}`;
  featureStatus.textContent = res.ok ? `Feature "${payload.name}" added.` : payload.message || 'Failed to add feature.';

  if (res.ok) {
    featureForm.reset();
    await refreshAll();
  }
});

logoutBtn.addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

refreshAll();
