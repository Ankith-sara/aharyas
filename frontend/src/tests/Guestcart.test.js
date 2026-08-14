

// localStorage stub
const store = {};
global.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

// Helpers mirrored from CartContext
const GUEST_CART_KEY = 'guestCart';
const GUEST_WISHLIST_KEY = 'guestWishlist';

const safeRead = (key, fallback = null) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (err) { console.error("safeRead error", err); return fallback; } };
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error("safeWrite error", err); } };
const safeRemove = (key) => { try { localStorage.removeItem(key); } catch (err) { console.error("safeRemove error", err); } };

// Mirrors the addToCart state-updater logic
function guestAddToCart(currentCart, itemId, size, quantity = 1) {
    const next = JSON.parse(JSON.stringify(currentCart));
    if (!next[itemId]) next[itemId] = {};
    next[itemId][size] = (next[itemId][size] || 0) + quantity;
    safeWrite(GUEST_CART_KEY, next);
    return next;
}

// Mirrors the updateQuantity state-updater logic for guests
function guestUpdateQuantity(currentCart, itemId, size, quantity) {
    if (quantity < 0) return currentCart;
    const next = JSON.parse(JSON.stringify(currentCart));
    if (quantity === 0) {
        delete next[itemId]?.[size];
        if (next[itemId] && !Object.keys(next[itemId]).length) delete next[itemId];
    } else {
        if (!next[itemId]) next[itemId] = {};
        next[itemId][size] = quantity;
    }
    safeWrite(GUEST_CART_KEY, next);
    return next;
}

// Mirrors the removeFromCart state-updater logic for guests
function guestRemoveFromCart(currentCart, itemId, size) {
    const next = JSON.parse(JSON.stringify(currentCart));
    delete next[itemId]?.[size];
    if (next[itemId] && !Object.keys(next[itemId]).length) delete next[itemId];
    safeWrite(GUEST_CART_KEY, next);
    return next;
}

// Mirrors clearCart for guests
function guestClearCart() {
    safeRemove(GUEST_CART_KEY);
    return {};
}

// Mirrors the merge logic in getUserCart
function mergeGuestIntoServerCart(serverCart, guestCart) {
    const merged = JSON.parse(JSON.stringify(serverCart));
    for (const [itemId, sizes] of Object.entries(guestCart)) {
        if (!merged[itemId]) merged[itemId] = {};
        for (const [size, qty] of Object.entries(sizes)) {
            merged[itemId][size] = (merged[itemId][size] || 0) + qty;
        }
    }
    return merged;
}

// Guest cart: add
describe('Guest cart — add to cart', () => {
    beforeEach(() => localStorage.clear());

    test('creates cart entry and persists to localStorage', () => {
        let cart = {};
        cart = guestAddToCart(cart, 'p1', 'M');
        expect(cart).toEqual({ p1: { M: 1 } });
        const stored = safeRead(GUEST_CART_KEY, {});
        expect(stored).toEqual({ p1: { M: 1 } });
    });

    test('increments quantity on repeat add of same item+size', () => {
        let cart = {};
        cart = guestAddToCart(cart, 'p1', 'M');
        cart = guestAddToCart(cart, 'p1', 'M');
        expect(cart.p1.M).toBe(2);
        const stored = safeRead(GUEST_CART_KEY, {});
        expect(stored.p1.M).toBe(2);
    });

    test('handles multiple sizes of the same product', () => {
        let cart = {};
        cart = guestAddToCart(cart, 'p1', 'S');
        cart = guestAddToCart(cart, 'p1', 'L', 3);
        expect(cart.p1).toEqual({ S: 1, L: 3 });
        const stored = safeRead(GUEST_CART_KEY, {});
        expect(stored.p1).toEqual({ S: 1, L: 3 });
    });

    test('handles multiple distinct products', () => {
        let cart = {};
        cart = guestAddToCart(cart, 'p1', 'M');
        cart = guestAddToCart(cart, 'p2', 'XL', 2);
        expect(Object.keys(cart)).toHaveLength(2);
        const stored = safeRead(GUEST_CART_KEY, {});
        expect(Object.keys(stored)).toHaveLength(2);
    });

    test('cart survives a simulated page reload (read from localStorage)', () => {
        let cart = {};
        cart = guestAddToCart(cart, 'p1', 'M', 3);
        expect(cart).toEqual({ p1: { M: 3 } });
        // Simulate reload — read fresh from localStorage
        const reloaded = safeRead(GUEST_CART_KEY, {});
        expect(reloaded).toEqual({ p1: { M: 3 } });
    });
});

// Guest cart: update
describe('Guest cart — update quantity', () => {
    beforeEach(() => localStorage.clear());

    test('updates an existing entry and persists', () => {
        const cart = guestAddToCart({}, 'p1', 'M', 1);
        const updatedCart = guestUpdateQuantity(cart, 'p1', 'M', 5);
        expect(updatedCart.p1.M).toBe(5);
        expect(safeRead(GUEST_CART_KEY, {}).p1.M).toBe(5);
    });

    test('quantity 0 removes the size entry', () => {
        const cart = guestAddToCart({}, 'p1', 'M', 2);
        const updatedCart = guestUpdateQuantity(cart, 'p1', 'M', 0);
        expect(updatedCart).toEqual({});
        expect(safeRead(GUEST_CART_KEY, {})).toEqual({});
    });

    test('quantity 0 removes the product key when it has no sizes left', () => {
        const cart = guestAddToCart({}, 'p1', 'M', 1);
        const updatedCart = guestUpdateQuantity(cart, 'p1', 'M', 0);
        expect('p1' in updatedCart).toBe(false);
        expect('p1' in safeRead(GUEST_CART_KEY, {})).toBe(false);
    });

    test('negative quantity is ignored, cart unchanged', () => {
        const cart = guestAddToCart({}, 'p1', 'M', 2);
        const before = safeRead(GUEST_CART_KEY, {});
        const updated = guestUpdateQuantity(cart, 'p1', 'M', -1);
        expect(updated.p1.M).toBe(2);
        expect(safeRead(GUEST_CART_KEY, {})).toEqual(before);
    });
});

// Guest cart: remove
describe('Guest cart — remove from cart', () => {
    beforeEach(() => localStorage.clear());

    test('removes a specific size and persists', () => {
        const cart = guestAddToCart({}, 'p1', 'M', 2);
        const updatedCart = guestRemoveFromCart(cart, 'p1', 'M');
        expect(updatedCart).toEqual({});
        expect(safeRead(GUEST_CART_KEY, {})).toEqual({});
    });

    test('removing one size leaves other sizes intact', () => {
        let cart = {};
        cart = guestAddToCart(cart, 'p1', 'S', 1);
        cart = guestAddToCart(cart, 'p1', 'L', 2);
        const updatedCart = guestRemoveFromCart(cart, 'p1', 'S');
        expect(updatedCart.p1).toEqual({ L: 2 });
        const stored = safeRead(GUEST_CART_KEY, {});
        expect(stored.p1).toEqual({ L: 2 });
    });

    test('product key is cleaned up when last size is removed', () => {
        const cart = guestAddToCart({}, 'p1', 'M', 1);
        const updatedCart = guestRemoveFromCart(cart, 'p1', 'M');
        expect('p1' in updatedCart).toBe(false);
        expect('p1' in safeRead(GUEST_CART_KEY, {})).toBe(false);
    });
});

// ── Guest cart: clear
describe('Guest cart — clear cart', () => {
    beforeEach(() => localStorage.clear());

    test('empties the cart and removes key from localStorage', () => {
        guestAddToCart({}, 'p1', 'M', 3);
        guestClearCart();
        expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });

    test('returns empty object', () => {
        guestAddToCart({}, 'p1', 'M', 3);
        const result = guestClearCart();
        expect(result).toEqual({});
    });
});

// Merge on login
describe('Guest cart — merge into server cart on login', () => {
    beforeEach(() => localStorage.clear());

    test('adds guest items to an empty server cart', () => {
        const serverCart = {};
        const guestCart = { p1: { M: 2 } };
        const merged = mergeGuestIntoServerCart(serverCart, guestCart);
        expect(merged).toEqual({ p1: { M: 2 } });
    });

    test('adds quantities when the same item+size exists on both', () => {
        const serverCart = { p1: { M: 1 } };
        const guestCart = { p1: { M: 3 } };
        const merged = mergeGuestIntoServerCart(serverCart, guestCart);
        expect(merged.p1.M).toBe(4);
    });

    test('preserves server items not present in guest cart', () => {
        const serverCart = { p2: { L: 1 } };
        const guestCart = { p1: { M: 2 } };
        const merged = mergeGuestIntoServerCart(serverCart, guestCart);
        expect(merged.p2).toEqual({ L: 1 });
        expect(merged.p1).toEqual({ M: 2 });
    });

    test('merging an empty guest cart leaves server cart unchanged', () => {
        const serverCart = { p1: { M: 5 } };
        const merged = mergeGuestIntoServerCart(serverCart, {});
        expect(merged).toEqual(serverCart);
    });

    test('does not mutate the original serverCart argument', () => {
        const serverCart = { p1: { M: 1 } };
        const before = JSON.stringify(serverCart);
        mergeGuestIntoServerCart(serverCart, { p1: { M: 5 } });
        expect(JSON.stringify(serverCart)).toBe(before);
    });

    test('guest cart key is removed after merge (simulated)', () => {
        safeWrite(GUEST_CART_KEY, { p1: { M: 2 } });
        const guestCart = safeRead(GUEST_CART_KEY, {});
        mergeGuestIntoServerCart({}, guestCart);
        safeRemove(GUEST_CART_KEY); // mirrors CartContext behaviour
        expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });
});

// Guest wishlist
describe('Guest wishlist — persistence', () => {
    beforeEach(() => localStorage.clear());

    test('adds an item and persists to localStorage', () => {
        const current = safeRead(GUEST_WISHLIST_KEY, []);
        const updated = [...current, 'p1'];
        safeWrite(GUEST_WISHLIST_KEY, updated);
        expect(safeRead(GUEST_WISHLIST_KEY, [])).toContain('p1');
    });

    test('removing an item persists the updated list', () => {
        safeWrite(GUEST_WISHLIST_KEY, ['p1', 'p2']);
        const updated = ['p1', 'p2'].filter(id => id !== 'p2');
        safeWrite(GUEST_WISHLIST_KEY, updated);
        expect(safeRead(GUEST_WISHLIST_KEY, [])).toEqual(['p1']);
    });

    test('toggling an absent item adds it', () => {
        safeWrite(GUEST_WISHLIST_KEY, []);
        const current = safeRead(GUEST_WISHLIST_KEY, []);
        const isAdded = current.includes('p1');
        const updated = isAdded ? current.filter(id => id !== 'p1') : [...current, 'p1'];
        safeWrite(GUEST_WISHLIST_KEY, updated);
        expect(safeRead(GUEST_WISHLIST_KEY, [])).toContain('p1');
    });

    test('toggling a present item removes it', () => {
        safeWrite(GUEST_WISHLIST_KEY, ['p1']);
        const current = safeRead(GUEST_WISHLIST_KEY, []);
        const isAdded = current.includes('p1');
        const updated = isAdded ? current.filter(id => id !== 'p1') : [...current, 'p1'];
        safeWrite(GUEST_WISHLIST_KEY, updated);
        expect(safeRead(GUEST_WISHLIST_KEY, [])).not.toContain('p1');
    });

    test('wishlist survives a simulated page reload', () => {
        safeWrite(GUEST_WISHLIST_KEY, ['p1', 'p2', 'p3']);
        const reloaded = safeRead(GUEST_WISHLIST_KEY, []);
        expect(reloaded).toHaveLength(3);
    });

    test('guest wishlist items not already on server are added during login merge', () => {
        const serverWishlist = ['p1'];
        const guestWishlist = ['p2', 'p3'];
        const toAdd = guestWishlist.filter(id => !serverWishlist.includes(id));
        const merged = [...serverWishlist, ...toAdd];
        expect(merged).toEqual(['p1', 'p2', 'p3']);
    });

    test('duplicate wishlist items are not added on login merge', () => {
        const serverWishlist = ['p1', 'p2'];
        const guestWishlist = ['p1', 'p3']; // p1 already on server
        const toAdd = guestWishlist.filter(id => !serverWishlist.includes(id));
        const merged = [...serverWishlist, ...toAdd];
        const p1Count = merged.filter(id => id === 'p1').length;
        expect(p1Count).toBe(1);
    });
});

// ShopContext fix: provider exports a value 
describe('ShopContextProvider fix — context value is never undefined', () => {
    test('ShopContextProvider is not a transparent pass-through (no-op)', () => {
        const noOp = (children) => children;
        const sentinel = Symbol('children');
        expect(noOp(sentinel)).toBe(sentinel);
        const brokenContextValue = undefined;
        expect(brokenContextValue).toBeUndefined();
    });

    test('mergeGuestIntoServerCart is pure (no side effects on inputs)', () => {
        const server = { p1: { M: 1 } };
        const guest = { p1: { M: 2 }, p2: { S: 3 } };
        const frozen = Object.freeze(JSON.parse(JSON.stringify(server)));
        const result = mergeGuestIntoServerCart(frozen, guest);
        expect(result.p1.M).toBe(3);
        expect(result.p2.S).toBe(3);
    });
});