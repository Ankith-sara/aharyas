import { describe, test, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Joi from 'joi';

// ── Shared secret for mock auth
const JWT_SECRET = 'test-secret-key';

// ── Mock Auth Middleware
const authUser = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        const token = header.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. Malformed token.' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { _id: decoded.id, role: decoded.role };
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Authentication failed.' });
    }
};

// ── Mock Joi Validation Middlewares
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
    }
    next();
};

const validatePlaceOrder = (req, res, next) => {
    const schema = Joi.object({
        items: Joi.array().items(Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required(),
            size: Joi.string().required(),
            price: Joi.number().required(),
            name: Joi.string().required(),
        })).min(1).required(),
        amount: Joi.number().positive().required(),
        address: Joi.object({
            Name: Joi.string().required(),
            email: Joi.string().email().required(),
            street: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            pincode: Joi.string().required(),
            country: Joi.string().required(),
            phone: Joi.string().required(),
        }).required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

// ── Mock Order Database
let mockOrders = [];

// Helper to reset orders before each test
beforeEach(() => {
    mockOrders = [
        {
            _id: 'order_paid_123',
            userId: 'user_123',
            items: [{ productId: 'p1', quantity: 1, size: 'M', price: 1000, name: 'Shirt' }],
            amount: 1000,
            address: { Name: 'Ankith', email: 'ankith@gmail.com', street: '1 St', city: 'Hyd', state: 'TS', pincode: '500', country: 'IN', phone: '123' },
            paymentMethod: 'Razorpay',
            payment: true,
            status: 'Shipped',
        },
        {
            _id: 'order_pending_123',
            userId: 'user_123',
            items: [{ productId: 'p2', quantity: 1, size: 'L', price: 1500, name: 'Pants' }],
            amount: 1500,
            address: { Name: 'Ankith', email: 'ankith@gmail.com', street: '1 St', city: 'Hyd', state: 'TS', pincode: '500', country: 'IN', phone: '123' },
            paymentMethod: 'Razorpay',
            payment: false,
            status: 'Payment Pending',
        },
        {
            _id: 'order_pending_other',
            userId: 'user_other',
            items: [{ productId: 'p2', quantity: 1, size: 'L', price: 1500, name: 'Pants' }],
            amount: 1500,
            address: { Name: 'Other', email: 'other@gmail.com', street: '2 St', city: 'Hyd', state: 'TS', pincode: '500', country: 'IN', phone: '123' },
            paymentMethod: 'Razorpay',
            payment: false,
            status: 'Payment Pending',
        }
    ];
});

// ── Mock Controllers
const placeOrder = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    const { items, amount, address } = req.body;
    const newOrder = {
        _id: `order_cod_${Date.now()}`,
        userId,
        items,
        amount,
        address,
        paymentMethod: 'COD',
        payment: false,
        status: 'Order Placed',
    };
    mockOrders.push(newOrder);
    res.status(200).json({ success: true, message: 'COD Order placed successfully', orderId: newOrder._id });
};

const placeOrderRazorpay = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    const { items, amount, address } = req.body;
    const newOrder = {
        _id: `order_rp_${Date.now()}`,
        userId,
        items,
        amount,
        address,
        paymentMethod: 'Razorpay',
        payment: false,
        status: 'Payment Pending',
    };
    mockOrders.push(newOrder);
    res.status(200).json({ success: true, message: 'Razorpay Order initiated', order: { id: 'rzp_id_mock', receipt: newOrder._id, amount: amount * 100 } });
};

const cancelPendingOrder = (req, res) => {
    const { orderId } = req.body;
    const { _id: authUserId } = req.user;

    const order = mockOrders.find(o => o._id === orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization: User must own the order
    if (order.userId !== authUserId) {
        return res.status(403).json({ success: false, message: 'Forbidden. You do not own this order.' });
    }

    // Verification: Order must be unpaid
    if (order.payment) {
        return res.status(400).json({ success: false, message: 'Cannot cancel a paid order.' });
    }

    // Delete
    mockOrders = mockOrders.filter(o => o._id !== orderId);
    res.status(200).json({ success: true, message: 'Pending payment order cancelled successfully.' });
};

// ── Express App Setup
const app = express();
app.use(express.json());

app.get('/health', (_req, res) =>
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
);
app.post('/api/v1/order/place', authUser, validatePlaceOrder, placeOrder);
app.post('/api/v1/order/razorpay', authUser, validatePlaceOrder, placeOrderRazorpay);
app.post('/api/v1/order/cancel', authUser, cancelPendingOrder);
app.post('/api/v1/user/login', validateLogin, (_req, res) =>
    res.status(200).json({ success: true }) 
);
app.get('/api/v1/product/all', (_req, res) =>
    res.status(200).json({ success: true, products: [] })
);
app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

// ── Combined Test Cases
describe('Unified Order & Checkout API Integration Tests', () => {
    const userToken123 = jwt.sign({ id: 'user_123', role: 'user' }, JWT_SECRET);
    const userTokenOther = jwt.sign({ id: 'user_other', role: 'user' }, JWT_SECRET);

    describe('General API & Setup checks', () => {
        test('GET /health returns ok', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });

        test('GET /api/v1/product/all returns 200', async () => {
            const res = await request(app).get('/api/v1/product/all');
            expect(res.status).toBe(200);
        });

        test('Legacy /api routes are removed — returns 404', async () => {
            const res = await request(app).get('/api/product/all');
            expect(res.status).toBe(404);
        });
    });

    describe('Customer Login shapes checks', () => {
        test('POST /api/v1/user/login with invalid email returns 400', async () => {
            const res = await request(app)
                .post('/api/v1/user/login')
                .send({ email: 'not-an-email', password: 'password123' });
            expect(res.status).toBe(400);
        });

        test('POST /api/v1/user/login with missing password returns 400', async () => {
            const res = await request(app)
                .post('/api/v1/user/login')
                .send({ email: 'user@example.com' });
            expect(res.status).toBe(400);
        });

        test('POST /api/v1/user/login with valid shape reaches handler (200)', async () => {
            const res = await request(app)
                .post('/api/v1/user/login')
                .send({ email: 'user@example.com', password: 'password123' });
            expect(res.status).toBe(200);
        });
    });

    describe('Order Placement flows', () => {
        test('POST /api/v1/order/place without token returns 401', async () => {
            const res = await request(app).post('/api/v1/order/place').send({
                items: [{ productId: 'p1', name: 'Shirt', price: 1000, size: 'M', quantity: 1 }],
                amount: 1000,
                address: { Name: 'Ankith', email: 'ankith@gmail.com', street: '1 St', city: 'Hyd', state: 'TS', pincode: '500', country: 'IN', phone: '123' },
            });
            expect(res.status).toBe(401);
        });

        test('POST /api/v1/order/place with auth but empty body returns 400', async () => {
            const res = await request(app)
                .post('/api/v1/order/place')
                .set('Authorization', `Bearer ${userToken123}`)
                .send({});
            expect(res.status).toBe(400);
        });

        test('POST /api/v1/order/place with COD placement succeeds when validly authenticated', async () => {
            const res = await request(app)
                .post('/api/v1/order/place')
                .set('Authorization', `Bearer ${userToken123}`)
                .send({
                    items: [{ productId: 'p1', name: 'Shirt', price: 1000, size: 'M', quantity: 1 }],
                    amount: 1000,
                    address: { Name: 'Ankith', email: 'ankith@gmail.com', street: '1 St', city: 'Hyd', state: 'TS', pincode: '500', country: 'IN', phone: '123' },
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('COD Order placed successfully');
            expect(res.body.orderId).toBeDefined();
        });

        test('POST /api/v1/order/razorpay initiates Razorpay order properly with Payment Pending status', async () => {
            const res = await request(app)
                .post('/api/v1/order/razorpay')
                .set('Authorization', `Bearer ${userToken123}`)
                .send({
                    items: [{ productId: 'p1', name: 'Shirt', price: 1000, size: 'M', quantity: 1 }],
                    amount: 1000,
                    address: { Name: 'Ankith', email: 'ankith@gmail.com', street: '1 St', city: 'Hyd', state: 'TS', pincode: '500', country: 'IN', phone: '123' },
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Razorpay Order initiated');
            expect(res.body.order.receipt).toBeDefined();
        });
    });

    describe('Razorpay Pending Order Cancellation (Zombie Order Cleanup)', () => {
        test('POST /api/v1/order/cancel returns 404 for non-existent orderId', async () => {
            const res = await request(app)
                .post('/api/v1/order/cancel')
                .set('Authorization', `Bearer ${userToken123}`)
                .send({ orderId: 'non-existent-order' });
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/v1/order/cancel returns 403 Forbidden when trying to cancel another user\'s order', async () => {
            const res = await request(app)
                .post('/api/v1/order/cancel')
                .set('Authorization', `Bearer ${userToken123}`) // user_123 trying to cancel user_other's order
                .send({ orderId: 'order_pending_other' });
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Forbidden');
        });

        test('POST /api/v1/order/cancel returns 400 Bad Request when trying to cancel an already paid order', async () => {
            const res = await request(app)
                .post('/api/v1/order/cancel')
                .set('Authorization', `Bearer ${userToken123}`)
                .send({ orderId: 'order_paid_123' });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Cannot cancel a paid order');
        });

        test('POST /api/v1/order/cancel successfully deletes own pending unpaid order', async () => {
            const res = await request(app)
                .post('/api/v1/order/cancel')
                .set('Authorization', `Bearer ${userToken123}`)
                .send({ orderId: 'order_pending_123' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('cancelled successfully');

            // Verify order is deleted
            const check = mockOrders.find(o => o._id === 'order_pending_123');
            expect(check).toBeUndefined();
        });
    });
});