import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ESM Mocks
const mockProductModel = {
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

const mockImagekit = {
    assets: {
        list: jest.fn(),
    },
    files: {
        delete: jest.fn(),
    }
};

jest.unstable_mockModule('../../models/ProductModel.js', () => ({
    default: mockProductModel,
}));

jest.unstable_mockModule('../../config/imagekit.js', () => ({
    default: mockImagekit,
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

const { deleteProduct } = await import('../../services/ProductService.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ProductService.deleteProduct & ImageKit Deletion Cleanup', () => {
    const adminId = '65db32109876543210987654';
    const productId = '65db32109876543210987655';

    test('throws 404 if product does not exist or is not owned by the admin', async () => {
        mockProductModel.findOne.mockResolvedValue(null);

        await expect(deleteProduct({ productId, adminId }))
            .rejects.toMatchObject({
                statusCode: 404,
                message: 'Product not found or not owned by you'
            });

        expect(mockProductModel.findOne).toHaveBeenCalledWith({ _id: productId, adminId });
        expect(mockProductModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('successfully deletes product and cleans up remote ImageKit assets (with and without query params)', async () => {
        const mockProduct = {
            _id: productId,
            adminId,
            images: [
                'https://ik.imagekit.io/aharyas/products/image_1.jpg',
                'https://ik.imagekit.io/aharyas/products/image_2.png?tr=w-600&ik-sdk-version=javascript-1.4.3',
                'https://otherdomain.com/unsupported/image.jpg'
            ]
        };

        mockProductModel.findOne.mockResolvedValue(mockProduct);
        mockProductModel.findByIdAndDelete.mockResolvedValue(mockProduct);

        // Mock list responses
        mockImagekit.assets.list
            .mockResolvedValueOnce([{ fileId: 'file_id_1', name: 'image_1.jpg' }])
            .mockResolvedValueOnce([{ fileId: 'file_id_2', name: 'image_2.png' }]);

        mockImagekit.files.delete.mockResolvedValue({ success: true });

        const result = await deleteProduct({ productId, adminId });

        expect(result).toEqual(mockProduct);
        expect(mockProductModel.findOne).toHaveBeenCalledWith({ _id: productId, adminId });
        expect(mockProductModel.findByIdAndDelete).toHaveBeenCalledWith(productId);

        // Verify ImageKit list search queries were correctly constructed
        expect(mockImagekit.assets.list).toHaveBeenCalledTimes(2);
        expect(mockImagekit.assets.list).toHaveBeenNthCalledWith(1, {
            searchQuery: 'name = "image_1.jpg"'
        });
        expect(mockImagekit.assets.list).toHaveBeenNthCalledWith(2, {
            searchQuery: 'name = "image_2.png"'
        });

        // Verify ImageKit delete was called with correct file IDs
        expect(mockImagekit.files.delete).toHaveBeenCalledTimes(2);
        expect(mockImagekit.files.delete).toHaveBeenNthCalledWith(1, 'file_id_1');
        expect(mockImagekit.files.delete).toHaveBeenNthCalledWith(2, 'file_id_2');
    });

    test('gracefully handles missing or non-existent assets on ImageKit during deletion', async () => {
        const mockProduct = {
            _id: productId,
            adminId,
            images: [
                'https://ik.imagekit.io/aharyas/products/missing_image.jpg'
            ]
        };

        mockProductModel.findOne.mockResolvedValue(mockProduct);
        mockProductModel.findByIdAndDelete.mockResolvedValue(mockProduct);

        // List files returns empty array for non-existent image
        mockImagekit.assets.list.mockResolvedValue([]);

        const result = await deleteProduct({ productId, adminId });

        expect(result).toEqual(mockProduct);
        expect(mockProductModel.findOne).toHaveBeenCalledWith({ _id: productId, adminId });
        expect(mockImagekit.assets.list).toHaveBeenCalledWith({
            searchQuery: 'name = "missing_image.jpg"'
        });
        expect(mockImagekit.files.delete).not.toHaveBeenCalled();
        expect(mockProductModel.findByIdAndDelete).toHaveBeenCalledWith(productId);
    });

    test('ignores non-ImageKit URLs completely', async () => {
        const mockProduct = {
            _id: productId,
            adminId,
            images: [
                'https://some-s3-bucket.amazonaws.com/products/image.jpg'
            ]
        };

        mockProductModel.findOne.mockResolvedValue(mockProduct);
        mockProductModel.findByIdAndDelete.mockResolvedValue(mockProduct);

        const result = await deleteProduct({ productId, adminId });

        expect(result).toEqual(mockProduct);
        expect(mockImagekit.assets.list).not.toHaveBeenCalled();
        expect(mockImagekit.files.delete).not.toHaveBeenCalled();
        expect(mockProductModel.findByIdAndDelete).toHaveBeenCalledWith(productId);
    });
});
