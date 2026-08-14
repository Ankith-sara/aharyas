import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ESM mocks (must be before dynamic imports)
const mockUserModel = {
    findById: jest.fn(),
};

jest.unstable_mockModule('../../models/UserModel.js', () => ({
    default: mockUserModel,
}));

// Dynamic imports (after mocks are registered) 
const { cartToObject, addItemToCart, updateCartItem, removeCartItem, clearUserCart, getUserCart } =
    await import('../../services/CartService.js');

beforeEach(() => jest.clearAllMocks());

// cartToObject 
describe('cartToObject', () => {
    test('returns empty object for null input', () => {
        expect(cartToObject(null)).toEqual({});
    });

    test('returns empty object for non-Map input', () => {
        expect(cartToObject({ itemId: { S: 1 } })).toEqual({});
    });

    test('converts nested Map structure to plain object', () => {
        const inner = new Map([['S', 2], ['M', 1]]);
        const outer = new Map([['item123', inner]]);
        expect(cartToObject(outer)).toEqual({ item123: { S: 2, M: 1 } });
    });

    test('handles item with non-Map sizes gracefully', () => {
        const outer = new Map([['item1', 'not-a-map']]);
        expect(cartToObject(outer)).toEqual({ item1: {} });
    });
});

// Shared "user not found" behaviour 
describe('all operations — throws 404 when user not found', () => {
    beforeEach(() => mockUserModel.findById.mockResolvedValue(null));

    test('addItemToCart', async () => {
        await expect(addItemToCart({ userId: 'uid', itemId: 'pid' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });
    test('updateCartItem', async () => {
        await expect(updateCartItem({ userId: 'uid', itemId: 'pid', quantity: 1 }))
            .rejects.toMatchObject({ statusCode: 404 });
    });
    test('removeCartItem', async () => {
        await expect(removeCartItem({ userId: 'uid', itemId: 'pid' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });
    test('clearUserCart', async () => {
        await expect(clearUserCart('uid')).rejects.toMatchObject({ statusCode: 404 });
    });
    test('getUserCart', async () => {
        await expect(getUserCart('uid')).rejects.toMatchObject({ statusCode: 404 });
    });
});

// addItemToCart 
describe('addItemToCart', () => {
    test('calls addToCart on user model and saves', async () => {
        const mockUser = { cartData: new Map(), addToCart: jest.fn(), save: jest.fn() };
        mockUserModel.findById.mockResolvedValue(mockUser);

        await addItemToCart({ userId: 'uid', itemId: 'pid', size: 'M', quantity: 2 });

        expect(mockUser.addToCart).toHaveBeenCalledWith('pid', 'M', 2);
        expect(mockUser.save).toHaveBeenCalled();
    });

    test('defaults size to N/A and quantity to 1 when not provided', async () => {
        const mockUser = { cartData: new Map(), addToCart: jest.fn(), save: jest.fn() };
        mockUserModel.findById.mockResolvedValue(mockUser);

        await addItemToCart({ userId: 'uid', itemId: 'pid' });

        expect(mockUser.addToCart).toHaveBeenCalledWith('pid', 'N/A', 1);
    });
});

// updateCartItem 
describe('updateCartItem', () => {
    test('calls updateCartItem on user model with correct args', async () => {
        const mockUser = { cartData: new Map(), updateCartItem: jest.fn(), save: jest.fn() };
        mockUserModel.findById.mockResolvedValue(mockUser);

        await updateCartItem({ userId: 'uid', itemId: 'pid', size: 'L', quantity: 3 });

        expect(mockUser.updateCartItem).toHaveBeenCalledWith('pid', 'L', 3);
        expect(mockUser.save).toHaveBeenCalled();
    });
});

// removeCartItem 
describe('removeCartItem', () => {
    test('calls updateCartItem with quantity 0 to remove item', async () => {
        const mockUser = { cartData: new Map(), updateCartItem: jest.fn(), save: jest.fn() };
        mockUserModel.findById.mockResolvedValue(mockUser);

        await removeCartItem({ userId: 'uid', itemId: 'pid', size: 'S' });

        expect(mockUser.updateCartItem).toHaveBeenCalledWith('pid', 'S', 0);
    });
});

// clearUserCart
describe('clearUserCart', () => {
    test('calls clearCart on user model and saves', async () => {
        const mockUser = { cartData: new Map(), clearCart: jest.fn(), save: jest.fn() };
        mockUserModel.findById.mockResolvedValue(mockUser);

        await clearUserCart('uid');

        expect(mockUser.clearCart).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
    });
});

// getUserCart
describe('getUserCart', () => {
    test('returns cartData as plain object', async () => {
        const inner = new Map([['M', 1]]);
        const mockUser = { cartData: new Map([['pid1', inner]]) };
        mockUserModel.findById.mockResolvedValue(mockUser);

        const result = await getUserCart('uid');
        expect(result).toEqual({ pid1: { M: 1 } });
    });
});
