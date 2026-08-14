# Aharyas

Aharyas is a MERN e-commerce platform for handcrafted Indian products. The repo contains three apps:

- `frontend`: customer storefront built with React, Vite, and Tailwind CSS
- `admin`: admin dashboard for product, order, and seller operations
- `backend`: Express API with MongoDB, JWT auth, payments, email, uploads, and order tracking

Live site: https://aharyas.com

## Features

### Customer Storefront
- Home, collection, category, company, product detail, cart, wishlist, checkout, order tracking, profile, support, and policy pages
- Search, filters, sorting, grid/list collection views, recently viewed products, coupons, and responsive UI
- Guest-aware wishlist and checkout flows, with protected account/order features
- Google login, OTP verification, password reset, newsletter subscription, and profile/address management
- Virtual try-on and chatbot support integrations

### Admin Dashboard
- Admin authentication
- Product add/edit/list workflows with image uploads
- Order management and order detail views
- Admin panel and seller/business analytics surfaces

### Backend API
- Express REST API under `/api/v1`
- MongoDB models for users, products, orders, carts, and wishlists
- JWT access/refresh auth, admin auth, optional auth, OTP email flows, and profile management
- Cloudinary image upload support
- Razorpay order/payment verification
- Nodemailer transactional emails for OTP, welcome, newsletter, order, shipping, delivery OTP, and delivered events
- Socket.IO order tracking rooms
- Security middleware: CORS allowlist, Helmet, rate limiting, Mongo sanitize, request logging

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 18, Vite 6, React Router 7, Tailwind CSS, lucide-react |
| Admin | React 18, Vite 6, Tailwind CSS, Chart.js |
| Backend | Node.js, Express, Mongoose, Socket.IO |
| Auth | JWT, Google OAuth, OTP email |
| Payments | Razorpay |
| Media | Cloudinary, Multer |
| Email | Nodemailer |
| Tests | Jest, Supertest, React-focused frontend tests |

## Repository Structure

```text
aharya-app/
  admin/                 Admin React app
    src/
      components/
      context/
      pages/
  backend/               Express API
    config/              DB, Cloudinary, mailer, logger, email templates
    controllers/         API controller logic
    middlewares/         Auth, validation, upload, mail helpers
    models/              Mongoose schemas
    routes/              Express routers
    services/            Shared business/auth/order services
    tests/               Backend Jest/Supertest tests
    server.js            API entrypoint
  frontend/              Customer React app
    src/
      assets/
      components/
      context/
      data/
      pages/
      tests/
  README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB connection string
- Cloudinary account
- Email account/app password for SMTP
- Razorpay keys for checkout
- Google OAuth client ID if Google login is enabled
- Groq API key if the chatbot proxy is enabled

## Environment Variables

Create `.env` files inside each app directory. Do not commit real `.env` files.

### `backend/.env`

```env
NODE_ENV=development
PORT=4000

MONGODB_URI=

JWT_SECRET=
JWT_REFRESH_SECRET=

CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET_KEY=

EMAIL_USER=
EMAIL_PASS=

FRONTEND_URL=http://localhost:5173
WHATSAPP_GROUP_LINK=

RAZORPAY_KEY_ID=
RAZORPAY_SECRET_KEY=

GOOGLE_CLIENT_ID=
GROQ_API_KEY=
HEALTH_SECRET=
```

### `frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=
VITE_RAZORPAY_KEY_ID=
VITE_REMOVE_BG_API_KEY=
```

### `admin/.env`

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=
```

## Local Development

Install dependencies for each app:

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../admin
npm install
```

Run the backend API:

```bash
cd backend
npm run server
```

Run the storefront:

```bash
cd frontend
npm run dev
```

Run the admin dashboard:

```bash
cd admin
npm run dev
```

Default local ports:

- Backend API: `http://localhost:4000`
- Frontend Vite: usually `http://localhost:5173`
- Admin Vite: usually `http://localhost:5174` if the frontend is already using `5173`

## Scripts

### Backend

```bash
npm start          # Run server.js with node
npm run server     # Run server.js with nodemon
npm test           # Run backend tests
npm run test:watch # Run backend tests in watch mode
npm run test:coverage
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm test
npm run test:coverage
```

### Admin

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## API Overview

Base URL:

```text
/api/v1
```

### User and Auth: `/api/v1/user`

- `POST /send-otp`
- `POST /verify-otp`
- `POST /login`
- `POST /refresh-token`
- `POST /google-auth`
- `POST /forgot-password-otp`
- `POST /reset-password`
- `POST /admin-login`
- `POST /send-admin-otp`
- `POST /verify-admin-otp`
- `POST /admin-google-auth`
- `GET /profile`
- `GET /profile/:id`
- `PUT /profile/:id`
- `PUT /address/:id`
- `DELETE /address/:id`
- `PUT /change-password/:id`
- `POST /newsletter/subscribe`

### Products: `/api/v1/product`

- `GET /all` public product list
- `POST /single` public single product lookup
- `GET /companies`
- `GET /company/:company`
- `POST /add` admin only
- `PUT /edit/:id` admin only
- `GET /list` admin only
- `DELETE /remove/:id` admin only
- `GET /analytics` admin only

### Cart: `/api/v1/cart`

- `POST /get`
- `POST /add`
- `POST /update`
- `POST /remove`
- `POST /clear`

### Wishlist: `/api/v1/wishlist`

- `POST /add`
- `POST /remove`
- `POST /toggle`
- `POST /get`
- `POST /details`

### Orders: `/api/v1/order`

- `POST /place`
- `POST /razorpay`
- `POST /verifyRazorpay`
- `POST /verifyCOD`
- `POST /userorders`
- `GET /track/:orderId`
- `GET /status/:orderId`
- `GET /list` admin only
- `POST /status` admin only
- `POST /updatePayment` admin only
- `POST /verifyDelivery`

### Chat: `/api/v1/chat`

- `POST /chat`

### Health

- `GET /health`
- `GET /` returns a simple API running message

## Frontend Routing

Important storefront routes:

- `/`
- `/shop/collection`
- `/shop/:subcategory`
- `/shop/company/:company`
- `/product/:productId`
- `/cart`
- `/wishlist`
- `/place-order`
- `/orders`
- `/trackorder/:orderId`
- `/profile/:id`
- `/login`
- `/assistant`
- `/try-on`
- `/about`, `/contact`, `/support`, `/faqs`
- policy pages: `/refundpolicy`, `/shippingpolicy`, `/termsconditions`, `/privacypolicy`

## Authentication Notes

- Customer-only routes use `authUser` on the backend.
- Admin-only routes use `adminAuth`.
- Some order and wishlist routes use `optionalAuth` to support guest-friendly flows.
- Access tokens are JWT-based. Refresh-token support is exposed via `/api/v1/user/refresh-token`.
- OTP flows are sent with Nodemailer.

## Payments and Orders

- COD orders use `/api/v1/order/place` and COD verification flows.
- Razorpay orders use `/api/v1/order/razorpay` followed by `/api/v1/order/verifyRazorpay`.
- Order status is available through `/api/v1/order/track/:orderId` and `/api/v1/order/status/:orderId`.
- Socket.IO lets clients join `order_<orderId>` rooms for live tracking updates.

## Testing and Verification

Run backend tests:

```bash
cd backend
npm test
```

Run frontend tests:

```bash
cd frontend
npm test
```

Build all deployable apps:

```bash
cd frontend
npm run build

cd ../admin
npm run build
```

## Deployment Notes

> [!WARNING]
> **Secret Rotation Security Policy**: 
> If any secret or API key (e.g., Stripe, Razorpay, JWT secrets, database connection string, email/app passwords) was previously hardcoded in any commit in the git history, the secret must be rotated/revoked immediately. Simply removing it from the current codebase or pushing a `.env` file does not delete the secret from your historical Git commits.

- Set production environment variables in the hosting provider.
- Set `NODE_ENV=production` for the backend.
- Keep the backend CORS allowlist in `backend/server.js` aligned with production domains.
- Use `npm start` for the backend production process.
- Serve `frontend/dist` for the storefront and `admin/dist` for the admin dashboard.
- Keep secrets out of Git and rotate keys if any `.env` file has been exposed.


## Troubleshooting

- If the frontend cannot reach the API, check `VITE_BACKEND_URL` and backend CORS origins.
- If images fail to upload, check Cloudinary keys and Multer upload field names.
- If OTP/order emails fail, check `EMAIL_USER`, `EMAIL_PASS`, and provider app-password settings.
- If Razorpay verification fails, check that backend `RAZORPAY_SECRET_KEY` and frontend `VITE_RAZORPAY_KEY_ID` belong to the same Razorpay mode.
- If Google login fails, check `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.

## License

Proprietary. All rights reserved. This codebase is not open for public use, redistribution, or modification without explicit written permission from Aharyas.
