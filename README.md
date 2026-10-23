# Joy World Farm

A professional, responsive e-commerce website for **Joy World Farm** — a poultry and catfish
business based in **Port Harcourt, Rivers State, Nigeria**.

The site sells chicks (day-old, three-week-old, grow-outs), turkeys at different growth
stages, and catfish products. It supports online ordering, WhatsApp ordering, wholesale
enquiries, and a protected administrative dashboard.

> **Note:** Demonstration products are clearly labelled and priced as *unconfirmed*. Replace
> or remove them from the admin dashboard before launch. See [Demo data](#demo-data).

---

## Technology

| Layer     | Choice                                   |
|-----------|------------------------------------------|
| Frontend  | HTML, CSS, vanilla JavaScript            |
| Backend   | Node.js + Express                        |
| Database  | SQLite via `better-sqlite3` (persistent) |
| Auth      | Server-side sessions + bcrypt hashing    |
| Uploads   | Multer (product images)                  |

No secrets are exposed to the frontend. Only the public WhatsApp number is served via
`GET /api/config`.

---

## Requirements

- Node.js 18+ (tested on Node 24)
- npm

---

## Installation

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `.env` and set at minimum:

```env
PORT=3000
WHATSAPP_NUMBER=          # international format, digits only, e.g. 2348012345678
SESSION_SECRET=           # long random string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=           # change this
SITE_URL=http://localhost:3000
ENABLE_DEMO_DATA=true
DELIVERY_FEE=0
```

The SQLite database is created automatically on first run at
`server/db/joyworldfarm.db`, together with the admin account and (optionally) demo products.

### Run

```bash
npm run dev     # development (nodemon, auto-restart)
npm start       # production
```

Open <http://localhost:3000>.

### Admin

Open <http://localhost:3000/admin/login> and sign in with the credentials in `.env`.

> The default credentials exist for local development only. Always set a strong
> `ADMIN_PASSWORD` and `SESSION_SECRET` before deploying.

---

## Available scripts

| Command             | Description                                        |
|---------------------|----------------------------------------------------|
| `npm run dev`       | Start with nodemon for local development           |
| `npm start`         | Start the production server                        |
| `npm test`          | Run the automated test suite (`server/test.js`)    |
| `npm run seed:clear`| Delete all demonstration products                  |

---

## Project structure

```
joy-world-farm/
├── client/                     # Frontend (served statically)
│   ├── index.html              # Home
│   ├── chicks.html             # Chicks catalogue
│   ├── turkeys.html            # Turkeys catalogue
│   ├── catfish.html            # Catfish catalogue
│   ├── product.html            # Product detail
│   ├── cart.html               # Shopping cart
│   ├── checkout.html           # Checkout
│   ├── order-confirmation.html # Order confirmation
│   ├── about.html
│   ├── contact.html
│   ├── wholesale.html
│   ├── search.html
│   ├── 404.html
│   ├── admin-*.html            # Admin pages (gated server-side)
│   ├── css/                    # Stylesheets
│   ├── js/                     # Frontend scripts
│   └── images/                 # Images + the demo placeholder
└── server/
    ├── index.js                # App entry point
    ├── test.js                 # Test suite
    ├── config/
    │   ├── config.js           # Env-based configuration
    │   └── database.js         # SQLite connection (WAL mode)
    ├── controllers/            # Product / Order / Admin logic
    ├── middleware/             # Auth + validation
    ├── models/schema.js        # Table creation
    ├── routes/                 # API routes
    ├── utils/
    │   ├── adminInit.js        # Creates the admin account
    │   └── seed.js             # Demonstration data
    └── scripts/
        └── clearDemoData.js    # Removes demonstration data
```

---

## API overview

| Method | Endpoint                          | Auth | Purpose                       |
|--------|-----------------------------------|------|-------------------------------|
| GET    | `/api/health`                     | –    | Health check                  |
| GET    | `/api/config`                     | –    | Public config (WhatsApp no.)  |
| GET    | `/api/products`                   | –    | List products (`?category=`)  |
| GET    | `/api/products/categories`        | –    | List categories               |
| GET    | `/api/products/:id`               | –    | Product detail                |
| POST   | `/api/orders`                     | –    | Create order                  |
| GET    | `/api/orders/:ref`                | –    | Order lookup by reference     |
| POST   | `/api/wholesale`                  | –    | Submit wholesale enquiry      |
| POST   | `/api/admin/login`                | –    | Admin login                   |
| GET    | `/api/admin/logout`               | –    | Admin logout                  |
| GET    | `/api/admin/stats`                | ✅   | Dashboard stats + sales       |
| GET    | `/api/admin/products`             | ✅   | All products                  |
| POST   | `/api/admin/products`             | ✅   | Create product                |
| PUT    | `/api/admin/products/:id`         | ✅   | Update product                |
| POST   | `/api/admin/products/:id/toggle`  | ✅   | Activate / deactivate         |
| GET    | `/api/admin/orders`               | ✅   | List orders                   |
| GET    | `/api/admin/orders/:id`           | ✅   | Order detail + history        |
| PUT    | `/api/admin/orders/:id/status`    | ✅   | Update order status           |
| GET    | `/api/admin/enquiries`            | ✅   | Wholesale enquiries           |

Order totals are **always recalculated on the server** from current product records; prices
and totals submitted by the browser are never trusted.

---

## Order statuses

`Pending` → `Confirmed` → `Processing` → `Ready for collection or dispatch` → `Completed`,
plus `Cancelled`. Every change is written to `order_status_history`.

---

## Demo data

`ENABLE_DEMO_DATA=true` seeds 8 clearly-labelled demonstration products (marked `is_demo`).
They show a "Demo" badge and a notice stating pricing/stock are unconfirmed.

To remove them before launch:

```bash
npm run seed:clear
```

Then set `ENABLE_DEMO_DATA=false` in `.env` so they are not re-seeded, and add real products
from the admin dashboard.

---

## Testing

```bash
npm test
```

The suite boots the app on a random port and covers: health/config, product browsing,
product detail, server-side price calculation, order creation, invalid checkout data,
stock validation, minimum-order validation, wholesale enquiries, admin authentication,
unauthorised access, product management, order status updates with history, database
persistence, WhatsApp number formatting, static pages, sitemap/robots, and logout.

**30 tests, all passing** (as of the last run).

---

## Deployment (free tier)

Suitable for **Render**, **Railway**, or **Fly.io** free tiers.

1. Push the repository to GitHub.
2. Create a new Web Service and set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. Add environment variables (do **not** commit `.env`):
   - `NODE_ENV=production`
   - `SESSION_SECRET` (long random string)
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`
   - `WHATSAPP_NUMBER`
   - `SITE_URL` (your public URL)
   - `ENABLE_DEMO_DATA=false`
4. Add a **persistent disk** mounted at `server/db` so orders and products survive
   restarts and redeploys (SQLite requires durable storage).
5. Set `SITE_URL` to the deployed URL so `sitemap.xml` and `robots.txt` use the correct host.

Because sessions use an in-memory store by default, use a single instance or sticky
sessions. For multi-instance deployments, configure a shared session store.

---

## Accessibility & performance notes

- Mobile-first responsive layout with no horizontal overflow.
- Keyboard-visible focus, skip-to-content link, semantic landmarks.
- `prefers-reduced-motion` honoured (animations disabled).
- Lazy-loaded product images; loading skeletons and clear empty states.
- Accessible forms with labels and inline validation messages.

---

## Security notes

- Passwords hashed with bcrypt; sessions are `httpOnly` + `sameSite`.
- Admin pages are gated on the server (`/admin/*` redirects when not authenticated).
- Admin API routes return `401` when unauthenticated — hiding UI is not relied upon.
- All inputs validated with `express-validator`; parameterised SQL everywhere.
- `helmet`, `compression`, and request logging enabled.
- `.env` and the SQLite database are git-ignored.

---

## Doing business responsibly

The site does **not** claim an order is paid until payment is verified, does not invent
company history, certifications, reviews, or capacity, and does not charge delivery fees
unless configured and disclosed. Contact details, the WhatsApp number, and product data are
all owner-configurable.
