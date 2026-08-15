import cartModel from './CartModel.js';
import userModel from '../user/UserModel.js';
import productModel from '../product/ProductModel.js';
import logger from '../../config/logger.js';

// Converts CartModel items array to legacy map format { [itemId]: { [size]: qty } }
export const cartItemsToMapObject = (items = []) => {
    const obj = {};
    for (const item of items) {
        const pId = item.productId.toString();
        const size = item.size || 'N/A';
        if (!obj[pId]) obj[pId] = {};
        obj[pId][size] = item.quantity;
    }
    return obj;
};

// Syncs CartModel state to UserModel.cartData for backwards compatibility
const syncUserCartData = async (user, cartItems) => {
    try {
        const mapObj = cartItemsToMapObject(cartItems);
        user.cartData = mapObj;
        await user.save();
    } catch (err) {
        logger.error(`[CartService] Failed to sync user cartData for ${user._id}`, err);
    }
};

const getOrCreateCart = async (userId) => {
    let cart = await cartModel.findOne({ userId });
    if (!cart) {
        cart = await cartModel.create({ userId, items: [], status: 'ACTIVE', lastActivityAt: new Date() });
    }
    return cart;
};

const touchCartActivity = (cart) => {
    cart.lastActivityAt = new Date();
    cart.status = 'ACTIVE';
    cart.abandonedAt = null;
    cart.reminder1SentAt = null;
    cart.reminder2SentAt = null;
    cart.reminder7SentAt = null;
};

export const addItemToCart = async ({ userId, itemId, size = 'N/A', quantity = 1 }) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const product = await productModel.findById(itemId);
    if (!product || !product.visible) {
        throw Object.assign(new Error('Product not available'), { statusCode: 400 });
    }

    const cart = await getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex(
        (i) => i.productId.toString() === itemId.toString() && i.size === size
    );

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    if (existingIndex > -1) {
        const newQty = Math.min(10, cart.items[existingIndex].quantity + qtyToAdd);
        cart.items[existingIndex].quantity = newQty;
        cart.items[existingIndex].updatedAt = new Date();
    } else {
        cart.items.push({
            productId: itemId,
            size,
            quantity: Math.min(10, qtyToAdd),
            addedAt: new Date(),
            updatedAt: new Date(),
        });
    }

    touchCartActivity(cart);
    await cart.save();
    await syncUserCartData(user, cart.items);

    return cartItemsToMapObject(cart.items);
};

export const updateCartItem = async ({ userId, itemId, size = 'N/A', quantity }) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const cart = await getOrCreateCart(userId);
    const targetQty = parseInt(quantity, 10);

    if (isNaN(targetQty) || targetQty <= 0) {
        // Remove item
        cart.items = cart.items.filter(
            (i) => !(i.productId.toString() === itemId.toString() && i.size === size)
        );
    } else {
        const existingIndex = cart.items.findIndex(
            (i) => i.productId.toString() === itemId.toString() && i.size === size
        );
        if (existingIndex > -1) {
            cart.items[existingIndex].quantity = Math.min(10, targetQty);
            cart.items[existingIndex].updatedAt = new Date();
        } else {
            const product = await productModel.findById(itemId);
            if (product && product.visible) {
                cart.items.push({
                    productId: itemId,
                    size,
                    quantity: Math.min(10, targetQty),
                    addedAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
    }

    touchCartActivity(cart);
    await cart.save();
    await syncUserCartData(user, cart.items);

    return cartItemsToMapObject(cart.items);
};

export const removeCartItem = async ({ userId, itemId, size = 'N/A' }) => {
    return updateCartItem({ userId, itemId, size, quantity: 0 });
};

export const clearUserCart = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const cart = await getOrCreateCart(userId);
    cart.items = [];
    touchCartActivity(cart);
    await cart.save();
    await syncUserCartData(user, []);
};

export const getUserCart = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const cart = await getOrCreateCart(userId);
    return cartItemsToMapObject(cart.items);
};

/**
 * Deterministically merges guest cart items into authenticated user cart upon login.
 * Accepts guestCart as map object `{ [itemId]: { [size]: qty } }` or array of items.
 */
export const mergeGuestCart = async ({ userId, guestCart }) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    if (!guestCart) return getUserCart(userId);

    const cart = await getOrCreateCart(userId);

    // Normalize guest cart into array of { itemId, size, quantity }
    const guestItems = [];
    if (Array.isArray(guestCart)) {
        for (const item of guestCart) {
            if (item?.productId || item?.itemId) {
                guestItems.push({
                    itemId: item.productId || item.itemId,
                    size: item.size || 'N/A',
                    quantity: parseInt(item.quantity, 10) || 1,
                });
            }
        }
    } else if (typeof guestCart === 'object') {
        for (const [itemId, sizes] of Object.entries(guestCart)) {
            if (typeof sizes === 'object' && sizes !== null) {
                for (const [size, qty] of Object.entries(sizes)) {
                    guestItems.push({
                        itemId,
                        size,
                        quantity: parseInt(qty, 10) || 1,
                    });
                }
            }
        }
    }

    for (const gItem of guestItems) {
        if (!gItem.itemId || gItem.quantity <= 0) continue;
        const product = await productModel.findById(gItem.itemId);
        if (!product || !product.visible) continue;

        const existingIndex = cart.items.findIndex(
            (i) => i.productId.toString() === gItem.itemId.toString() && i.size === gItem.size
        );

        if (existingIndex > -1) {
            const mergedQty = Math.min(10, cart.items[existingIndex].quantity + gItem.quantity);
            cart.items[existingIndex].quantity = mergedQty;
            cart.items[existingIndex].updatedAt = new Date();
        } else {
            cart.items.push({
                productId: gItem.itemId,
                size: gItem.size,
                quantity: Math.min(10, gItem.quantity),
                addedAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

    touchCartActivity(cart);
    await cart.save();
    await syncUserCartData(user, cart.items);

    return cartItemsToMapObject(cart.items);
};
