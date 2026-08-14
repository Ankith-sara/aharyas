

// ── Recently viewed helpers ───────────────────────────────────────────────────

const MAX_RECENTLY_VIEWED = 5;
const RECENTLY_VIEWED_KEY = 'recentlyViewed';

const store = {};
global.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

const safeRead = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (err) { console.error("safeRead error", err); return fallback; }
};
const safeWrite = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error("safeWrite error", err); }
};

function addProductToRecentlyViewed(product) {
    let viewed = safeRead(RECENTLY_VIEWED_KEY, []);
    viewed = viewed.filter(p => p._id !== product._id);
    viewed.unshift({
        _id: product._id, name: product.name, price: product.price,
        images: product.images, category: product.category,
        subCategory: product.subCategory, viewedAt: new Date().toISOString(),
    });
    safeWrite(RECENTLY_VIEWED_KEY, viewed.slice(0, MAX_RECENTLY_VIEWED));
}

function getRecentlyViewed(allProducts = []) {
    let viewed = safeRead(RECENTLY_VIEWED_KEY, []);
    if (allProducts.length) {
        viewed = viewed
            .map(vp => {
                const live = allProducts.find(p => p._id === vp._id);
                return live ? { ...live, viewedAt: vp.viewedAt } : vp;
            })
            .filter(vp => allProducts.some(p => p._id === vp._id));
        safeWrite(RECENTLY_VIEWED_KEY, viewed);
    }
    return viewed;
}

const makeProduct = (id) => ({
    _id: id, name: `Product ${id}`, price: 100 * parseInt(id),
    images: [], category: 'Women', subCategory: 'Kurtis',
});

describe('addProductToRecentlyViewed', () => {
    beforeEach(() => { localStorage.clear(); });

    test('adds a product to empty history', () => {
        addProductToRecentlyViewed(makeProduct('1'));
        const viewed = safeRead(RECENTLY_VIEWED_KEY, []);
        expect(viewed).toHaveLength(1);
        expect(viewed[0]._id).toBe('1');
    });

    test('most recently viewed appears first', () => {
        addProductToRecentlyViewed(makeProduct('1'));
        addProductToRecentlyViewed(makeProduct('2'));
        const viewed = safeRead(RECENTLY_VIEWED_KEY, []);
        expect(viewed[0]._id).toBe('2');
    });

    test('viewing same product moves it to front, no duplicates', () => {
        addProductToRecentlyViewed(makeProduct('1'));
        addProductToRecentlyViewed(makeProduct('2'));
        addProductToRecentlyViewed(makeProduct('1'));
        const viewed = safeRead(RECENTLY_VIEWED_KEY, []);
        expect(viewed[0]._id).toBe('1');
        expect(viewed.filter(p => p._id === '1')).toHaveLength(1);
    });

    test(`caps at ${MAX_RECENTLY_VIEWED} items`, () => {
        for (let i = 1; i <= MAX_RECENTLY_VIEWED + 2; i++) {
            addProductToRecentlyViewed(makeProduct(String(i)));
        }
        const viewed = safeRead(RECENTLY_VIEWED_KEY, []);
        expect(viewed).toHaveLength(MAX_RECENTLY_VIEWED);
    });

    test('each entry has a viewedAt timestamp', () => {
        addProductToRecentlyViewed(makeProduct('1'));
        const viewed = safeRead(RECENTLY_VIEWED_KEY, []);
        expect(viewed[0].viewedAt).toBeDefined();
        expect(new Date(viewed[0].viewedAt).toISOString()).toBe(viewed[0].viewedAt);
    });
});

describe('getRecentlyViewed', () => {
    beforeEach(() => { localStorage.clear(); });

    test('returns empty array when nothing viewed', () => {
        expect(getRecentlyViewed()).toEqual([]);
    });

    test('filters out products no longer in catalogue', () => {
        addProductToRecentlyViewed(makeProduct('1'));
        addProductToRecentlyViewed(makeProduct('2'));
        const live = [makeProduct('1')]; // product '2' removed from catalogue
        const viewed = getRecentlyViewed(live);
        expect(viewed.map(p => p._id)).toEqual(['1']);
    });

    test('merges live product data (e.g. updated price)', () => {
        addProductToRecentlyViewed(makeProduct('1'));
        const updatedProduct = { ...makeProduct('1'), price: 9999 };
        const viewed = getRecentlyViewed([updatedProduct]);
        expect(viewed[0].price).toBe(9999);
    });

    test('preserves viewedAt after merge', () => {
        addProductToRecentlyViewed(makeProduct('1'));
        const stored = safeRead(RECENTLY_VIEWED_KEY, []);
        const originalViewedAt = stored[0].viewedAt;
        const viewed = getRecentlyViewed([makeProduct('1')]);
        expect(viewed[0].viewedAt).toBe(originalViewedAt);
    });
});
