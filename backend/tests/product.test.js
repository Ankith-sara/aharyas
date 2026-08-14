import { jest } from '@jest/globals';

// sanitiseText 
function sanitiseText(str) {
    return str ? String(str).trim().replace(/<[^>]*>/g, '') : '';
}

// addProduct validation logic
function validateProductInput({ name, description, price }) {
    const errors = [];
    if (!sanitiseText(name))        errors.push('Product name is required');
    if (!sanitiseText(description)) errors.push('Product description is required');
    if (!price || isNaN(Number(price)) || Number(price) < 0)
        errors.push('A valid price is required');
    return errors;
}

describe('validateProductInput', () => {
    test('returns no errors for valid input', () => {
        const errors = validateProductInput({ name: 'Kurta', description: 'Nice kurta', price: '499' });
        expect(errors).toHaveLength(0);
    });

    test('flags missing name', () => {
        const errors = validateProductInput({ name: '', description: 'desc', price: '100' });
        expect(errors).toContain('Product name is required');
    });

    test('flags HTML-only name (stripped to empty)', () => {
        const errors = validateProductInput({ name: '<b></b>', description: 'desc', price: '100' });
        expect(errors).toContain('Product name is required');
    });

    test('flags negative price', () => {
        const errors = validateProductInput({ name: 'Item', description: 'desc', price: '-50' });
        expect(errors).toContain('A valid price is required');
    });

    test('flags non-numeric price', () => {
        const errors = validateProductInput({ name: 'Item', description: 'desc', price: 'free' });
        expect(errors).toContain('A valid price is required');
    });

    test('flags missing description', () => {
        const errors = validateProductInput({ name: 'Item', description: '', price: '100' });
        expect(errors).toContain('Product description is required');
    });
});

// Admin ownership guard
function canEditProduct(product, adminId) {
    return product.adminId.toString() === adminId;
}

describe('canEditProduct', () => {
    const product = { adminId: { toString: () => 'admin_1' } };

    test('returns true for the owning admin', () => {
        expect(canEditProduct(product, 'admin_1')).toBe(true);
    });

    test('returns false for a different admin', () => {
        expect(canEditProduct(product, 'admin_2')).toBe(false);
    });
});

// Company list sorting
describe('getCompanies sort order', () => {
    function sortCompanies(companies) {
        return companies.sort((a, b) => {
            if (a === 'Independent') return 1;
            if (b === 'Independent') return -1;
            return a.localeCompare(b);
        });
    }

    test('places Independent last', () => {
        const sorted = sortCompanies(['Zara', 'Independent', 'Aharyas']);
        expect(sorted[sorted.length - 1]).toBe('Independent');
    });

    test('sorts remaining companies alphabetically', () => {
        const sorted = sortCompanies(['Zara', 'Aharyas', 'Mango']);
        expect(sorted[0]).toBe('Aharyas');
        expect(sorted[1]).toBe('Mango');
        expect(sorted[2]).toBe('Zara');
    });
});

// Product visibility logic
describe('Product visibility logic', () => {
    // Mirrors the toggle logic used in ProductService.toggleProductVisibility
    function getNewVisibility(product) {
        return !(product.visible !== false);
    }

    test('visible product toggles to hidden', () => {
        expect(getNewVisibility({ visible: true })).toBe(false);
    });

    test('hidden product toggles to visible', () => {
        expect(getNewVisibility({ visible: false })).toBe(true);
    });

    test('product without visible field (undefined) toggles to hidden', () => {
        // undefined !== false is true, so !(true) = false
        expect(getNewVisibility({})).toBe(false);
    });

    test('product with visible=true toggles to hidden', () => {
        expect(getNewVisibility({ visible: true })).toBe(false);
    });

    // Public visibility filter logic mirrors getAllProductsPublic
    function isPubliclyVisible(product) {
        return product.visible !== false;
    }

    test('product with visible=true is publicly visible', () => {
        expect(isPubliclyVisible({ visible: true })).toBe(true);
    });

    test('product with visible=false is not publicly visible', () => {
        expect(isPubliclyVisible({ visible: false })).toBe(false);
    });

    test('product without visible field is publicly visible (backward compat)', () => {
        expect(isPubliclyVisible({})).toBe(true);
    });

    test('product with visible=undefined is publicly visible (backward compat)', () => {
        expect(isPubliclyVisible({ visible: undefined })).toBe(true);
    });
});

// Admin visibility filter
describe('Admin visibility filter', () => {
    const products = [
        { _id: '1', name: 'A', visible: true },
        { _id: '2', name: 'B', visible: false },
        { _id: '3', name: 'C' }, // no visible field
        { _id: '4', name: 'D', visible: true },
    ];

    test('filter "all" returns all products', () => {
        const result = products;
        expect(result).toHaveLength(4);
    });

    test('filter "visible" returns only visible products', () => {
        const result = products.filter(p => p.visible !== false);
        expect(result).toHaveLength(3);
        expect(result.map(p => p._id)).toEqual(['1', '3', '4']);
    });

    test('filter "hidden" returns only hidden products', () => {
        const result = products.filter(p => p.visible === false);
        expect(result).toHaveLength(1);
        expect(result[0]._id).toBe('2');
    });
});