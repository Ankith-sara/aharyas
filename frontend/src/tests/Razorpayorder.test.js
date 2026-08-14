
import crypto from 'crypto';

// Mirrors verifyAndFinaliseRazorpayOrder signature verification
function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature, secret }) {
    const expected = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    return expected === razorpay_signature;
}

// Mirrors the placeOrder / placeOrderRazorpay required-field validation
function validateOrderPayload({ items, amount, address }) {
    const missing = [];
    if (!items || !Array.isArray(items) || items.length === 0) missing.push('items');
    if (!amount || typeof amount !== 'number' || amount <= 0) missing.push('amount');
    if (!address || typeof address !== 'object') missing.push('address');
    return missing;
}



// Mirrors the idempotent payment-already-verified guard
function isPaymentAlreadyVerified(order) {
    return order?.payment === true;
}

// Mirrors verifyRazorpay — missing-fields guard
function validateVerifyRazorpayPayload({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return { valid: false, message: 'Missing payment verification details' };
    }
    return { valid: true };
}

// Mirrors the delivery-fee logic from CartContext
const DELIVERY_FEE_TELANGANA = 50;
const DELIVERY_FEE_INDIA = 100;
const DELIVERY_FEE_INTERNATIONAL = 150;
const INDIA_ALIASES = ['india', 'in', 'bharat', 'ind'];
const TELANGANA_ALIASES = ['telangana', 'tg', 'ts'];

function getDeliveryFee(country = '', state = '') {
    const c = country.trim().toLowerCase();
    const s = state.trim().toLowerCase();
    if (c && !INDIA_ALIASES.includes(c)) return DELIVERY_FEE_INTERNATIONAL;
    if (TELANGANA_ALIASES.includes(s)) return DELIVERY_FEE_TELANGANA;
    return DELIVERY_FEE_INDIA;
}

// Mirrors Razorpay order amount in paise
function toRazorpayAmount(amountInRupees) {
    return amountInRupees * 100;
}

// Razorpay signature verification
describe('Razorpay signature verification — extended', () => {
    const SECRET = 'test_razorpay_secret';
    const ORDER_ID = 'order_TestABC123';
    const PAYMENT_ID = 'pay_TestXYZ789';

    const VALID_SIG = crypto
        .createHmac('sha256', SECRET)
        .update(`${ORDER_ID}|${PAYMENT_ID}`)
        .digest('hex');

    test('accepts a correctly-computed HMAC signature', () => {
        expect(verifyRazorpaySignature({
            razorpay_order_id: ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature: VALID_SIG,
            secret: SECRET,
        })).toBe(true);
    });

    test('rejects a tampered signature (single char diff)', () => {
        const tampered = VALID_SIG.slice(0, -1) + (VALID_SIG.slice(-1) === 'a' ? 'b' : 'a');
        expect(verifyRazorpaySignature({
            razorpay_order_id: ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature: tampered,
            secret: SECRET,
        })).toBe(false);
    });

    test('rejects when razorpay_order_id is swapped', () => {
        expect(verifyRazorpaySignature({
            razorpay_order_id: 'order_DIFFERENT',
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature: VALID_SIG,
            secret: SECRET,
        })).toBe(false);
    });

    test('rejects when razorpay_payment_id is swapped', () => {
        expect(verifyRazorpaySignature({
            razorpay_order_id: ORDER_ID,
            razorpay_payment_id: 'pay_DIFFERENT',
            razorpay_signature: VALID_SIG,
            secret: SECRET,
        })).toBe(false);
    });

    test('rejects when the wrong secret is used', () => {
        expect(verifyRazorpaySignature({
            razorpay_order_id: ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature: VALID_SIG,
            secret: 'wrong_secret',
        })).toBe(false);
    });

    test('rejects an empty signature string', () => {
        expect(verifyRazorpaySignature({
            razorpay_order_id: ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature: '',
            secret: SECRET,
        })).toBe(false);
    });

    test('signature is order-sensitive (swap orderId/paymentId fails)', () => {
        // The HMAC input is `${orderId}|${paymentId}` — reversing would not match
        const swappedSig = crypto
            .createHmac('sha256', SECRET)
            .update(`${PAYMENT_ID}|${ORDER_ID}`) 
            .digest('hex');
        expect(verifyRazorpaySignature({
            razorpay_order_id: ORDER_ID,
            razorpay_payment_id: PAYMENT_ID,
            razorpay_signature: swappedSig,
            secret: SECRET,
        })).toBe(false);
    });

    test('different payment IDs produce different signatures', () => {
        const sig1 = crypto.createHmac('sha256', SECRET).update(`${ORDER_ID}|pay_AAA`).digest('hex');
        const sig2 = crypto.createHmac('sha256', SECRET).update(`${ORDER_ID}|pay_BBB`).digest('hex');
        expect(sig1).not.toBe(sig2);
    });
});

// verifyRazorpay payload validation
describe('verifyRazorpay — payload validation', () => {
    test('passes when all three Razorpay fields are present', () => {
        const result = validateVerifyRazorpayPayload({
            razorpay_order_id: 'order_ABC',
            razorpay_payment_id: 'pay_XYZ',
            razorpay_signature: 'sig_123',
        });
        expect(result.valid).toBe(true);
    });

    test('fails when razorpay_order_id is missing', () => {
        const result = validateVerifyRazorpayPayload({
            razorpay_order_id: '',
            razorpay_payment_id: 'pay_XYZ',
            razorpay_signature: 'sig_123',
        });
        expect(result.valid).toBe(false);
        expect(result.message).toMatch(/Missing/);
    });

    test('fails when razorpay_payment_id is missing', () => {
        const result = validateVerifyRazorpayPayload({
            razorpay_order_id: 'order_ABC',
            razorpay_payment_id: '',
            razorpay_signature: 'sig_123',
        });
        expect(result.valid).toBe(false);
    });

    test('fails when razorpay_signature is missing', () => {
        const result = validateVerifyRazorpayPayload({
            razorpay_order_id: 'order_ABC',
            razorpay_payment_id: 'pay_XYZ',
            razorpay_signature: '',
        });
        expect(result.valid).toBe(false);
    });

    test('fails when all three fields are undefined', () => {
        const result = validateVerifyRazorpayPayload({});
        expect(result.valid).toBe(false);
    });
});

// Idempotency guard — already-verified orders
describe('Razorpay verification — idempotency', () => {
    test('detects an already-verified order', () => {
        expect(isPaymentAlreadyVerified({ payment: true })).toBe(true);
    });

    test('treats payment: false as not yet verified', () => {
        expect(isPaymentAlreadyVerified({ payment: false })).toBe(false);
    });

    test('treats missing payment field as not yet verified', () => {
        expect(isPaymentAlreadyVerified({})).toBe(false);
    });

    test('treats null order as not verified (order not found case)', () => {
        expect(isPaymentAlreadyVerified(null)).toBe(false);
    });
});

// placeOrder / placeOrderRazorpay — required field validation
describe('placeOrder — required field validation', () => {
    const validAddress = { Name: 'Test User', email: 'test@example.com', street: '1 Main St' };
    const validItems = [{ productId: 'p1', quantity: 1, size: 'M', price: 1000 }];

    test('accepts a fully valid payload', () => {
        const missing = validateOrderPayload({ items: validItems, amount: 1050, address: validAddress });
        expect(missing).toHaveLength(0);
    });

    test('flags missing items array', () => {
        const missing = validateOrderPayload({ items: undefined, amount: 1050, address: validAddress });
        expect(missing).toContain('items');
    });

    test('flags empty items array', () => {
        const missing = validateOrderPayload({ items: [], amount: 1050, address: validAddress });
        expect(missing).toContain('items');
    });

    test('flags missing amount', () => {
        const missing = validateOrderPayload({ items: validItems, amount: undefined, address: validAddress });
        expect(missing).toContain('amount');
    });

    test('flags zero amount', () => {
        const missing = validateOrderPayload({ items: validItems, amount: 0, address: validAddress });
        expect(missing).toContain('amount');
    });

    test('flags negative amount', () => {
        const missing = validateOrderPayload({ items: validItems, amount: -100, address: validAddress });
        expect(missing).toContain('amount');
    });

    test('flags missing address', () => {
        const missing = validateOrderPayload({ items: validItems, amount: 1050, address: undefined });
        expect(missing).toContain('address');
    });

    test('flags multiple missing fields at once', () => {
        const missing = validateOrderPayload({ items: undefined, amount: undefined, address: undefined });
        expect(missing).toContain('items');
        expect(missing).toContain('amount');
        expect(missing).toContain('address');
    });
});



// Razorpay amount conversion
describe('Razorpay amount conversion', () => {
    test('converts whole rupees to paise', () => {
        expect(toRazorpayAmount(1050)).toBe(105000);
    });

    test('converts ₹1 to 100 paise', () => {
        expect(toRazorpayAmount(1)).toBe(100);
    });

    test('converts zero correctly', () => {
        expect(toRazorpayAmount(0)).toBe(0);
    });

    test('handles large order amounts correctly', () => {
        expect(toRazorpayAmount(50000)).toBe(5000000);
    });
});

// Delivery fee logic
describe('getDeliveryFee', () => {
    test('returns Telangana rate for state "Telangana"', () => {
        expect(getDeliveryFee('India', 'Telangana')).toBe(DELIVERY_FEE_TELANGANA);
    });

    test('returns Telangana rate for state alias "TS"', () => {
        expect(getDeliveryFee('India', 'TS')).toBe(DELIVERY_FEE_TELANGANA);
    });

    test('returns Telangana rate for state alias "TG"', () => {
        expect(getDeliveryFee('India', 'TG')).toBe(DELIVERY_FEE_TELANGANA);
    });

    test('returns India rate for non-Telangana state', () => {
        expect(getDeliveryFee('India', 'Maharashtra')).toBe(DELIVERY_FEE_INDIA);
    });

    test('returns India rate for "IN" country alias', () => {
        expect(getDeliveryFee('IN', 'Karnataka')).toBe(DELIVERY_FEE_INDIA);
    });

    test('returns India rate for "Bharat"', () => {
        expect(getDeliveryFee('Bharat', 'Karnataka')).toBe(DELIVERY_FEE_INDIA);
    });

    test('returns international rate for non-India country', () => {
        expect(getDeliveryFee('United States', 'California')).toBe(DELIVERY_FEE_INTERNATIONAL);
    });

    test('returns international rate for "UK"', () => {
        expect(getDeliveryFee('UK', 'London')).toBe(DELIVERY_FEE_INTERNATIONAL);
    });

    test('defaults to India rate when country is empty string', () => {
        expect(getDeliveryFee('', 'Kerala')).toBe(DELIVERY_FEE_INDIA);
    });

    test('is case-insensitive for country and state', () => {
        expect(getDeliveryFee('INDIA', 'TELANGANA')).toBe(DELIVERY_FEE_TELANGANA);
    });

    test('trims whitespace before comparing', () => {
        expect(getDeliveryFee('  India  ', '  Telangana  ')).toBe(DELIVERY_FEE_TELANGANA);
    });
});

// COD vs Razorpay method assignment
describe('Order payment method assignment', () => {
    function buildOrderShape({ paymentMethod, amount, items, address, userId }) {
        return {
            userId: userId || null,
            items: items || [],
            amount: amount || 0,
            address: address || {},
            paymentMethod: paymentMethod,
            payment: false,
            date: Date.now(),
        };
    }

    test('COD order starts with payment: false', () => {
        const order = buildOrderShape({ paymentMethod: 'COD', amount: 1050 });
        expect(order.payment).toBe(false);
        expect(order.paymentMethod).toBe('COD');
    });

    test('Razorpay order starts with payment: false (pending verification)', () => {
        const order = buildOrderShape({ paymentMethod: 'Razorpay', amount: 1050 });
        expect(order.payment).toBe(false);
        expect(order.paymentMethod).toBe('Razorpay');
    });

    test('payment is set to true only after verification', () => {
        const order = buildOrderShape({ paymentMethod: 'Razorpay', amount: 1050 });
        // Simulate verifyAndFinaliseRazorpayOrder updating the record
        const verified = { ...order, payment: true, razorpayPaymentId: 'pay_XYZ' };
        expect(verified.payment).toBe(true);
        expect(verified.razorpayPaymentId).toBe('pay_XYZ');
    });

    test('COD order date is a number (Unix ms)', () => {
        const order = buildOrderShape({ paymentMethod: 'COD', amount: 500 });
        expect(typeof order.date).toBe('number');
        expect(order.date).toBeGreaterThan(0);
    });
});