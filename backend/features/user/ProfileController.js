import logger from '../../config/logger.js';
import sendNewsletterMail from '../../middlewares/sendNewsletterMail.js';
import {
    getProfile, getProfileById, updateProfile, upsertAddress,
    removeAddress, changePassword as updatePassword, deleteProfile,
} from './ProfileService.js';
import { getUserAnalyticsData } from './UserService.js';
import { fetchVercelAnalytics } from '../analytics/VercelAnalyticsService.js';

//  Shared helper
const handleError = (res, error, context) => {
    logger.error(`${context}: ${error.message}`, error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
};

// Check ownership helper (IDOR protection)
const verifyOwnership = (req, res) => {
    const authenticatedId = req.user?._id?.toString() || req.user?.id?.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!authenticatedId || (authenticatedId !== req.params.id && !isAdmin)) {
        res.status(403).json({ success: false, message: 'Access denied. You do not own this profile.' });
        return false;
    }
    return true;
};

// Profile reads
const getUserProfile = async (req, res) => {
    const userId = req.user?._id?.toString() || req.user?.id?.toString();
    if (!userId)
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const user = await getProfile(userId);
        res.json({ success: true, user });
    } catch (error) {
        handleError(res, error, 'getUserProfile');
    }
};

const getUserDetails = async (req, res) => {
    if (!verifyOwnership(req, res)) return;
    try {
        const user = await getProfileById(req.params.id);
        res.json({ success: true, user });
    } catch (error) {
        handleError(res, error, 'getUserDetails');
    }
};

// Profile writes 
const updateUserProfile = async (req, res) => {
    if (!verifyOwnership(req, res)) return;
    try {
        const { name, email, phone } = req.body;
        const user = await updateProfile({ id: req.params.id, name, email, phone, imageFile: req.file });
        res.json({ success: true, user });
    } catch (error) {
        handleError(res, error, 'updateUserProfile');
    }
};

// Account Deletion
const deleteUserProfile = async (req, res) => {
    if (!verifyOwnership(req, res)) return;
    try {
        await deleteProfile(req.params.id);
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        handleError(res, error, 'deleteUserProfile');
    }
};

// Address management 
const addOrUpdateAddress = async (req, res) => {
    if (!verifyOwnership(req, res)) return;
    try {
        const addresses = await upsertAddress({ userId: req.params.id, ...req.body });
        res.json({ success: true, addresses });
    } catch (error) {
        handleError(res, error, 'addOrUpdateAddress');
    }
};

const deleteAddress = async (req, res) => {
    if (!verifyOwnership(req, res)) return;
    try {
        const addresses = await removeAddress({ userId: req.params.id, index: req.body.index });
        res.json({ success: true, addresses });
    } catch (error) {
        handleError(res, error, 'deleteAddress');
    }
};

// Password change
const changePassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, password: newPassword } = req.body;
    const authenticatedId = req.user?._id?.toString() || req.user?.id?.toString();

    // Users may only change their own password
    if (!authenticatedId || authenticatedId !== id)
        return res.status(403).json({ success: false, message: 'Forbidden: You can only change your own password.' });

    try {
        await updatePassword({ userId: id, currentPassword, newPassword });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        handleError(res, error, 'changePassword');
    }
};

// Newsletter 
const subscribeNewsletter = async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ success: false, message: 'Email is required' });
    try {
        await sendNewsletterMail(email);
        res.json({ success: true, message: 'Email sent! Check your inbox for the WhatsApp join link.' });
    } catch (error) {
        handleError(res, error, 'subscribeNewsletter');
    }
};

const getUserAnalytics = async (req, res) => {
    try {
        const analytics = await getUserAnalyticsData();
        res.json({ success: true, analytics });
    } catch (error) {
        handleError(res, error, 'getUserAnalytics');
    }
};

const getVercelAnalytics = async (req, res) => {
    try {
        const data = await fetchVercelAnalytics();
        res.json({ success: true, data });
    } catch (error) {
        handleError(res, error, 'getVercelAnalytics');
    }
};

export {
    getUserProfile, getUserDetails, updateUserProfile, deleteUserProfile, addOrUpdateAddress, deleteAddress,
    changePassword, subscribeNewsletter, getUserAnalytics, getVercelAnalytics,
};
