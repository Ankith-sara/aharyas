import {
    addItemToCart, updateCartItem, removeCartItem, 
    clearUserCart, getUserCart,
} from '../services/CartService.js';
import { handleError } from './utils.js';

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
    if (!requireFields(res, ['userId', 'itemId'], req.body)) return;
    try {
        const cartData = await addItemToCart(req.body);
        res.json({ success: true, message: 'Product added to cart', cartData });
    } catch (error) {
        handleError(res, error, 'addToCart');
    }
};

const updateCart = async (req, res) => {
    if (!requireFields(res, ['userId', 'itemId', 'quantity'], req.body)) return;
    try {
        const cartData = await updateCartItem(req.body);
        res.json({ success: true, message: 'Cart updated successfully', cartData });
    } catch (error) {
        handleError(res, error, 'updateCart');
    }
};

const removeFromCart = async (req, res) => {
    if (!requireFields(res, ['userId', 'itemId'], req.body)) return;
    try {
        const cartData = await removeCartItem(req.body);
        res.json({ success: true, message: 'Product removed from cart', cartData });
    } catch (error) {
        handleError(res, error, 'removeFromCart');
    }
};

const clearCart = async (req, res) => {
    if (!requireFields(res, ['userId'], req.body)) return;
    try {
        await clearUserCart(req.body.userId);
        res.json({ success: true, message: 'Cart cleared successfully', cartData: {} });
    } catch (error) {
        handleError(res, error, 'clearCart');
    }
};

const getUserCartData = async (req, res) => {
    if (!requireFields(res, ['userId'], req.body)) return;
    try {
        const cartData = await getUserCart(req.body.userId);
        res.json({ success: true, cartData });
    } catch (error) {
        handleError(res, error, 'getUserCart');
    }
};

export { addToCart, updateCart, getUserCartData as getUserCart, removeFromCart, clearCart };