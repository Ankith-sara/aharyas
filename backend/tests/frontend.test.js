import { jest } from '@jest/globals';

// ── categoryData helpers ──────────────────────────────────────────────────────

const categoryData = {
    Women: {
        subCategories: ['', 'Kurtis', 'Sarees'],
        sizes: { default: ['XS', 'S', 'M', 'L', 'XL'], Sarees: [] },
    },
    Men: {
        subCategories: ['', 'Kurtas', 'Trousers'],
        sizes: { default: ['28', '30', '32', '34'] },
    },
    'Handmade Toys': { subCategories: ['', 'Paintings'], sizes: { default: [] } },
};

function getSizesForSubCategory(category, subCategory) {
    const cat = categoryData[category];
    if (!cat) return [];
    return cat.sizes[subCategory] ?? cat.sizes.default ?? [];
}

describe('getSizesForSubCategory', () => {
    test('returns default sizes for a category with no sub-category sizes', () => {
        expect(getSizesForSubCategory('Women', 'Kurtis')).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    });

    test('returns empty array for Sarees (no sizes)', () => {
        expect(getSizesForSubCategory('Women', 'Sarees')).toEqual([]);
    });

    test('returns correct sizes for Men', () => {
        expect(getSizesForSubCategory('Men', 'Kurtas')).toEqual(['28', '30', '32', '34']);
    });

    test('returns empty array for categories with no sizes', () => {
        expect(getSizesForSubCategory('Handmade Toys', 'Paintings')).toEqual([]);
    });

    test('returns empty array for an unknown category', () => {
        expect(getSizesForSubCategory('Unknown', 'anything')).toEqual([]);
    });
});

// ── Orders page filter logic ──────────────────────────────────────────────────

const sampleOrders = [
    { _id: '1', status: 'Delivered', payment: true,  amount: 500, address: { Name: 'Alice', phone: '9000000001', city: 'Delhi' },   items: [{ name: 'Kurta' }] },
    { _id: '2', status: 'Shipping',  payment: false, amount: 300, address: { Name: 'Bob',   phone: '9000000002', city: 'Mumbai' }, items: [{ name: 'Shirt' }] },
    { _id: '3', status: 'Delivered', payment: true,  amount: 800, address: { Name: 'Carol', phone: '9000000003', city: 'Delhi' },   items: [{ name: 'Saree' }] },
];

function filterOrders(orders, { searchTerm = '', statusFilter = '', paymentFilter = '' }) {
    let result = orders;
    if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase().trim();
        result = result.filter(o =>
            o.address?.Name?.toLowerCase().includes(s) ||
            o.address?.phone?.includes(searchTerm) ||
            o.items?.some(item => item.name?.toLowerCase().includes(s)) ||
            o.address?.city?.toLowerCase().includes(s)
        );
    }
    if (statusFilter) result = result.filter(o => o.status === statusFilter);
    if (paymentFilter) result = result.filter(o => paymentFilter === 'paid' ? o.payment : !o.payment);
    return result;
}

describe('filterOrders', () => {
    test('returns all orders when no filters applied', () => {
        expect(filterOrders(sampleOrders, {})).toHaveLength(3);
    });

    test('filters by customer name', () => {
        const result = filterOrders(sampleOrders, { searchTerm: 'alice' });
        expect(result).toHaveLength(1);
        expect(result[0]._id).toBe('1');
    });

    test('filters by city', () => {
        const result = filterOrders(sampleOrders, { searchTerm: 'delhi' });
        expect(result).toHaveLength(2);
    });

    test('filters by product name', () => {
        const result = filterOrders(sampleOrders, { searchTerm: 'saree' });
        expect(result).toHaveLength(1);
        expect(result[0]._id).toBe('3');
    });

    test('filters by status', () => {
        const result = filterOrders(sampleOrders, { statusFilter: 'Delivered' });
        expect(result).toHaveLength(2);
    });

    test('filters by paid payment', () => {
        const result = filterOrders(sampleOrders, { paymentFilter: 'paid' });
        expect(result).toHaveLength(2);
    });

    test('filters by pending payment', () => {
        const result = filterOrders(sampleOrders, { paymentFilter: 'pending' });
        expect(result).toHaveLength(1);
        expect(result[0]._id).toBe('2');
    });

    test('combines status and payment filters', () => {
        const result = filterOrders(sampleOrders, { statusFilter: 'Delivered', paymentFilter: 'paid' });
        expect(result).toHaveLength(2);
    });
});

// ── Revenue calculation — only paid orders ────────────────────────────────────

describe('revenue calculation', () => {
    test('only sums paid orders', () => {
        const revenue = sampleOrders
            .filter(o => o.payment)
            .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
        expect(revenue).toBe(1300); // 500 + 800, not 300
    });

    test('returns 0 when no paid orders', () => {
        const noPaid = sampleOrders.map(o => ({ ...o, payment: false }));
        const revenue = noPaid
            .filter(o => o.payment)
            .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
        expect(revenue).toBe(0);
    });
});

// ── CSV export helper ─────────────────────────────────────────────────────────

function buildOrderCSV(orders) {
    const headers = ['Order #', 'Customer', 'Items', 'Amount', 'Status', 'Date'];
    const rows = orders.map((o, i) => [
        `#${(i + 1).toString().padStart(5, '0')}`,
        o.address?.Name || 'N/A',
        o.items?.length || 0,
        o.amount || 0,
        o.payment ? 'Paid' : 'Pending',
        new Date(o.date || 0).toLocaleDateString(),
    ]);
    return [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
}

describe('buildOrderCSV', () => {
    const orders = [
        { _id: '1', status: 'Delivered', payment: true, amount: 500, date: 1700000000000, address: { Name: 'Alice' }, items: [{}] },
    ];

    test('includes header row', () => {
        const csv = buildOrderCSV(orders);
        expect(csv).toContain('"Order #"');
        expect(csv).toContain('"Customer"');
    });

    test('marks paid orders as Paid', () => {
        expect(buildOrderCSV(orders)).toContain('"Paid"');
    });

    test('marks unpaid orders as Pending', () => {
        const unpaid = [{ ...orders[0], payment: false }];
        expect(buildOrderCSV(unpaid)).toContain('"Pending"');
    });

    test('produces correct number of rows (header + data)', () => {
        const lines = buildOrderCSV(orders).split('\n');
        expect(lines).toHaveLength(2); // 1 header + 1 data
    });
});
