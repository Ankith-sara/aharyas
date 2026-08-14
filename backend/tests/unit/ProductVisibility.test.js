import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockProductModel = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
};

jest.unstable_mockModule('../../models/ProductModel.js', () => ({
    default: mockProductModel,
}));

jest.unstable_mockModule('../../services/CacheService.js', () => ({
    cacheGet: jest.fn((key, fetcher) => fetcher()),
    invalidateOnProductChange: jest.fn().mockResolvedValue(true),
    KEYS: {
        PRODUCTS_ALL: 'cache:products:all',
    },
    CACHE_TTL: {
        PRODUCTS_ALL: 3600,
    }
}));

const { toggleProductVisibility, getAllProductsPublic } = await import('../../services/ProductService.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Product Visibility Services', () => {
    const adminId = '65db32109876543210987654';
    const productId = '65db32109876543210987655';

    describe('toggleProductVisibility', () => {
        test('throws 404 if product not found', async () => {
            mockProductModel.findOne.mockResolvedValue(null);

            await expect(toggleProductVisibility({ productId, adminId }))
                .rejects.toMatchObject({
                    statusCode: 404,
                    message: 'Product not found or not owned by you'
                });

            expect(mockProductModel.findOne).toHaveBeenCalledWith({ _id: productId, adminId });
            expect(mockProductModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        test('toggles visible=true to visible=false', async () => {
            const mockProduct = { _id: productId, adminId, visible: true };
            mockProductModel.findOne.mockResolvedValue(mockProduct);
            mockProductModel.findByIdAndUpdate.mockResolvedValue({ ...mockProduct, visible: false });

            const result = await toggleProductVisibility({ productId, adminId });

            expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
                productId,
                { visible: false },
                { new: true }
            );
            expect(result.visible).toBe(false);
        });

        test('toggles visible=false to visible=true', async () => {
            const mockProduct = { _id: productId, adminId, visible: false };
            mockProductModel.findOne.mockResolvedValue(mockProduct);
            mockProductModel.findByIdAndUpdate.mockResolvedValue({ ...mockProduct, visible: true });

            const result = await toggleProductVisibility({ productId, adminId });

            expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
                productId,
                { visible: true },
                { new: true }
            );
            expect(result.visible).toBe(true);
        });

        test('toggles undefined visible to visible=false', async () => {
            const mockProduct = { _id: productId, adminId }; // visible is undefined
            mockProductModel.findOne.mockResolvedValue(mockProduct);
            mockProductModel.findByIdAndUpdate.mockResolvedValue({ ...mockProduct, visible: false });

            const result = await toggleProductVisibility({ productId, adminId });

            expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
                productId,
                { visible: false },
                { new: true }
            );
            expect(result.visible).toBe(false);
        });
    });

    describe('getAllProductsPublic', () => {
        test('queries only visible products using visible: { $ne: false }', async () => {
            mockProductModel.find.mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: '1', name: 'Product 1', visible: true }])
            });

            const result = await getAllProductsPublic();

            expect(mockProductModel.find).toHaveBeenCalledWith(
                { visible: { $ne: false } },
                expect.any(String)
            );
            expect(result).toHaveLength(1);
            expect(result[0]._id).toBe('1');
        });
    });
});
