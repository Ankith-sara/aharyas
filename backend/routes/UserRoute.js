import express from 'express';
import upload from '../middlewares/multer.js';
import authUser from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import {
    loginLimiter, registerLimiter, otpLimiter, forgotPasswordLimiter,
    authenticatedLimiter,
} from '../middlewares/rateLimiter.js';
import {
    validateRegister, validateLogin, validateOtp, validateForgotPasswordOtp,
    validateResetPassword, validateAddressUpdate, validateAddressDelete,
    validateChangePassword, validateSubscribe, validateMongoId,
} from '../middlewares/validate.js';
import {
    sendOtp, verifyOtp, loginUser, refreshToken, googleAuth, sendForgotPasswordOtp,
    resetPassword, adminLogin, sendAdminOtp, verifyAdminOtp, adminGoogleAuth,
} from '../controllers/AuthController.js';
import {
    getUserProfile, getUserDetails, updateUserProfile, deleteUserProfile, addOrUpdateAddress, deleteAddress,
    changePassword, subscribeNewsletter, getUserAnalytics, getVercelAnalytics,
} from '../controllers/ProfileController.js';

const userRouter = express.Router();

// Auth – strict rate limits with per-IP + per-account tracking & exponential backoff
userRouter.post('/send-otp', registerLimiter, validateRegister, sendOtp);
userRouter.post('/verify-otp', otpLimiter, validateOtp, verifyOtp);
userRouter.post('/login', loginLimiter, validateLogin, loginUser);
userRouter.post('/refresh-token', refreshToken);
userRouter.post('/google-auth', loginLimiter, googleAuth);
userRouter.post('/forgot-password-otp', forgotPasswordLimiter, validateForgotPasswordOtp, sendForgotPasswordOtp);
userRouter.post('/reset-password', otpLimiter, validateResetPassword, resetPassword);
userRouter.post('/admin-login', loginLimiter, validateLogin, adminLogin);
userRouter.post('/send-admin-otp', registerLimiter, validateRegister, sendAdminOtp);
userRouter.post('/verify-admin-otp', otpLimiter, validateOtp, verifyAdminOtp);
userRouter.post('/admin-google-auth', loginLimiter, adminGoogleAuth);

// Admin analytics
userRouter.get('/analytics', adminAuth, getUserAnalytics);
userRouter.get('/vercel-analytics', adminAuth, getVercelAnalytics);

// Authenticated user actions – looser limits + param validation
userRouter.get('/profile', authUser, authenticatedLimiter, getUserProfile);
userRouter.get('/profile/:id', authUser, authenticatedLimiter, validateMongoId, getUserDetails);
userRouter.put('/profile/:id', authUser, authenticatedLimiter, validateMongoId, upload.single('image'), updateUserProfile);
userRouter.delete('/profile/:id', authUser, authenticatedLimiter, validateMongoId, deleteUserProfile);
userRouter.put('/address/:id', authUser, authenticatedLimiter, validateMongoId, validateAddressUpdate, addOrUpdateAddress);
userRouter.delete('/address/:id', authUser, authenticatedLimiter, validateMongoId, validateAddressDelete, deleteAddress);
userRouter.put('/change-password/:id', authUser, authenticatedLimiter, validateMongoId, validateChangePassword, changePassword);
userRouter.post('/newsletter/subscribe', validateSubscribe, subscribeNewsletter);

export default userRouter;