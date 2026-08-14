import userModel from '../models/UserModel.js';

// Converts a Mongoose Map cartData → plain object for API responses
export const cartToObject = (cartData) => {
    const obj = {};
    if (!cartData || !(cartData instanceof Map)) return obj;
    cartData.forEach((sizes, itemId) => {
        obj[itemId] = {};
        if (sizes instanceof Map) {
            sizes.forEach((qty, size) => { obj[itemId][size] = qty; });
        }
    });
    return obj;
};

const requireUser = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
};

export const addItemToCart = async ({ userId, itemId, size = 'N/A', quantity = 1 }) => {
    const user = await requireUser(userId);
    user.addToCart(itemId, size, quantity);
    await user.save();
    return cartToObject(user.cartData);
};

export const updateCartItem = async ({ userId, itemId, size = 'N/A', quantity }) => {
    const user = await requireUser(userId);
    user.updateCartItem(itemId, size, quantity);
    await user.save();
    return cartToObject(user.cartData);
};

export const removeCartItem = async ({ userId, itemId, size = 'N/A' }) => {
    const user = await requireUser(userId);
    user.updateCartItem(itemId, size, 0);
    await user.save();
    return cartToObject(user.cartData);
};

export const clearUserCart = async (userId) => {
    const user = await requireUser(userId);
    user.clearCart();
    await user.save();
};

export const getUserCart = async (userId) => {
    const user = await requireUser(userId);
    return cartToObject(user.cartData);
};
