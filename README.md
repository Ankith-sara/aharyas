# Aharyas

Aharyas is a MERN e-commerce platform for handcrafted Indian products. The repo contains three apps:

- `frontend`: High-performance customer storefront built with React 18, Vite, React Router 7, and Vanilla/Tailwind CSS.
- `admin`: Operational administrative & seller dashboard for catalog, order, verification, and real-time analytics management.
- `backend`: Production-grade Node.js/Express API featuring MongoDB persistence, Redis-backed rate limiting with bounded in-memory fallbacks, JWT auth, Razorpay payments, salted delivery OTPs, Socket.IO admin streams, and automated abandoned cart worker automation.

Live site: [https://aharyas.com](https://aharyas.com)

---

## 🔒 Production Security & Hardening Architecture

### P0 Security Enforcements
1. **IDOR Prevention**: Strict user ownership validation on all order lookup, status verification, and cart mutation endpoints (`OrderController.js`, `CartController.js`).
2. **Hardened Delivery OTP**:
   - Replaced plaintext OTP storage with salted HMAC SHA-256 hashes (`deliveryOtpHash`).
   - 15-minute sliding expiration (`deliveryOtpExpiresAt`).
   - Brute-force protection: 5-failed-attempt threshold triggers a 15-minute account lockout (`deliveryOtpLockoutUntil`).
   - Cryptographic timing-safe hash comparison (`crypto.timingSafeEqual`).
3. **Socket.IO Admin Analytics Security**:
   - JWT-authenticated `/admin-analytics` namespace requiring active admin token verification.
   - Client-side event sanitization preventing malicious telemetry injections.
   - Authoritative business events emitted exclusively by server-side domain services.
4. **Resilient Rate Limiting**:
   - Redis-backed sliding window rate limiters across auth, OTP, register, and user routes.
   - **Fail-Closed Fallback Store**: Bounded in-memory map fallback (capped at 5,000 active entries) ensuring security routes remain protected even during Redis outages.
5. **XSS Payload Mitigation**:
   - HTML sanitizer (`utils/sanitizer.js`) stripping dangerous `<script>`, `<iframe>`, and `on*` event handlers from rich text product descriptions.
   - Strict string sanitization on user inputs and catalog metadata.
6. **Checkout Calculation Integrity**:
   - All line prices, sub-totals, discounts, delivery fees, and order totals are calculated authoritatively on the backend server.
   - Client-side `localStorage` data is treated strictly as display state.

---

## 🛒 Persistent Cart & Abandoned Cart Email Automation

### Server-Side Persistent Cart (`CartModel.js`)
- MongoDB schema storing user cart state with activity timestamps (`lastActivityAt`), status tracking (`ACTIVE`, `ABANDONED`, `CONVERTED`, `EXPIRED`), and item arrays.
- Automatic guest-to-authenticated cart merging (`POST /api/v1/cart/merge`) upon login with quantity caps (max 10 items per SKU).
- Bidirectional backwards-compatibility sync with `UserModel.cartData`.

### Automated Abandoned Cart Worker (`abandonedCartWorker.js`)
- Independent background cron/interval job executing every 15 minutes.
- Multi-stage notification pipeline:
  - **Stage 1 (24 Hours / 1 Day)**: "Your Aharyas cart is waiting"
  - **Stage 2 (72 Hours / 3 Days)**: "Still thinking about your selection?"
  - **Stage 3 (7 Days / 168 Hours)**: "Your Aharyas selection is waiting" (Final reminder)
- **Idempotency & Race Condition Defense**: Atomic `findOneAndUpdate` database claims guarantee that multiple API worker nodes never double-send notifications.
- **Conversion Cancellation**: Order placement automatically transitions the user's cart to `CONVERTED`, immediately canceling any pending abandoned cart email schedules.

---

## 📁 Repository Structure

```text
aharyas-app/
├── admin/                 Admin & Seller React Dashboard
│   ├── src/
│   │   ├── components/    UI components & rich text editor
│   │   ├── context/       Auth & Admin state contexts
│   │   ├── pages/         Order, product, and analytics views
│   └── index.html         Admin entrypoint (noindex, nofollow)
├── backend/               Express REST API & Worker Engine
│   ├── config/            MongoDB, Redis, Mailer, Logger, Email Templates, Socket
│   ├── controllers/       API Request handlers (Order, Cart, Product, User, etc.)
│   ├── jobs/              Background workers (abandonedCartWorker.js)
│   ├── middlewares/       Auth, RateLimiter (with fallback), Sanitize, Upload
│   ├── models/            Mongoose Schemas (CartModel, OrderModel, ProductModel, UserModel)
│   ├── routes/            Express Route definitions & validation rules
│   ├── services/          Business logic (CartService, AbandonedCartService, OrderService)
│   ├── tests/             Jest & Supertest unit/integration test suites (22 suites, 250 tests)
│   └── server.js          Server entrypoint & socket launcher
├── frontend/              Customer Storefront React App
│   ├── public/            Static assets & robots.txt
│   └── src/               Components, Contexts, Pages
└── README.md
```

---

## 🛠️ Prerequisites & Setup

### Requirements
- **Node.js**: v18.x or higher
- **MongoDB**: Connection string (Atlas or local replica set)
- **Redis**: Connection string / URL for rate limiting & session caches
- **SMTP Provider**: Host, port, user, and app password for Nodemailer

### Environment Variables

#### `backend/.env`
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...
RAZORPAY_KEY_ID=...
RAZORPAY_SECRET_KEY=...
EMAIL_USER=support@aharyas.com
EMAIL_PASS=...
FRONTEND_URL=http://localhost:5173
ABANDONED_CART_CHECK_INTERVAL_MS=900000
HEALTH_SECRET=...
```

#### `frontend/.env`
```env
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=...
VITE_RAZORPAY_KEY_ID=...
```

#### `admin/.env`
```env
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=...
```

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install

# 2. Start Backend (API + Socket + Background Worker)
cd backend
npm run server

# 3. Start Frontend Storefront
cd frontend
npm run dev

# 4. Start Admin Portal
cd admin
npm run dev
```

---

## 🧪 Automated Testing

Execute the complete backend test suite:

```bash
cd backend
npm test
```

Expected result:
```text
Test Suites: 22 passed, 22 total
Tests:       250 passed, 250 total
Snapshots:   0 total
Time:        12.593 s
```

---

## 🌐 API Endpoint Reference (`/api/v1`)

### Authentication & Users (`/api/v1/user`)
- `POST /send-otp` — Request login/register OTP
- `POST /verify-otp` — Verify OTP & authenticate
- `POST /login` — Password authentication
- `POST /refresh-token` — Issue new access token
- `POST /forgot-password-otp` — Request password reset OTP
- `POST /reset-password` — Complete password reset

### Cart Management (`/api/v1/cart`)
- `POST /get` — Fetch user persistent cart
- `POST /add` — Add item to cart
- `POST /update` — Update item quantity / size
- `POST /remove` — Remove item from cart
- `POST /clear` — Empty user cart
- `POST /merge` — Merge guest cart into user account upon login

### Orders & Verification (`/api/v1/order`)
- `POST /place` — Place COD order (triggers cart conversion)
- `POST /razorpay` — Initiate Razorpay payment session
- `POST /verifyRazorpay` — Verify signature & finalize online order
- `POST /verifyCOD` — Verify COD order ownership
- `POST /verifyDelivery` — Verify delivery OTP (5-fail lockout protected)

### Admin Analytics & Sitemaps
- `GET /admin-analytics` — Socket.IO namespace (JWT auth enforced)
- `GET /sitemap.xml` — Public dynamic sitemap XML

---

## 📜 License & Compliance

Proprietary. All rights reserved. This codebase is not open for public use, redistribution, or modification without explicit written permission from Aharyas.
