import {
    addToWishlist as addItem, removeFromWishlist as removeItem, toggleWishlistItem,
    getUserWishlist as fetchUserWishlist, getWishlistWithDetails as fetchWishlistWithDetails,
} from './WishlistService.js';
import { handleError } from '../user/utils.js';

// Shared helpers
const requireFields = (res, fields, body) => {
    for (const field of fields) {
        if (!body[field]) {
            res.status(400).json({ success: false, message: `${field} is required` });
            return false;
        }
    }
    return true;
};

// Helper to get authenticated userId
const getAuthenticatedUserId = (req) => req.user?._id?.toString() || req.user?.id?.toString();

// Controllers
const addToWishlist = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
        const wishlist = await addItem({ ...req.body, userId });
        res.json({ success: true, message: 'Product added to wishlist', wishlist });
    } catch (error) {
        handleError(res, error, 'addToWishlist');
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
        const wishlist = await removeItem({ ...req.body, userId });
        res.json({ success: true, message: 'Product removed from wishlist', wishlist });
    } catch (error) {
        handleError(res, error, 'removeFromWishlist');
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
        const { wishlist, isAdded } = await toggleWishlistItem({ ...req.body, userId });
        const message = isAdded ? 'Product added to wishlist' : 'Product removed from wishlist';
        res.json({ success: true, message, wishlist, isAdded });
    } catch (error) {
        handleError(res, error, 'toggleWishlist');
    }
};

const getUserWishlist = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
        const wishlist = await fetchUserWishlist(userId);
        res.json({ success: true, wishlist });
    } catch (error) {
        handleError(res, error, 'getUserWishlist');
    }
};

const getWishlistWithDetails = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
        const wishlist = await fetchWishlistWithDetails(userId);
        res.json({ success: true, wishlist });
    } catch (error) {
        handleError(res, error, 'getWishlistWithDetails');
    }
};

export { addToWishlist, removeFromWishlist, toggleWishlist, getUserWishlist, getWishlistWithDetails };
