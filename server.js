const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { db, saveDb, seedAdmin, nextId } = require('./data/store');

const app = express();
const PORT = process.env.PORT || 3000;

seedAdmin();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
}

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  req.session.user = { id: user.id, email: user.email, role: user.role };
  return res.json({ user: req.session.user });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out.' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not logged in.' });
  }
  return res.json({ user: req.session.user });
});

app.get('/api/features', (req, res) => {
  res.json(db.features);
});

app.post('/api/orders', (req, res) => {
  const { clientName, clientEmail, companyName, featureId, details } = req.body;

  if (!clientName || !clientEmail || !featureId) {
    return res.status(400).json({ message: 'Name, email and feature are required.' });
  }

  const feature = db.features.find((f) => f.id === Number(featureId));
  if (!feature) {
    return res.status(404).json({ message: 'Feature not found.' });
  }

  let client = db.clients.find((c) => c.email.toLowerCase() === clientEmail.toLowerCase());
  if (!client) {
    client = {
      id: nextId(db.clients),
      name: clientName,
      email: clientEmail,
      companyName: companyName || '',
      createdAt: new Date().toISOString(),
    };
    db.clients.push(client);
  } else {
    client.name = clientName;
    client.companyName = companyName || client.companyName;
  }

  const order = {
    id: nextId(db.orders),
    clientId: client.id,
    featureId: feature.id,
    featureName: feature.name,
    details: details || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.orders.push(order);
  saveDb();

  return res.status(201).json({ message: 'Order submitted successfully.', order });
});

app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
  res.json({
    features: db.features.length,
    clients: db.clients.length,
    orders: db.orders.length,
    pendingOrders: db.orders.filter((o) => o.status === 'pending').length,
  });
});

app.get('/api/admin/features', requireAdmin, (req, res) => {
  res.json(db.features);
});

app.post('/api/admin/features', requireAdmin, (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: 'Feature name and description are required.' });
  }

  const feature = {
    id: nextId(db.features),
    name,
    description,
    price: Number(price) || 0,
    createdAt: new Date().toISOString(),
  };

  db.features.push(feature);
  saveDb();
  return res.status(201).json(feature);
});

app.put('/api/admin/features/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const feature = db.features.find((f) => f.id === id);
  if (!feature) {
    return res.status(404).json({ message: 'Feature not found.' });
  }

  const { name, description, price } = req.body;
  if (name) feature.name = name;
  if (description) feature.description = description;
  if (price !== undefined) feature.price = Number(price) || 0;

  saveDb();
  return res.json(feature);
});

app.delete('/api/admin/features/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const idx = db.features.findIndex((f) => f.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Feature not found.' });
  }

  const removed = db.features.splice(idx, 1)[0];
  db.orders = db.orders.filter((o) => o.featureId !== id);

  saveDb();
  return res.json({ message: 'Feature removed.', removed });
});

app.get('/api/admin/clients', requireAdmin, (req, res) => {
  res.json(db.clients);
});

app.put('/api/admin/clients/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const client = db.clients.find((c) => c.id === id);
  if (!client) {
    return res.status(404).json({ message: 'Client not found.' });
  }

  const { name, email, companyName } = req.body;
  if (name) client.name = name;
  if (email) client.email = email;
  if (companyName !== undefined) client.companyName = companyName;

  saveDb();
  return res.json(client);
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const enriched = db.orders.map((order) => {
    const client = db.clients.find((c) => c.id === order.clientId);
    return {
      ...order,
      clientName: client?.name || 'Unknown',
      clientEmail: client?.email || '',
      companyName: client?.companyName || '',
    };
  });

  res.json(enriched);
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  const { status, details } = req.body;
  if (status) order.status = status;
  if (details !== undefined) order.details = details;

  saveDb();
  return res.json(order);
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
