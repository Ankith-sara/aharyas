import userModel from '../models/UserModel.js';

const requireUser = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
};

export const addToWishlist = async ({ userId, itemId }) => {
    const user = await requireUser(userId);
    const wishlist = user.wishlist || [];
    if (wishlist.includes(itemId))
        throw Object.assign(new Error('Item already in wishlist'), { statusCode: 400 });
    wishlist.push(itemId);
    await userModel.findByIdAndUpdate(userId, { wishlist });
    return wishlist;
};

export const removeFromWishlist = async ({ userId, itemId }) => {
    const user = await requireUser(userId);
    const wishlist = (user.wishlist || []).filter((id) => id !== itemId);
    await userModel.findByIdAndUpdate(userId, { wishlist });
    return wishlist;
};

export const toggleWishlistItem = async ({ userId, itemId }) => {
    const user = await requireUser(userId);
    let wishlist = user.wishlist || [];
    const isAlreadyAdded = wishlist.includes(itemId);

    wishlist = isAlreadyAdded
        ? wishlist.filter((id) => id !== itemId)
        : [...wishlist, itemId];

    await userModel.findByIdAndUpdate(userId, { wishlist });
    return { wishlist, isAdded: !isAlreadyAdded };
};

export const getUserWishlist = async (userId) => {
    const user = await requireUser(userId);
    return user.wishlist || [];
};

export const getWishlistWithDetails = async (userId) => {
    await requireUser(userId); 
    const populated = await userModel
        .findById(userId)
        .populate({ path: 'wishlist', model: 'product' });
    return populated?.wishlist || [];
};
