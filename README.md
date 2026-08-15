# Aharyas

Aharyas is a production-grade MERN monorepo for handcrafted Indian heritage products. The repository is structured as a workspace containing two Next.js 15 App Router applications and an Express v2.0 REST API backend:

- `frontend`: High-performance customer storefront built with **Next.js 15**, **React 19**, **TypeScript**, **App Router**, and Tailwind CSS.
- `admin`: Operational administrative & seller portal built with **Next.js 15**, **React 19**, **TypeScript**, **App Router**, Chart.js, and real-time Socket.IO telemetry.
- `backend`: Production-grade Node.js/Express API (v2.0.0) featuring MongoDB persistence, Redis-backed rate limiting with bounded fail-closed fallback, JWT session auth, Razorpay payments, salted delivery OTPs, Socket.IO admin streams, and background abandoned cart worker automation.

Live site: [https://aharyas.com](https://aharyas.com)

---

## 🔒 Production Security & Hardening Architecture

### Architectural Security Enforcements
1. **Authenticated Session Ownership (`req.user._id`)**:
   - Replaced all insecure client-supplied `req.body.userId` parameters across order placement, Razorpay verification, order cancellation, cart mutations, wishlist endpoints, and user profile management.
   - All server operations authoritatively derive `userId = req.user._id` strictly from JWT-authenticated sessions validated by middleware (`auth.js` / `adminAuth.js`).
2. **IDOR Prevention**:
   - Strict ownership validation enforced across all order status lookups, delivery verification, address updates, and cart operations.
3. **Hardened Delivery OTP**:
   - Replaced plaintext OTP storage with salted HMAC SHA-256 hashes (`deliveryOtpHash`).
   - 15-minute sliding expiration (`deliveryOtpExpiresAt`).
   - Brute-force protection: 5-failed-attempt threshold triggers a 15-minute account lockout (`deliveryOtpLockoutUntil`).
   - Cryptographic timing-safe hash comparison (`crypto.timingSafeEqual`).
4. **Socket.IO Admin Analytics Security**:
   - JWT-authenticated `/admin-analytics` namespace requiring active admin token verification.
   - Client-side event sanitization preventing malicious telemetry injections.
   - Authoritative business events emitted exclusively by server-side domain services.
5. **Resilient Rate Limiting**:
   - Redis-backed sliding window rate limiters across auth, OTP, register, and user routes.
   - **Fail-Closed Fallback Store**: Bounded in-memory map fallback (capped at 5,000 active entries) ensuring security routes remain protected even during Redis outages.
6. **XSS Payload Mitigation**:
   - HTML sanitizer (`utils/sanitizer.js`) stripping dangerous `<script>`, `<iframe>`, and `on*` event handlers from rich text product descriptions.
   - Strict string sanitization on user inputs and catalog metadata.
7. **Checkout Calculation Integrity**:
   - All line prices, sub-totals, discounts, delivery fees, and order totals are calculated authoritatively on the backend server.
   - Client-side display state is completely decoupled from price calculations.

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
├── admin/                 Admin & Seller Next.js 15 App Router Portal
│   ├── src/
│   │   ├── app/           App Router pages (dashboard, orders, products, verifications)
│   │   ├── components/    UI components, stats cards & charts
│   │   └── context/       Auth & Admin state contexts
│   └── package.json       Next.js 15, React 19, TypeScript
├── backend/               Express REST API & Worker Engine (v2.0.0)
│   ├── config/            MongoDB, Redis, Mailer, Logger, Socket
│   ├── features/          Domain features (order, cart, wishlist, product, user, analytics)
│   ├── middlewares/       Auth, RateLimiter (with fallback), Sanitize, Upload
│   ├── tests/             Jest & Supertest unit/integration test suites (22 suites, 250 tests)
│   └── server.js          Server entrypoint & socket launcher
├── frontend/              Customer Storefront Next.js 15 App Router App
│   ├── public/            Static assets & favicon
│   └── src/               App Router pages, components, and contexts
└── README.md
```

---

## 🛠️ Prerequisites & Environment Setup

### Requirements
- **Node.js**: v18.x or higher
- **pnpm**: Workspace package manager
- **MongoDB**: Connection string (Atlas or local replica set)
- **Redis**: Connection string / URL for rate limiting & session caches
- **SMTP Provider**: Host, port, user, and app password for Nodemailer

### Environment Variables

#### `backend/.env`
```env
NODE_ENV=development
PORT=3040
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
FRONTEND_URL=http://localhost:3141
ABANDONED_CART_CHECK_INTERVAL_MS=900000
HEALTH_SECRET=...
```

#### `frontend/.env.local`
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3040
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
```

#### `admin/.env.local`
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3040
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

---

## 🚀 Running Locally

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Start Backend (API + Socket + Background Worker)
cd backend
npm run server

# 3. Start Frontend Storefront (runs on port 3141)
cd frontend
npm run dev

# 4. Start Admin Portal (runs on port 3242)
cd admin
npm run dev
```

---

## 🧪 Automated Testing & Verification

Execute the complete monorepo pre-commit test & lint suite:

```bash
npm run pre-commit
```

Included checks:
- **Backend Test Suite**: 22 Jest test suites (250 passing unit/integration tests).
- **TypeScript Typecheck**: `--noEmit` across `frontend` and `admin`.
- **ESLint Flat Config**: Native ESLint 9 validation across all workspace packages.

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
- `POST /get` — Fetch user persistent cart (authenticated via token)
- `POST /add` — Add item to cart
- `POST /update` — Update item quantity / size
- `POST /remove` — Remove item from cart
- `POST /clear` — Empty user cart
- `POST /merge` — Merge guest cart into user account upon login

### Orders & Verification (`/api/v1/order`)
- `POST /place` — Place COD order (authenticated via token)
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
