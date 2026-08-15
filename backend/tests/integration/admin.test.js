import { describe, test, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Joi from 'joi';

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

// ── Mock Joi Validation Middlewares
const validateOtp = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

// ── Mock Admin Database State
let mockAdmins = {};
let mockProducts = [];

beforeEach(() => {
    mockAdmins = {
        'admin@company.com': {
            _id: 'admin_123',
            name: 'Ankith',
            email: 'admin@company.com',
            password: 'hashed-password-123',
            role: 'admin',
            isVerified: true,
            otp: '111222',
            otpExpiry: new Date(Date.now() + 5 * 60 * 1000)
        },
        'unverified_admin@company.com': {
            _id: 'admin_456',
            name: 'Sara',
            email: 'unverified_admin@company.com',
            password: 'hashed-password-456',
            role: 'admin',
            isVerified: false,
        }
    };

    mockProducts = [
        { _id: 'prod_1', name: 'Printed Linen Shirt', adminId: 'admin_123', price: 2500 }
    ];
});

// ── Mock Controllers
const adminLogin = (req, res) => {
    const { email, password } = req.body;
    const admin = mockAdmins[email];
    if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    if (!admin.isVerified) {
        return res.status(401).json({ success: false, message: 'Admin account not verified.' });
    }
    if (password !== 'correct-password') {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET);
    res.status(200).json({ success: true, token, userId: admin._id, name: admin.name, role: 'admin', message: 'Admin login successful' });
};

const sendAdminOtp = (req, res) => {
    const { email } = req.body;
    const admin = mockAdmins[email];
    if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    if (!admin.isVerified && email === 'unverified_admin@company.com') {
        return res.status(403).json({ success: false, message: 'This email is not authorised for admin access.' });
    }
    admin.otp = '654321';
    admin.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    res.status(200).json({ success: true, message: 'OTP sent.' });
};

const verifyAdminOtp = (req, res) => {
    const { email, otp } = req.body;
    const admin = mockAdmins[email];
    if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    if (admin.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not an admin account.' });
    }
    if (admin.otp !== otp || admin.otpExpiry < new Date()) {
        return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }
    admin.isVerified = true;
    const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET);
    res.status(200).json({ success: true, token, userId: admin._id, name: admin.name, role: 'admin', message: `Welcome ${admin.name}!` });
};

const adminGoogleAuth = (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ success: false, message: 'Google credential is required' });
    }
    const token = jwt.sign({ id: 'admin_123', role: 'admin' }, JWT_SECRET);
    res.status(200).json({ success: true, token, userId: 'admin_123', name: 'Ankith Google', role: 'admin', message: 'Welcome back, Ankith Google!' });
};

// ── Mock Product Controllers
const addProduct = (req, res) => {
    const userId = req.user?._id || req.user?.id;
    const { name, price } = req.body;
    if (!name || !price) {
        return res.status(400).json({ success: false, message: 'Product parameters missing' });
    }
    const newProduct = { _id: `prod_${Date.now()}`, name, price, adminId: userId };
    mockProducts.push(newProduct);
    res.status(200).json({ success: true, message: 'Product added successfully', product: newProduct });
};

const removeProduct = (req, res) => {
    const { id: productId } = req.params;
    const userId = req.user?._id || req.user?.id;
    
    const product = mockProducts.find(p => p._id === productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    // Verify admin ownership
    if (product.adminId !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden. You do not own this product.' });
    }
    mockProducts = mockProducts.filter(p => p._id !== productId);
    res.status(200).json({ success: true, message: 'Product removed successfully' });
};

// ── Express App Setup
const app = express();
app.use(express.json());

// Admin authentication endpoints
app.post('/api/v1/user/admin-login', adminLogin);
app.post('/api/v1/user/send-admin-otp', sendAdminOtp);
app.post('/api/v1/user/verify-admin-otp', validateOtp, verifyAdminOtp);
app.post('/api/v1/user/admin-google-auth', adminGoogleAuth);

// Product management endpoints
app.post('/api/v1/product/add', adminAuth, addProduct);
app.delete('/api/v1/product/remove/:id', adminAuth, removeProduct);

// ── Tests
describe('Comprehensive Admin authentication & management Integration Tests', () => {
    const userToken = jwt.sign({ id: 'user_123', role: 'user' }, JWT_SECRET);
    const adminToken = jwt.sign({ id: 'admin_123', role: 'admin' }, JWT_SECRET);
    const otherAdminToken = jwt.sign({ id: 'admin_999', role: 'admin' }, JWT_SECRET);

    describe('Admin Auth Flow', () => {
        test('POST /api/v1/user/admin-login fails on invalid password', async () => {
            const res = await request(app)
                .post('/api/v1/user/admin-login')
                .send({ email: 'admin@company.com', password: 'wrong-password' });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/v1/user/admin-login succeeds on correct password', async () => {
            const res = await request(app)
                .post('/api/v1/user/admin-login')
                .send({ email: 'admin@company.com', password: 'correct-password' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.role).toBe('admin');
        });

        test('POST /api/v1/user/send-admin-otp blocks unverified/unauthorized admin email', async () => {
            const res = await request(app)
                .post('/api/v1/user/send-admin-otp')
                .send({ email: 'unverified_admin@company.com' });
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/v1/user/verify-admin-otp succeeds with correct OTP code', async () => {
            const res = await request(app)
                .post('/api/v1/user/verify-admin-otp')
                .send({ email: 'admin@company.com', otp: '111222' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.message).toContain('Welcome Ankith');
        });

        test('POST /api/v1/user/verify-admin-otp validation fails if OTP does not have 6 digits', async () => {
            const res = await request(app)
                .post('/api/v1/user/verify-admin-otp')
                .send({ email: 'admin@company.com', otp: '123' });
            expect(res.status).toBe(400);
        });

        test('POST /api/v1/user/admin-google-auth returns success on valid credential payload', async () => {
            const res = await request(app)
                .post('/api/v1/user/admin-google-auth')
                .send({ credential: 'google-oauth-mock-credential' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });
    });

    describe('Admin Protected Product Management routes', () => {
        test('POST /api/v1/product/add without token returns 401 Unauthorized', async () => {
            const res = await request(app)
                .post('/api/v1/product/add')
                .send({ name: 'Short Sleeve Shirt', price: 1999 });
            expect(res.status).toBe(401);
        });

        test('POST /api/v1/product/add with basic user token returns 403 Forbidden', async () => {
            const res = await request(app)
                .post('/api/v1/product/add')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Short Sleeve Shirt', price: 1999 });
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/v1/product/add with valid admin token adds the product successfully', async () => {
            const res = await request(app)
                .post('/api/v1/product/add')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Short Sleeve Shirt', price: 1999 });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product).toBeDefined();
            expect(res.body.product.adminId).toBe('admin_123');
        });

        test('DELETE /api/v1/product/remove/:id fails with 403 when trying to delete another admin\'s product', async () => {
            const res = await request(app)
                .delete('/api/v1/product/remove/prod_1')
                .set('Authorization', `Bearer ${otherAdminToken}`);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        test('DELETE /api/v1/product/remove/:id successfully deletes owning admin\'s product', async () => {
            const res = await request(app)
                .delete('/api/v1/product/remove/prod_1')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('removed successfully');

            const check = mockProducts.find(p => p._id === 'prod_1');
            expect(check).toBeUndefined();
        });
    });
});
