import { describe, test, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Joi from 'joi';

// ── Mock Auth Middleware
const JWT_SECRET = 'test-secret-key';
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

// ── Mock Validation Middlewares
const validateCartAdd = (req, res, next) => {
    const schema = Joi.object({
        productId: Joi.string().required(),
        size: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateCartUpdate = (req, res, next) => {
    const schema = Joi.object({
        productId: Joi.string().required(),
        size: Joi.string().required(),
        quantity: Joi.number().integer().min(0).required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

// ── Mock DB Cart Store for simulation
const mockCarts = {};
const mockWishlists = {};

// ── Mock Controllers
const getUserCart = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    res.status(200).json({ success: true, cartData: mockCarts[userId] || {} });
};

const addToCart = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    const { productId, size, quantity } = req.body;
    if (!mockCarts[userId]) mockCarts[userId] = {};
    if (!mockCarts[userId][productId]) mockCarts[userId][productId] = {};
    mockCarts[userId][productId][size] = (mockCarts[userId][productId][size] || 0) + quantity;
    res.status(200).json({ success: true, message: 'Added to cart', cartData: mockCarts[userId] });
};

const updateCart = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    const { productId, size, quantity } = req.body;
    if (!mockCarts[userId]) mockCarts[userId] = {};
    if (!mockCarts[userId][productId]) mockCarts[userId][productId] = {};
    if (quantity === 0) {
        delete mockCarts[userId][productId][size];
        if (Object.keys(mockCarts[userId][productId]).length === 0) {
            delete mockCarts[userId][productId];
        }
    } else {
        mockCarts[userId][productId][size] = quantity;
    }
    res.status(200).json({ success: true, message: 'Updated cart', cartData: mockCarts[userId] });
};

const clearCart = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    mockCarts[userId] = {};
    res.status(200).json({ success: true, message: 'Cart cleared' });
};

const toggleWishlist = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({ success: false, message: 'productId required' });
    }
    if (!mockWishlists[userId]) mockWishlists[userId] = [];
    const index = mockWishlists[userId].indexOf(productId);
    if (index > -1) {
        mockWishlists[userId].splice(index, 1);
        res.status(200).json({ success: true, message: 'Removed from wishlist', isAdded: false });
    } else {
        mockWishlists[userId].push(productId);
        res.status(200).json({ success: true, message: 'Added to wishlist', isAdded: true });
    }
};

const getUserWishlist = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    res.status(200).json({ success: true, wishlist: mockWishlists[userId] || [] });
};

// ── Express App Setup
const app = express();
app.use(express.json());

// Cart routes
app.post('/api/v1/cart/get', authUser, getUserCart);
app.post('/api/v1/cart/add', authUser, validateCartAdd, addToCart);
app.post('/api/v1/cart/update', authUser, validateCartUpdate, updateCart);
app.post('/api/v1/cart/clear', authUser, clearCart);

// Wishlist routes
app.post('/api/v1/wishlist/toggle', authUser, toggleWishlist);
app.post('/api/v1/wishlist/get', authUser, getUserWishlist);

// ── Integration Tests
describe('Comprehensive Cart & Wishlist API Integration Tests', () => {
    const validUserToken = jwt.sign({ id: 'user_123', role: 'user' }, JWT_SECRET);
    const expiredOrBadToken = 'Bearer invalid-token';

    describe('Cart Authentication & Operations Protection', () => {
        test('POST /api/v1/cart/get without token returns 401 Unauthorized', async () => {
            const res = await request(app).post('/api/v1/cart/get');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/v1/cart/get with invalid token returns 401 Unauthorized', async () => {
            const res = await request(app)
                .post('/api/v1/cart/get')
                .set('Authorization', expiredOrBadToken);
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/v1/cart/get with valid auth gets user cart successfully', async () => {
            const res = await request(app)
                .post('/api/v1/cart/get')
                .set('Authorization', `Bearer ${validUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.cartData).toBeDefined();
        });

        test('POST /api/v1/cart/add returns 400 when parameters are missing', async () => {
            const res = await request(app)
                .post('/api/v1/cart/add')
                .set('Authorization', `Bearer ${validUserToken}`)
                .send({ productId: 'prod_999' }); // missing size & quantity
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/v1/cart/add adds an item successfully when authenticated', async () => {
            const res = await request(app)
                .post('/api/v1/cart/add')
                .set('Authorization', `Bearer ${validUserToken}`)
                .send({ productId: 'prod_abc', size: 'M', quantity: 2 });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Added to cart');
            expect(res.body.cartData['prod_abc']['M']).toBe(2);
        });

        test('POST /api/v1/cart/update modifies items or deletes them when quantity is 0', async () => {
            // Update quantity to 5
            let res = await request(app)
                .post('/api/v1/cart/update')
                .set('Authorization', `Bearer ${validUserToken}`)
                .send({ productId: 'prod_abc', size: 'M', quantity: 5 });
            expect(res.status).toBe(200);
            expect(res.body.cartData['prod_abc']['M']).toBe(5);

            // Delete item by updating quantity to 0
            res = await request(app)
                .post('/api/v1/cart/update')
                .set('Authorization', `Bearer ${validUserToken}`)
                .send({ productId: 'prod_abc', size: 'M', quantity: 0 });
            expect(res.status).toBe(200);
            expect(res.body.cartData['prod_abc']).toBeUndefined();
        });

        test('POST /api/v1/cart/clear empties user cart entirely', async () => {
            // Populate first
            await request(app)
                .post('/api/v1/cart/add')
                .set('Authorization', `Bearer ${validUserToken}`)
                .send({ productId: 'prod_clear_me', size: 'S', quantity: 1 });

            const res = await request(app)
                .post('/api/v1/cart/clear')
                .set('Authorization', `Bearer ${validUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const check = await request(app)
                .post('/api/v1/cart/get')
                .set('Authorization', `Bearer ${validUserToken}`);
            expect(check.body.cartData).toEqual({});
        });
    });

    describe('Wishlist Authentication & Toggle Protection', () => {
        test('POST /api/v1/wishlist/toggle without token returns 401 Unauthorized', async () => {
            const res = await request(app).post('/api/v1/wishlist/toggle').send({ productId: 'prod_123' });
            expect(res.status).toBe(401);
        });

        test('POST /api/v1/wishlist/toggle adds and then removes item on consecutive toggles', async () => {
            // Toggle 1: Add to wishlist
            let res = await request(app)
                .post('/api/v1/wishlist/toggle')
                .set('Authorization', `Bearer ${validUserToken}`)
                .send({ productId: 'prod_star' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Added to wishlist');
            expect(res.body.isAdded).toBe(true);

            // Verify active wishlist contains the item
            let check = await request(app)
                .post('/api/v1/wishlist/get')
                .set('Authorization', `Bearer ${validUserToken}`);
            expect(check.body.wishlist).toContain('prod_star');

            // Toggle 2: Remove from wishlist
            res = await request(app)
                .post('/api/v1/wishlist/toggle')
                .set('Authorization', `Bearer ${validUserToken}`)
                .send({ productId: 'prod_star' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Removed from wishlist');
            expect(res.body.isAdded).toBe(false);

            // Verify item has been deleted from wishlist
            check = await request(app)
                .post('/api/v1/wishlist/get')
                .set('Authorization', `Bearer ${validUserToken}`);
            expect(check.body.wishlist).not.toContain('prod_star');
        });
    });
});
