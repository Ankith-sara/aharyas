import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockCartModel = {
    findOne: jest.fn(),
    create: jest.fn(),
};

const mockUserModel = {
    findById: jest.fn(),
};

const mockProductModel = {
    findById: jest.fn(),
};

jest.unstable_mockModule('../../features/cart/CartModel.js', () => ({ default: mockCartModel }));
jest.unstable_mockModule('../../features/user/UserModel.js', () => ({ default: mockUserModel }));
jest.unstable_mockModule('../../features/product/ProductModel.js', () => ({ default: mockProductModel }));

const { addItemToCart, updateCartItem, mergeGuestCart, cartItemsToMapObject } = await import('../../features/cart/CartService.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Persistent Cart Service', () => {
    test('cartItemsToMapObject converts array to map representation', () => {
        const items = [
            { productId: 'p1', size: 'M', quantity: 2 },
            { productId: 'p1', size: 'L', quantity: 1 },
            { productId: 'p2', size: 'N/A', quantity: 3 },
        ];
        const result = cartItemsToMapObject(items);
        expect(result).toEqual({
            p1: { M: 2, L: 1 },
            p2: { 'N/A': 3 },
        });
    });

    test('addItemToCart adds new item to CartModel and touches activity', async () => {
        const mockUser = { _id: 'u1', save: jest.fn().mockResolvedValue({}) };
        mockUserModel.findById.mockResolvedValue(mockUser);

        const mockProduct = { _id: 'p1', name: 'Handcrafted Silk Saree', visible: true };
        mockProductModel.findById.mockResolvedValue(mockProduct);

        const mockCartInstance = {
            userId: 'u1',
            items: [],
            lastActivityAt: new Date(1000),
            status: 'ABANDONED',
            save: jest.fn().mockResolvedValue({}),
        };

        mockCartModel.findOne.mockResolvedValue(mockCartInstance);

        const res = await addItemToCart({ userId: 'u1', itemId: 'p1', size: 'M', quantity: 2 });

        expect(res).toEqual({ p1: { M: 2 } });
        expect(mockCartInstance.status).toBe('ACTIVE');
        expect(mockCartInstance.items).toHaveLength(1);
        expect(mockCartInstance.save).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
    });

    test('mergeGuestCart merges guest items into user cart deterministically', async () => {
        const mockUser = { _id: 'u1', save: jest.fn().mockResolvedValue({}) };
        mockUserModel.findById.mockResolvedValue(mockUser);

        mockProductModel.findById.mockImplementation((id) => Promise.resolve({ _id: id, visible: true }));

        const mockCartInstance = {
            userId: 'u1',
            items: [{ productId: 'p1', size: 'M', quantity: 1, addedAt: new Date(), updatedAt: new Date() }],
            status: 'ACTIVE',
            save: jest.fn().mockResolvedValue({}),
        };

        mockCartModel.findOne.mockResolvedValue(mockCartInstance);

        const guestCart = {
            p1: { M: 2, L: 1 },
            p2: { 'S': 4 }
        };

        const res = await mergeGuestCart({ userId: 'u1', guestCart });

        expect(res).toEqual({
            p1: { M: 3, L: 1 },
            p2: { 'S': 4 }
        });
    });
});
