import logger from '../config/logger.js';
import {
    addToWishlist as addItem, removeFromWishlist as removeItem, toggleWishlistItem,
    getUserWishlist as fetchUserWishlist, getWishlistWithDetails as fetchWishlistWithDetails,
} from '../services/WishlistService.js';

// Shared helpers
const handleError = (res, error, context) => {
    logger.error(`${context}: ${error.message}`, error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
};

const requireFields = (res, fields, body) => {
    for (const field of fields) {
        if (!body[field]) {
            res.status(400).json({ success: false, message: `${field} is required` });
            return false;
        }
    }
    return true;
};

// Controllers
const addToWishlist = async (req, res) => {
    try {
        const wishlist = await addItem(req.body);
        res.json({ success: true, message: 'Product added to wishlist', wishlist });
    } catch (error) {
        handleError(res, error, 'addToWishlist');
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const wishlist = await removeItem(req.body);
        res.json({ success: true, message: 'Product removed from wishlist', wishlist });
    } catch (error) {
        handleError(res, error, 'removeFromWishlist');
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const { wishlist, isAdded } = await toggleWishlistItem(req.body);
        const message = isAdded ? 'Product added to wishlist' : 'Product removed from wishlist';
        res.json({ success: true, message, wishlist, isAdded });
    } catch (error) {
        handleError(res, error, 'toggleWishlist');
    }
};

const getUserWishlist = async (req, res) => {
    if (!requireFields(res, ['userId'], req.body)) return;
    try {
        const wishlist = await fetchUserWishlist(req.body.userId);
        res.json({ success: true, wishlist });
    } catch (error) {
        handleError(res, error, 'getUserWishlist');
    }
};

const getWishlistWithDetails = async (req, res) => {
    if (!requireFields(res, ['userId'], req.body)) return;
    try {
        const wishlist = await fetchWishlistWithDetails(req.body.userId);
        res.json({ success: true, wishlist });
    } catch (error) {
        handleError(res, error, 'getWishlistWithDetails');
    }
};

export { addToWishlist, removeFromWishlist, toggleWishlist, getUserWishlist, getWishlistWithDetails };