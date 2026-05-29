# AgentHub Website + Admin Portal

This repository now contains a complete full-stack website inspired by the requested style, with a built-in admin portal.

## Features Included

- Public marketing website with a feature catalog
- Client order form for submitting service requests
- Session-based authentication for admin users
- Admin dashboard with high-level metrics
- Admin management for:
  - Features (list, add, delete, edit via API)
  - Orders (list and update status)
  - Clients (list and edit via API)
- Persistent JSON data storage (`/data/db.json`)

## Preconfigured Admin Access

- **Email:** `bediemmanuel456@gmail.com`
- **Password:** `Bedidelali@12`

The admin user is seeded on server start if it doesn't already exist.

## Run Locally

```bash
npm install
npm start
```

Then open:

- Public website: `http://localhost:3000/`
- Admin login: `http://localhost:3000/login`
- Admin portal: `http://localhost:3000/admin`

## API Endpoints

### Public
- `GET /api/features`
- `POST /api/orders`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Admin (requires login)
- `GET /api/admin/dashboard`
- `GET /api/admin/features`
- `POST /api/admin/features`
- `PUT /api/admin/features/:id`
- `DELETE /api/admin/features/:id`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id`
- `GET /api/admin/clients`
- `PUT /api/admin/clients/:id`
