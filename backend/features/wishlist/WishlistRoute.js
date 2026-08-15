import express from 'express';
import { addToWishlist, getUserWishlist, getWishlistWithDetails, removeFromWishlist, toggleWishlist } from './WishlistController.js';
import authUser from '../../middlewares/auth.js';
import { validateWishlist } from '../../middlewares/validate.js';
import { authenticatedLimiter } from '../../middlewares/rateLimiter.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/add', authUser, authenticatedLimiter, validateWishlist, addToWishlist);
wishlistRouter.post('/remove', authUser, authenticatedLimiter, validateWishlist, removeFromWishlist);
wishlistRouter.post('/toggle', authUser, authenticatedLimiter, validateWishlist, toggleWishlist);
wishlistRouter.post('/get', authUser, authenticatedLimiter, getUserWishlist);
wishlistRouter.post('/details', authUser, authenticatedLimiter, getWishlistWithDetails);

export default wishlistRouter;
