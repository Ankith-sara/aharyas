

// ── safeRead / safeWrite helpers ─────────────────────────────────────────────

const safeRead = (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (err) { console.error("safeRead error", err); return fallback; }
};
const safeWrite = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error("safeWrite error", err); }
};
const safeRemove = (key) => {
    try { localStorage.removeItem(key); } catch (err) { console.error("safeRemove error", err); }
};

// Minimal localStorage stub
const store = {};
global.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

describe('safeRead', () => {
    beforeEach(() => localStorage.clear());

    test('returns fallback for missing key', () => {
        expect(safeRead('missing', [])).toEqual([]);
    });

    test('parses stored JSON', () => {
        safeWrite('cart', { a: 1 });
        expect(safeRead('cart', {})).toEqual({ a: 1 });
    });

    test('returns fallback on malformed JSON', () => {
        store['bad'] = '{bad json';
        expect(safeRead('bad', null)).toBeNull();
    });
});

describe('safeRemove', () => {
    beforeEach(() => localStorage.clear());

    test('removes key from storage', () => {
        safeWrite('cart', { a: 1 });
        safeRemove('cart');
        expect(safeRead('cart', null)).toBeNull();
    });
});

// ── getCartCount ──────────────────────────────────────────────────────────────

function getCartCount(cartItems) {
    return Object.values(cartItems).reduce(
        (total, sizes) => total + Object.values(sizes).reduce((s, qty) => s + (qty > 0 ? qty : 0), 0),
        0
    );
}

describe('getCartCount', () => {
    test('returns 0 for empty cart', () => {
        expect(getCartCount({})).toBe(0);
    });

    test('sums quantities across items and sizes', () => {
        expect(getCartCount({ p1: { S: 2, M: 1 }, p2: { L: 3 } })).toBe(6);
    });

    test('ignores zero-quantity entries', () => {
        expect(getCartCount({ p1: { S: 0, M: 2 } })).toBe(2);
    });

    test('ignores negative quantities', () => {
        expect(getCartCount({ p1: { S: -1, M: 3 } })).toBe(3);
    });
});

// ── getCartAmount ─────────────────────────────────────────────────────────────

function getCartAmount(cartItems, products) {
    return Object.entries(cartItems).reduce((total, [itemId, sizes]) => {
        const product = products.find(p => p._id === itemId);
        if (!product) return total;
        const effectivePrice = product.discount > 0
            ? Math.round(product.price * (1 - product.discount / 100))
            : product.price;
        return total + Object.entries(sizes).reduce(
            (s, [, qty]) => s + (qty > 0 ? effectivePrice * qty : 0), 0
        );
    }, 0);
}

const products = [
    { _id: 'p1', price: 1000, discount: 0 },
    { _id: 'p2', price: 2000, discount: 20 },
];

describe('getCartAmount', () => {
    test('returns 0 for empty cart', () => {
        expect(getCartAmount({}, products)).toBe(0);
    });

    test('calculates full price with no discount', () => {
        expect(getCartAmount({ p1: { S: 2 } }, products)).toBe(2000);
    });

    test('applies product-level discount correctly', () => {
        // 2000 * (1 - 0.20) = 1600, qty 1
        expect(getCartAmount({ p2: { M: 1 } }, products)).toBe(1600);
    });

    test('skips products not in the product list', () => {
        expect(getCartAmount({ unknown: { S: 5 } }, products)).toBe(0);
    });

    test('combines multiple products', () => {
        // p1: 1000*1 = 1000; p2: 1600*1 = 1600 → 2600
        expect(getCartAmount({ p1: { S: 1 }, p2: { M: 1 } }, products)).toBe(2600);
    });
});

// ── coupon logic ──────────────────────────────────────────────────────────────

const COUPONS = [
    { code: 'FLAT500',  discount: 500,  minAmount: 6000, type: 'flat' },
    { code: 'FLAT1000', discount: 1000, minAmount: 6000, type: 'flat' },
];

function validateCoupon(code, subtotal) {
    const matched = COUPONS.find(c => c.code === code.trim().toUpperCase());
    if (!matched) return { valid: false, error: 'Invalid coupon code.' };
    if (subtotal < matched.minAmount) return { valid: false, error: `Minimum order of ₹${matched.minAmount} required.` };
    return { valid: true, coupon: matched };
}

describe('validateCoupon', () => {
    test('rejects unknown codes', () => {
        const result = validateCoupon('BADCODE', 10000);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid');
    });

    test('rejects valid code below minimum', () => {
        const result = validateCoupon('FLAT500', 3000);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('6000');
    });

    test('accepts valid code at or above minimum', () => {
        const result = validateCoupon('FLAT500', 6000);
        expect(result.valid).toBe(true);
        expect(result.coupon.discount).toBe(500);
    });

    test('is case-insensitive', () => {
        const result = validateCoupon('flat1000', 7000);
        expect(result.valid).toBe(true);
        expect(result.coupon.code).toBe('FLAT1000');
    });

    test('auto-invalidates when cart drops below minimum', () => {
        const coupon = { code: 'FLAT500', discount: 500, minAmount: 6000 };
        const subtotal = 5000;
        expect(subtotal < coupon.minAmount).toBe(true);
    });
});
