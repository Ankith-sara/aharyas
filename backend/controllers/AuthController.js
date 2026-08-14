import {
    initiateRegistration, confirmRegistration, loginWithPassword, rotateRefreshToken,
    loginWithGoogle, loginAdminWithGoogle, loginAdmin, initiateAdminOtp, confirmAdminOtp,
    initiateForgotPassword, confirmPasswordReset,
} from '../services/AuthService.js';
import { handleError } from './utils.js';

// User registration 
const sendOtp = async (req, res) => {
    try {
        await initiateRegistration(req.body);
        res.json({ success: true, message: 'OTP sent to your email.' });
    } catch (error) {
        handleError(res, error, 'sendOtp');
    }
};

const verifyOtp = async (req, res) => {
    try {
        const result = await confirmRegistration(req.body);
        res.json({ success: true, ...result, message: `Welcome ${result.name}!` });
    } catch (error) {
        handleError(res, error, 'verifyOtp');
    }
};

// User login & token
const loginUser = async (req, res) => {
    try {
        const result = await loginWithPassword(req.body);
        res.json({ success: true, ...result, message: `Welcome back, ${result.name}!` });
    } catch (error) {
        handleError(res, error, 'loginUser');
    }
};

const refreshToken = async (req, res) => {
    const { refreshToken: token } = req.body;
    if (!token)
        return res.status(401).json({ success: false, message: 'Refresh token required' });
    try {
        const result = await rotateRefreshToken(token);
        res.json({ success: true, ...result });
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

// User Google OAuth
const googleAuth = async (req, res) => {
    const { credential } = req.body;
    if (!credential)
        return res.status(400).json({ success: false, message: 'Google credential is required' });
    try {
        const result = await loginWithGoogle(credential);
        res.json({ success: true, ...result, message: `Welcome, ${result.name}!` });
    } catch (error) {
        handleError(res, error, 'googleAuth');
    }
};

// User forgot / reset password
const sendForgotPasswordOtp = async (req, res) => {
    try {
        await initiateForgotPassword(req.body);
        res.json({ success: true, message: 'Password reset OTP sent.' });
    } catch (error) {
        handleError(res, error, 'sendForgotPasswordOtp');
    }
};

const resetPassword = async (req, res) => {
    try {
        await confirmPasswordReset(req.body);
        res.json({ success: true, message: 'Password reset successful.' });
    } catch (error) {
        handleError(res, error, 'resetPassword');
    }
};

// Admin login 
const adminLogin = async (req, res) => {
    try {
        const result = await loginAdmin(req.body);
        res.json({ success: true, ...result, message: 'Admin login successful' });
    } catch (error) {
        handleError(res, error, 'adminLogin');
    }
};

const sendAdminOtp = async (req, res) => {
    try {
        await initiateAdminOtp(req.body.email);
        res.json({ success: true, message: 'OTP sent.' });
    } catch (error) {
        handleError(res, error, 'sendAdminOtp');
    }
};

const verifyAdminOtp = async (req, res) => {
    try {
        const result = await confirmAdminOtp(req.body);
        res.json({ success: true, ...result, message: `Welcome ${result.name}!` });
    } catch (error) {
        handleError(res, error, 'verifyAdminOtp');
    }
};

// Admin Google OAuth
const adminGoogleAuth = async (req, res) => {
    const { credential } = req.body;
    if (!credential)
        return res.status(400).json({ success: false, message: 'Google credential is required' });
    try {
        const result = await loginAdminWithGoogle(credential);
        res.json({ success: true, ...result, message: `Welcome back, ${result.name}!` });
    } catch (error) {
        handleError(res, error, 'adminGoogleAuth');
    }
};

export {
    sendOtp, verifyOtp, loginUser, refreshToken, googleAuth, sendForgotPasswordOtp, resetPassword,
    adminLogin, sendAdminOtp, verifyAdminOtp, adminGoogleAuth,
};