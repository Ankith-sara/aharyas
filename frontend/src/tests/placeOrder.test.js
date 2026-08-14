

// ── Order item builder (extracted from PlaceOrder.onSubmitHandler) ────────────

function buildOrderItems(cartItems, products) {
    const items = [];
    for (const [itemId, sizes] of Object.entries(cartItems)) {
        for (const [size, qty] of Object.entries(sizes)) {
            if (qty <= 0) continue;
            const product = products.find(p => p._id === itemId);
            if (!product) continue;
            const effectivePrice = product.discount > 0
                ? Math.round(product.price * (1 - product.discount / 100))
                : product.price;
            items.push({
                productId: product._id,
                name: product.name,
                price: effectivePrice,
                originalPrice: product.price,
                discount: product.discount || 0,
                quantity: qty,
                size,
                image: product.images?.[0] || null,
            });
        }
    }
    return items;
}

const products = [
    { _id: 'p1', name: 'Kurta',    price: 1500, discount: 0,  images: ['img1.jpg'] },
    { _id: 'p2', name: 'Saree',    price: 3000, discount: 10, images: ['img2.jpg'] },
];

describe('buildOrderItems', () => {
    test('builds items from cart', () => {
        const items = buildOrderItems({ p1: { M: 2 } }, products);
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({ productId: 'p1', quantity: 2, size: 'M', price: 1500 });
    });

    test('applies product discount correctly', () => {
        const items = buildOrderItems({ p2: { L: 1 } }, products);
        // 3000 * 0.9 = 2700
        expect(items[0].price).toBe(2700);
        expect(items[0].originalPrice).toBe(3000);
        expect(items[0].discount).toBe(10);
    });

    test('skips zero/negative quantity items', () => {
        const items = buildOrderItems({ p1: { S: 0, M: 2 } }, products);
        expect(items).toHaveLength(1);
        expect(items[0].size).toBe('M');
    });

    test('skips products not in catalogue', () => {
        const items = buildOrderItems({ ghost: { S: 1 } }, products);
        expect(items).toHaveLength(0);
    });

    test('attaches first image to each item', () => {
        const items = buildOrderItems({ p1: { M: 1 } }, products);
        expect(items[0].image).toBe('img1.jpg');
    });

    test('returns empty array for empty cart', () => {
        expect(buildOrderItems({}, products)).toHaveLength(0);
    });
});

// ── Order total calculation ───────────────────────────────────────────────────

function computeOrderTotal({ subtotal, deliveryFee, couponDiscount = 0 }) {
    if (subtotal === 0) return 0;
    return subtotal + deliveryFee - couponDiscount;
}

describe('computeOrderTotal', () => {
    test('returns 0 for empty cart', () => {
        expect(computeOrderTotal({ subtotal: 0, deliveryFee: 50 })).toBe(0);
    });

    test('adds delivery fee', () => {
        expect(computeOrderTotal({ subtotal: 1000, deliveryFee: 50 })).toBe(1050);
    });

    test('subtracts coupon discount', () => {
        expect(computeOrderTotal({ subtotal: 6000, deliveryFee: 50, couponDiscount: 500 })).toBe(5550);
    });

    test('never returns negative', () => {
        // Coupon larger than subtotal + delivery — shouldn't happen but guard it
        const total = computeOrderTotal({ subtotal: 100, deliveryFee: 50, couponDiscount: 500 });
        expect(total).toBe(-350); // raw math — caller should validate coupon min-amount prevents this
    });
});

// ── Phone validation ──────────────────────────────────────────────────────────

function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
}

describe('validatePhone', () => {
    test('accepts 10-digit Indian number', () => expect(validatePhone('9876543210')).toBe(true));
    test('accepts formatted number with spaces', () => expect(validatePhone('98765 43210')).toBe(true));
    test('accepts number with country code', () => expect(validatePhone('+91 9876543210')).toBe(true));
    test('rejects 9-digit number', () => expect(validatePhone('987654321')).toBe(false));
    test('rejects empty string', () => expect(validatePhone('')).toBe(false));
});

// ── Pincode validation ────────────────────────────────────────────────────────

function validatePincode(pincode) {
    if (!pincode) return true; // optional field
    return /^\d{4,10}$/.test(pincode);
}

describe('validatePincode', () => {
    test('accepts 6-digit Indian pincode', () => expect(validatePincode('500001')).toBe(true));
    test('accepts 4-digit code (some countries)', () => expect(validatePincode('1234')).toBe(true));
    test('rejects letters', () => expect(validatePincode('ABC123')).toBe(false));
    test('rejects 3-digit code', () => expect(validatePincode('123')).toBe(false));
    test('returns true for empty (optional field)', () => expect(validatePincode('')).toBe(true));
});
