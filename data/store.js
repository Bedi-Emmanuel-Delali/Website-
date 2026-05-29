const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'db.json');

const defaultDb = {
  users: [],
  features: [
    {
      id: 1,
      name: 'AI Website Assistant',
      description: 'Embed an AI assistant that helps visitors and captures leads.',
      price: 299,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Lead Automation Suite',
      description: 'Automatically qualify and route leads to your team in real time.',
      price: 399,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Analytics Dashboard',
      description: 'Track engagement, conversion and support trends in one place.',
      price: 199,
      createdAt: new Date().toISOString(),
    },
  ],
  clients: [],
  orders: [],
};

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
}

function seedAdmin() {
  const adminEmail = 'bediemmanuel456@gmail.com';
  const adminPassword = 'Bedidelali@12';

  const exists = db.users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
  if (exists) return;

  db.users.push({
    id: nextId(db.users),
    email: adminEmail,
    passwordHash: bcrypt.hashSync(adminPassword, 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  });

  saveDb();
}

module.exports = {
  db,
  saveDb,
  seedAdmin,
  nextId,
};
