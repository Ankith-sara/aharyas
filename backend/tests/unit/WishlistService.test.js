import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ESM mocks 
const mockUserModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
};

jest.unstable_mockModule('../../features/user/UserModel.js', () => ({
    default: mockUserModel,
}));

const {
    addToWishlist, removeFromWishlist, toggleWishlistItem,
    getUserWishlist, getWishlistWithDetails,
} = await import('../../features/wishlist/WishlistService.js');

beforeEach(() => jest.clearAllMocks());

// Shared "user not found" behaviour 
describe('all operations — throws 404 when user not found', () => {
    beforeEach(() => mockUserModel.findById.mockResolvedValue(null));

    test('addToWishlist',       async () => {
        await expect(addToWishlist({ userId: 'uid', itemId: 'pid' })).rejects.toMatchObject({ statusCode: 404 });
    });
    test('removeFromWishlist',  async () => {
        await expect(removeFromWishlist({ userId: 'uid', itemId: 'pid' })).rejects.toMatchObject({ statusCode: 404 });
    });
    test('toggleWishlistItem',  async () => {
        await expect(toggleWishlistItem({ userId: 'uid', itemId: 'pid' })).rejects.toMatchObject({ statusCode: 404 });
    });
    test('getUserWishlist',     async () => {
        await expect(getUserWishlist('uid')).rejects.toMatchObject({ statusCode: 404 });
    });
});

// addToWishlist
describe('addToWishlist', () => {
    test('throws 400 when item is already in wishlist', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: ['pid1'] });

        await expect(addToWishlist({ userId: 'uid', itemId: 'pid1' }))
            .rejects.toMatchObject({ statusCode: 400, message: 'Item already in wishlist' });
    });

    test('adds item and persists', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: ['pid1'] });
        mockUserModel.findByIdAndUpdate.mockResolvedValue({});

        const result = await addToWishlist({ userId: 'uid', itemId: 'pid2' });

        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('uid', { wishlist: ['pid1', 'pid2'] });
        expect(result).toEqual(['pid1', 'pid2']);
    });

    test('works when user wishlist is undefined', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: undefined });
        mockUserModel.findByIdAndUpdate.mockResolvedValue({});

        const result = await addToWishlist({ userId: 'uid', itemId: 'pid1' });
        expect(result).toEqual(['pid1']);
    });
});

//  removeFromWishlist
describe('removeFromWishlist', () => {
    test('removes the specified item', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: ['pid1', 'pid2', 'pid3'] });
        mockUserModel.findByIdAndUpdate.mockResolvedValue({});

        const result = await removeFromWishlist({ userId: 'uid', itemId: 'pid2' });

        expect(result).toEqual(['pid1', 'pid3']);
        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('uid', { wishlist: ['pid1', 'pid3'] });
    });

    test('returns unchanged list when item is not present', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: ['pid1'] });
        mockUserModel.findByIdAndUpdate.mockResolvedValue({});

        const result = await removeFromWishlist({ userId: 'uid', itemId: 'pid999' });
        expect(result).toEqual(['pid1']);
    });
});

// toggleWishlistItem 
describe('toggleWishlistItem', () => {
    test('adds item and returns isAdded=true when not in wishlist', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: ['pid1'] });
        mockUserModel.findByIdAndUpdate.mockResolvedValue({});

        const result = await toggleWishlistItem({ userId: 'uid', itemId: 'pid2' });

        expect(result.isAdded).toBe(true);
        expect(result.wishlist).toContain('pid2');
        expect(result.wishlist).toContain('pid1');
    });

    test('removes item and returns isAdded=false when already in wishlist', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: ['pid1', 'pid2'] });
        mockUserModel.findByIdAndUpdate.mockResolvedValue({});

        const result = await toggleWishlistItem({ userId: 'uid', itemId: 'pid1' });

        expect(result.isAdded).toBe(false);
        expect(result.wishlist).not.toContain('pid1');
        expect(result.wishlist).toContain('pid2');
    });
});

// getUserWishlist
describe('getUserWishlist', () => {
    test('returns the wishlist array', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: ['pid1', 'pid2'] });

        const result = await getUserWishlist('uid');
        expect(result).toEqual(['pid1', 'pid2']);
    });

    test('returns empty array when wishlist is undefined', async () => {
        mockUserModel.findById.mockResolvedValue({ wishlist: undefined });

        const result = await getUserWishlist('uid');
        expect(result).toEqual([]);
    });
});

// getWishlistWithDetails
describe('getWishlistWithDetails', () => {
    test('throws 404 when user does not exist', async () => {
        mockUserModel.findById.mockResolvedValue(null);

        await expect(getWishlistWithDetails('uid')).rejects.toMatchObject({ statusCode: 404 });
    });

    test('returns populated product list', async () => {
        const mockProducts = [{ _id: 'pid1', name: 'Saree' }];
        mockUserModel.findById
            .mockResolvedValueOnce({ wishlist: ['pid1'] })
            .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue({ wishlist: mockProducts }) });

        const result = await getWishlistWithDetails('uid');
        expect(result).toEqual(mockProducts);
    });

    test('returns empty array when populated wishlist is null', async () => {
        mockUserModel.findById
            .mockResolvedValueOnce({ wishlist: ['pid1'] })
            .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue({ wishlist: null }) });

        const result = await getWishlistWithDetails('uid');
        expect(result).toEqual([]);
    });
});
