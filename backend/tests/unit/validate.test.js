import { jest } from '@jest/globals';
import Joi from 'joi';

// ── Inline the validate factory (no server boot) ────────────────────────────
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return res.status(400).json({ success: false, message: messages });
    }
    next();
};

const validators = {
    validateRegister: validate(Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
    })),
    validateLogin: validate(Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    })),
    validateOtp: validate(Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required(),
    })),
    validateCartAdd: validate(Joi.object({
        itemId: Joi.string().required(),
        size: Joi.string().optional(),
        quantity: Joi.number().integer().min(1).max(99).default(1),
    })),
    validateCartRemove: validate(Joi.object({
        itemId: Joi.string().required(),
        size: Joi.string().optional(),
    })),
    validatePlaceOrder: validate(Joi.object({
        items: Joi.array().items(Joi.object({
            productId: Joi.string().required(),
            name: Joi.string().required(),
            quantity: Joi.number().integer().min(1).max(100).required(),
            price: Joi.number().positive().required(),
        })).min(1).required(),
        amount: Joi.number().positive().required(),
        address: Joi.object({
            Name: Joi.string().required(),
            street: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            pincode: Joi.string().required(),
            country: Joi.string().required(),
            phone: Joi.string().required(),
        }).required(),
    }).options({ allowUnknown: true })),
};

// ── Mock helpers ─────────────────────────────────────────────────────────────
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const run = (validator, body) => {
    const req = { body };
    const res = mockRes();
    const next = jest.fn();
    validator(req, res, next);
    return { res, next };
};

// ── validateRegister ─────────────────────────────────────────────────────────
describe('validateRegister', () => {
    const v = validators.validateRegister;

    test('passes with valid payload', () => {
        const { next } = run(v, { name: 'Priya', email: 'p@aharyas.com', password: 'Secret123' });
        expect(next).toHaveBeenCalled();
    });
    test('rejects short name', () => {
        const { res } = run(v, { name: 'A', email: 'p@a.com', password: 'Secret123' });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('rejects invalid email', () => {
        const { res } = run(v, { name: 'Priya', email: 'not-an-email', password: 'Secret123' });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('rejects short password', () => {
        const { res } = run(v, { name: 'Priya', email: 'p@a.com', password: '123' });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('collects all validation errors at once', () => {
        const { res } = run(v, {});
        const body = res.json.mock.calls[0][0];
        expect(body.message).toMatch(/name/i);
        expect(body.message).toMatch(/email/i);
        expect(body.message).toMatch(/password/i);
    });
});

// ── validateLogin ─────────────────────────────────────────────────────────────
describe('validateLogin', () => {
    const v = validators.validateLogin;

    test('passes with valid payload', () => {
        const { next } = run(v, { email: 'p@aharyas.com', password: 'any' });
        expect(next).toHaveBeenCalled();
    });
    test('rejects missing password', () => {
        const { res } = run(v, { email: 'p@a.com' });
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ── validateOtp ───────────────────────────────────────────────────────────────
describe('validateOtp', () => {
    const v = validators.validateOtp;

    test('passes with 6-digit OTP', () => {
        const { next } = run(v, { email: 'p@a.com', otp: '123456' });
        expect(next).toHaveBeenCalled();
    });
    test('rejects 5-digit OTP', () => {
        const { res } = run(v, { email: 'p@a.com', otp: '12345' });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('rejects 7-digit OTP', () => {
        const { res } = run(v, { email: 'p@a.com', otp: '1234567' });
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ── validateCartAdd ───────────────────────────────────────────────────────────
describe('validateCartAdd', () => {
    const v = validators.validateCartAdd;

    test('passes minimal valid payload', () => {
        const { next } = run(v, { itemId: 'abc123' });
        expect(next).toHaveBeenCalled();
    });
    test('rejects quantity 0', () => {
        const { res } = run(v, { itemId: 'abc123', quantity: 0 });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('rejects quantity > 99', () => {
        const { res } = run(v, { itemId: 'abc123', quantity: 100 });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('rejects missing itemId', () => {
        const { res } = run(v, { quantity: 1 });
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ── validateCartRemove ────────────────────────────────────────────────────────
describe('validateCartRemove', () => {
    const v = validators.validateCartRemove;

    test('passes with itemId only', () => {
        const { next } = run(v, { itemId: 'abc123' });
        expect(next).toHaveBeenCalled();
    });
    test('passes with itemId + size', () => {
        const { next } = run(v, { itemId: 'abc123', size: 'M' });
        expect(next).toHaveBeenCalled();
    });
    test('rejects missing itemId', () => {
        const { res } = run(v, {});
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ── validatePlaceOrder ────────────────────────────────────────────────────────
describe('validatePlaceOrder', () => {
    const v = validators.validatePlaceOrder;

    const validOrder = {
        items: [{ productId: 'p1', name: 'Kurta', quantity: 1, price: 999 }],
        amount: 999,
        address: { Name: 'Priya', street: '1 MG Rd', city: 'Hyd', state: 'TS', pincode: '500001', country: 'IN', phone: '9876543210' },
    };

    test('passes with valid order', () => {
        const { next } = run(v, validOrder);
        expect(next).toHaveBeenCalled();
    });
    test('rejects empty items array', () => {
        const { res } = run(v, { ...validOrder, items: [] });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('rejects negative amount', () => {
        const { res } = run(v, { ...validOrder, amount: -1 });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('rejects missing address fields', () => {
        const { res } = run(v, { ...validOrder, address: { Name: 'Priya' } });
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('response body has success: false', () => {
        const { res } = run(v, {});
        const body = res.json.mock.calls[0][0];
        expect(body.success).toBe(false);
        expect(typeof body.message).toBe('string');
    });
});
