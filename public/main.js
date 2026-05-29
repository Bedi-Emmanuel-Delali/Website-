const featuresGrid = document.getElementById('featuresGrid');
const featureSelect = document.getElementById('featureSelect');
const orderForm = document.getElementById('orderForm');
const orderStatus = document.getElementById('orderStatus');

async function loadFeatures() {
  const res = await fetch('/api/features');
  const features = await res.json();

  featuresGrid.innerHTML = '';
  featureSelect.innerHTML = '<option value="">Select a feature</option>';

  for (const feature of features) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${feature.name}</h3>
      <p>${feature.description}</p>
      <span class="price">$${feature.price}</span>
    `;
    featuresGrid.appendChild(card);

    const option = document.createElement('option');
    option.value = feature.id;
    option.textContent = `${feature.name} ($${feature.price})`;
    featureSelect.appendChild(option);
  }
}

orderForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  orderStatus.style.display = 'none';

  const data = Object.fromEntries(new FormData(orderForm).entries());

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await res.json();
  orderStatus.style.display = 'block';
  orderStatus.className = `notice small ${res.ok ? '' : 'error'}`;
  orderStatus.textContent = payload.message || (res.ok ? 'Order sent.' : 'Failed to submit order.');

  if (res.ok) orderForm.reset();
});

loadFeatures();
