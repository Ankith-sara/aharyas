import {
    addItemToCart, updateCartItem, removeCartItem,
    clearUserCart, getUserCart, mergeGuestCart,
} from './CartService.js';
import { handleError } from '../user/utils.js';

// Input guard 
const requireFields = (res, fields, body) => {
    for (const field of fields) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
            res.status(400).json({ success: false, message: `${field} is required` });
            return false;
        }
    }
    return true;
};

// Controllers
const addToCart = async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!requireFields(res, ['itemId'], req.body)) return;

    try {
        const cartData = await addItemToCart({
            userId,
            itemId: req.body.itemId,
            size: req.body.size,
            quantity: req.body.quantity,
        });
        res.json({ success: true, message: 'Product added to cart', cartData });
    } catch (error) {
        handleError(res, error, 'addToCart');
    }
};

const updateCart = async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!requireFields(res, ['itemId', 'quantity'], req.body)) return;

    try {
        const cartData = await updateCartItem({
            userId,
            itemId: req.body.itemId,
            size: req.body.size,
            quantity: req.body.quantity,
        });
        res.json({ success: true, message: 'Cart updated successfully', cartData });
    } catch (error) {
        handleError(res, error, 'updateCart');
    }
};

const removeFromCart = async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!requireFields(res, ['itemId'], req.body)) return;

    try {
        const cartData = await removeCartItem({
            userId,
            itemId: req.body.itemId,
            size: req.body.size,
        });
        res.json({ success: true, message: 'Product removed from cart', cartData });
    } catch (error) {
        handleError(res, error, 'removeFromCart');
    }
};

const clearCart = async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    try {
        await clearUserCart(userId);
        res.json({ success: true, message: 'Cart cleared successfully', cartData: {} });
    } catch (error) {
        handleError(res, error, 'clearCart');
    }
};

const getUserCartData = async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    try {
        const cartData = await getUserCart(userId);
        res.json({ success: true, cartData });
    } catch (error) {
        handleError(res, error, 'getUserCart');
    }
};

const mergeCartData = async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    try {
        const cartData = await mergeGuestCart({
            userId,
            guestCart: req.body.guestCart,
        });
        res.json({ success: true, message: 'Guest cart merged successfully', cartData });
    } catch (error) {
        handleError(res, error, 'mergeCartData');
    }
};

export { addToCart, updateCart, getUserCartData as getUserCart, removeFromCart, clearCart, mergeCartData };
