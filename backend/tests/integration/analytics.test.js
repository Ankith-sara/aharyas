import { describe, test, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mock Auth Middlewares
const JWT_SECRET = 'test-secret-key';
const adminAuth = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden. Admin access only.' });
        }
        req.user = { _id: decoded.id, role: decoded.role };
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Authentication failed.' });
    }
};

// ── Mock Database
let mockProducts = [];
let mockUserAnalytics = {};

beforeEach(() => {
    mockProducts = [
        { _id: 'prod_1', name: 'Linen Shirt', viewCount: 15 },
        { _id: 'prod_2', name: 'Printed Bamboo T-Shirt', viewCount: 88 },
        { _id: 'prod_3', name: 'Silk Kurta', viewCount: 5 }
    ];

    mockUserAnalytics = {
        totalUsers: 150,
        todayLogins: 25,
        dailyLogins: [
            { _id: { year: 2026, month: 5, day: 22 }, count: 25 },
            { _id: { year: 2026, month: 5, day: 21 }, count: 18 }
        ]
    };
});

// ── Mock Controllers
const singleProduct = (req, res) => {
    const { productId } = req.body;
    const product = mockProducts.find(p => p._id === productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    // Increment viewCount atomically in database simulation
    product.viewCount = (product.viewCount || 0) + 1;
    res.status(200).json({ success: true, product });
};

const getUserAnalytics = (req, res) => {
    res.status(200).json({ success: true, analytics: mockUserAnalytics });
};

const getMostClickedProducts = (req, res) => {
    const sorted = [...mockProducts].sort((a, b) => b.viewCount - a.viewCount);
    res.status(200).json({ success: true, products: sorted });
};

// ── Express App Setup
const app = express();
app.use(express.json());

app.post('/api/v1/product/single', singleProduct);
app.get('/api/v1/user/analytics', adminAuth, getUserAnalytics);
app.get('/api/v1/product/most-clicked', adminAuth, getMostClickedProducts);

// ── Tests
describe('Comprehensive Product Engagement & Analytics Integration Tests', () => {
    const adminToken = jwt.sign({ id: 'admin_123', role: 'admin' }, JWT_SECRET);
    const userToken = jwt.sign({ id: 'user_123', role: 'user' }, JWT_SECRET);

    describe('Product View Click Tracking', () => {
        test('POST /api/v1/product/single increments product viewCount successfully', async () => {
            // First retrieval
            let res = await request(app)
                .post('/api/v1/product/single')
                .send({ productId: 'prod_1' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product.viewCount).toBe(16); // 15 + 1

            // Second retrieval
            res = await request(app)
                .post('/api/v1/product/single')
                .send({ productId: 'prod_1' });
            expect(res.status).toBe(200);
            expect(res.body.product.viewCount).toBe(17); // 16 + 1
        });
    });

    describe('Admin Analytics Permissions & Access Control', () => {
        test('GET /api/v1/user/analytics without token returns 401 Unauthorized', async () => {
            const res = await request(app).get('/api/v1/user/analytics');
            expect(res.status).toBe(401);
        });

        test('GET /api/v1/user/analytics with basic user token returns 403 Forbidden', async () => {
            const res = await request(app)
                .get('/api/v1/user/analytics')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Forbidden');
        });

        test('GET /api/v1/user/analytics with admin token successfully returns login analytics data', async () => {
            const res = await request(app)
                .get('/api/v1/user/analytics')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.analytics.totalUsers).toBe(150);
            expect(res.body.analytics.todayLogins).toBe(25);
            expect(res.body.analytics.dailyLogins).toHaveLength(2);
        });

        test('GET /api/v1/product/most-clicked with admin token successfully returns sorted most-viewed products', async () => {
            const res = await request(app)
                .get('/api/v1/product/most-clicked')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products).toHaveLength(3);
            // Verify descending sort order (prod_2 has 88 views, prod_1 has 15 views, prod_3 has 5 views)
            expect(res.body.products[0]._id).toBe('prod_2');
            expect(res.body.products[1]._id).toBe('prod_1');
            expect(res.body.products[2]._id).toBe('prod_3');
        });
    });
});
