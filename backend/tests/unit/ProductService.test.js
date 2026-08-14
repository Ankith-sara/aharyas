import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ─── ESM mocks ────────────────────────────────────────────────────────────────

const mockProductModel = {
    find:           jest.fn(),
    countDocuments: jest.fn(),
};

jest.unstable_mockModule('../../models/ProductModel.js', () => ({
    default: mockProductModel,
}));

jest.unstable_mockModule('../../services/CacheService.js', () => ({
    cacheGet: jest.fn((key, fetcher) => fetcher()),
    invalidateOnProductChange: jest.fn().mockResolvedValue(true),
    invalidateProductCaches: jest.fn().mockResolvedValue(true),
    invalidateCategoryCache: jest.fn().mockResolvedValue(true),
    invalidateCompanyCache: jest.fn().mockResolvedValue(true),
    KEYS: {
        PRODUCTS_ALL: 'cache:products:all',
    },
    CACHE_TTL: {
        PRODUCTS_ALL: 3600,
    }
}));

const { searchProducts } = await import('../../services/ProductService.js');

beforeEach(() => jest.clearAllMocks());

// ─── Helper — builds the chained mock find returns ────────────────────────────

const buildFindChain = (result) =>
    mockProductModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(result) }),
            }),
        }),
    });

// ─── searchProducts ───────────────────────────────────────────────────────────

describe('ProductService.searchProducts', () => {
    test('returns paginated products with no filters', async () => {
        const mockProducts = [{ name: 'Saree', price: 500 }];
        buildFindChain(mockProducts);
        mockProductModel.countDocuments.mockResolvedValue(1);

        const result = await searchProducts({ page: 1, limit: 20 });

        expect(result.products).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
    });

    test('applies category filter', async () => {
        buildFindChain([]);
        mockProductModel.countDocuments.mockResolvedValue(0);

        await searchProducts({ category: 'Sarees' });

        expect(mockProductModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'Sarees' })
        );
    });

    test('applies price range filter', async () => {
        buildFindChain([]);
        mockProductModel.countDocuments.mockResolvedValue(0);

        await searchProducts({ minPrice: 100, maxPrice: 500 });

        expect(mockProductModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ price: { $gte: 100, $lte: 500 } })
        );
    });

    test('applies text search when q is provided', async () => {
        buildFindChain([]);
        mockProductModel.countDocuments.mockResolvedValue(0);

        await searchProducts({ q: 'silk' });

        expect(mockProductModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ $text: { $search: 'silk' } })
        );
    });

    test('caps limit at 100 regardless of input', async () => {
        buildFindChain([]);
        mockProductModel.countDocuments.mockResolvedValue(0);

        await searchProducts({ limit: 999 });

        // The limit(100) call should be present — verify via chain mock
        const sortMock  = mockProductModel.find.mock.results[0].value.sort.mock.results[0].value;
        const skipMock  = sortMock.skip.mock.results[0].value;
        expect(skipMock.limit).toHaveBeenCalledWith(100);
    });

    test('defaults to newest sort when no sort option provided', async () => {
        buildFindChain([]);
        mockProductModel.countDocuments.mockResolvedValue(0);

        await searchProducts({});

        const sortMock = mockProductModel.find.mock.results[0].value.sort;
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });

    test('uses price ascending sort when sort=price-asc', async () => {
        buildFindChain([]);
        mockProductModel.countDocuments.mockResolvedValue(0);

        await searchProducts({ sort: 'price-asc' });

        const sortMock = mockProductModel.find.mock.results[0].value.sort;
        expect(sortMock).toHaveBeenCalledWith({ price: 1 });
    });

    test('returns correct pagination metadata', async () => {
        buildFindChain([]);
        mockProductModel.countDocuments.mockResolvedValue(45);

        const result = await searchProducts({ page: 2, limit: 20 });

        expect(result.page).toBe(2);
        expect(result.pages).toBe(3); // ceil(45/20)
        expect(result.total).toBe(45);
    });
});
