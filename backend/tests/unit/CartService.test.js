import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockUserModel = {
    findById: jest.fn(),
};

const mockCartModel = {
    findOne: jest.fn(),
    create: jest.fn(),
};

const mockProductModel = {
    findById: jest.fn(),
};

jest.unstable_mockModule('../../features/user/UserModel.js', () => ({
    default: mockUserModel,
}));
jest.unstable_mockModule('../../features/cart/CartModel.js', () => ({
    default: mockCartModel,
}));
jest.unstable_mockModule('../../features/product/ProductModel.js', () => ({
    default: mockProductModel,
}));

const { cartToObject, cartItemsToMapObject, addItemToCart, updateCartItem, removeCartItem, clearUserCart, getUserCart } =
    await import('../../features/cart/CartService.js');

beforeEach(() => jest.clearAllMocks());

describe('cartToObject & cartItemsToMapObject', () => {
    test('cartItemsToMapObject converts array to map format', () => {
        const items = [{ productId: 'p1', size: 'M', quantity: 2 }];
        expect(cartItemsToMapObject(items)).toEqual({ p1: { M: 2 } });
    });
});

describe('all operations — throws 404 when user not found', () => {
    beforeEach(() => mockUserModel.findById.mockResolvedValue(null));

    test('addItemToCart', async () => {
        await expect(addItemToCart({ userId: '60c72b2f9b1e8a0015f8a001', itemId: '60c72b2f9b1e8a0015f8a002' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });
    test('updateCartItem', async () => {
        await expect(updateCartItem({ userId: '60c72b2f9b1e8a0015f8a001', itemId: '60c72b2f9b1e8a0015f8a002', quantity: 1 }))
            .rejects.toMatchObject({ statusCode: 404 });
    });
    test('clearUserCart', async () => {
        await expect(clearUserCart('60c72b2f9b1e8a0015f8a001')).rejects.toMatchObject({ statusCode: 404 });
    });
    test('getUserCart', async () => {
        await expect(getUserCart('60c72b2f9b1e8a0015f8a001')).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('addItemToCart', () => {
    test('adds product to cartModel and syncs user cartData', async () => {
        const mockUser = { _id: '60c72b2f9b1e8a0015f8a001', cartData: {}, save: jest.fn().mockResolvedValue({}) };
        mockUserModel.findById.mockResolvedValue(mockUser);
        mockProductModel.findById.mockResolvedValue({ _id: '60c72b2f9b1e8a0015f8a002', visible: true });

        const mockCart = {
            items: [],
            lastActivityAt: new Date(),
            status: 'ACTIVE',
            save: jest.fn().mockResolvedValue({}),
        };
        mockCartModel.findOne.mockResolvedValue(mockCart);

        const res = await addItemToCart({
            userId: '60c72b2f9b1e8a0015f8a001',
            itemId: '60c72b2f9b1e8a0015f8a002',
            size: 'M',
            quantity: 2,
        });

        expect(res).toEqual({ '60c72b2f9b1e8a0015f8a002': { M: 2 } });
        expect(mockCart.save).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
    });
});

describe('updateCartItem', () => {
    test('updates quantity in cartModel and saves', async () => {
        const mockUser = { _id: '60c72b2f9b1e8a0015f8a001', cartData: {}, save: jest.fn().mockResolvedValue({}) };
        mockUserModel.findById.mockResolvedValue(mockUser);

        const mockCart = {
            items: [{ productId: '60c72b2f9b1e8a0015f8a002', size: 'L', quantity: 1 }],
            lastActivityAt: new Date(),
            status: 'ACTIVE',
            save: jest.fn().mockResolvedValue({}),
        };
        mockCartModel.findOne.mockResolvedValue(mockCart);

        const res = await updateCartItem({
            userId: '60c72b2f9b1e8a0015f8a001',
            itemId: '60c72b2f9b1e8a0015f8a002',
            size: 'L',
            quantity: 4,
        });

        expect(res).toEqual({ '60c72b2f9b1e8a0015f8a002': { L: 4 } });
        expect(mockCart.save).toHaveBeenCalled();
    });
});

describe('clearUserCart', () => {
    test('empties items array in cartModel and saves', async () => {
        const mockUser = { _id: '60c72b2f9b1e8a0015f8a001', cartData: {}, save: jest.fn().mockResolvedValue({}) };
        mockUserModel.findById.mockResolvedValue(mockUser);

        const mockCart = {
            items: [{ productId: '60c72b2f9b1e8a0015f8a002', size: 'L', quantity: 1 }],
            save: jest.fn().mockResolvedValue({}),
        };
        mockCartModel.findOne.mockResolvedValue(mockCart);

        await clearUserCart('60c72b2f9b1e8a0015f8a001');

        expect(mockCart.items).toEqual([]);
        expect(mockCart.save).toHaveBeenCalled();
    });
});

describe('getUserCart', () => {
    test('returns cart items as map object', async () => {
        const mockUser = { _id: '60c72b2f9b1e8a0015f8a001' };
        mockUserModel.findById.mockResolvedValue(mockUser);

        const mockCart = {
            items: [{ productId: '60c72b2f9b1e8a0015f8a002', size: 'M', quantity: 1 }],
        };
        mockCartModel.findOne.mockResolvedValue(mockCart);

        const result = await getUserCart('60c72b2f9b1e8a0015f8a001');
        expect(result).toEqual({ '60c72b2f9b1e8a0015f8a002': { M: 1 } });
    });
});
