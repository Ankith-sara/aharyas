import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import validator from 'validator';
import imagekit from '../../config/imagekit.js';
import fs from 'fs';
import path from 'path';
import userModel from './UserModel.js';
import sendOtpMail from '../../middlewares/sendOtpMail.js';
import sendWelcomeMail from '../../middlewares/sendWelcomeMail.js';
import sendNewsletterMail from '../../middlewares/sendNewsletterMail.js';
import logger from '../../config/logger.js';

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const createToken = (id, role = 'user') =>
    jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '14d' });

const createRefreshToken = (id, role = 'user') =>
    jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '21d' });

// USER REGISTRATION (OTP-BASED)
const sendOtp = async (req, res) => {
    const { email, name, password } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
    if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    try {
        let user = await userModel.findOne({ email });
        if (user && user.isVerified) return res.status(400).json({ success: false, message: 'User already exists. Please login instead.' });
        if (user && user.otpExpiry && user.otpExpiry > new Date()) {
            const timeLeft = Math.ceil((user.otpExpiry - new Date()) / 1000);
            return res.status(400).json({ success: false, message: `OTP already sent. Please wait ${timeLeft} seconds.` });
        }

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (user) {
            user.name = name; user.password = hashedPassword; user.role = 'user';
            user.otp = otp; user.otpExpiry = otpExpiry; user.isVerified = false;
        } else {
            user = new userModel({ email, name, password: hashedPassword, role: 'user', isVerified: false, otp, otpExpiry });
        }

        await user.save();
        await sendOtpMail(email, otp);
        res.json({ success: true, message: 'OTP sent to your email.' });
    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// USER LOGIN with lockout
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.isVerified) return res.status(401).json({ success: false, message: "Please verify your email first." });

        if (user.isLocked) {
            const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({ success: false, message: `Account locked. Try again in ${lockMinutes} minutes.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await user.incrementLoginAttempts();
            const attemptsLeft = Math.max(0, 5 - (user.loginAttempts + 1));
            return res.status(401).json({
                success: false,
                message: attemptsLeft > 0 ? `Invalid credentials. ${attemptsLeft} attempts remaining.` : 'Account locked for 30 minutes due to too many failed attempts.'
            });
        }

        await user.resetLoginAttempts();

        const token = createToken(user._id, user.role);
        const refreshToken = createRefreshToken(user._id, user.role);

        user.refreshToken = await bcrypt.hash(refreshToken, 10);
        await user.save();

        res.status(200).json({
            success: true, token, refreshToken,
            userId: user._id.toString(), name: user.name, role: user.role,
            message: `Welcome back, ${user.name}!`
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// REFRESH TOKEN
const refreshToken = async (req, res) => {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select('+refreshToken');
        if (!user || !user.refreshToken) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

        const isValid = await bcrypt.compare(token, user.refreshToken);
        if (!isValid) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

        const newAccessToken = createToken(user._id, user.role);
        const newRefreshToken = createRefreshToken(user._id, user.role);
        user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
        await user.save();

        res.json({ success: true, token: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        logger.error('Refresh token rotation failed', err);
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

// VERIFY OTP
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    try {
        const user = await userModel.findOne({ email }).select('+otp +otpExpiry');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (user.isVerified) return res.status(400).json({ success: false, message: 'Account already verified.' });
        if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Please use admin verification portal' });
        if (!user.otp || !user.otpExpiry) return res.status(400).json({ success: false, message: 'OTP not requested.' });
        if (user.otp !== otp) return res.status(401).json({ success: false, message: 'Invalid OTP' });
        if (user.otpExpiry < new Date()) return res.status(401).json({ success: false, message: 'OTP expired.' });

        user.isVerified = true; user.role = 'user';
        user.otp = undefined; user.otpExpiry = undefined;
        await user.save();
        await sendWelcomeMail(email, user.name);

        const token = createToken(user._id, 'user');
        res.json({ success: true, token, userId: user._id.toString(), name: user.name, role: 'user', message: `Welcome ${user.name}!` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// REGISTER WITHOUT OTP
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser && existingUser.isVerified) return res.status(400).json({ success: false, message: "User already exists." });
        if (existingUser && !existingUser.isVerified) return res.status(400).json({ success: false, message: "Registration in progress. Please verify your email." });
        if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: "Invalid email format" });
        if (password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new userModel({ name, email, password: hashedPassword, role: 'user', isVerified: true });
        const savedUser = await newUser.save();
        await sendWelcomeMail(email, savedUser.name);

        const token = createToken(savedUser._id, 'user');
        res.status(201).json({ success: true, token, userId: savedUser._id.toString(), name: savedUser.name, role: 'user', message: `Welcome ${savedUser.name}!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ADMIN LOGIN
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email, role: 'admin' });
        if (!user) return res.status(404).json({ success: false, message: 'Admin account not found' });
        if (!user.isVerified) return res.status(401).json({ success: false, message: "Please verify your email first." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = createToken(user._id, 'admin');
        res.status(200).json({ success: true, token, userId: user._id.toString(), name: user.name, role: 'admin', message: 'Admin login successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ADMIN OTP
const sendAdminOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });

    try {
        const user = await userModel.findOne({ email, role: 'admin' });
        if (!user || !user.isVerified) {
            return res.status(403).json({ success: false, message: 'This email is not authorised for admin access.' });
        }
        if (user.otpExpiry && user.otpExpiry > new Date()) {
            const timeLeft = Math.ceil((user.otpExpiry - new Date()) / 1000);
            return res.status(429).json({ success: false, message: `OTP already sent. Please wait ${timeLeft} seconds.` });
        }
        const otp = generateOtp();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        await sendOtpMail(email, otp);
        res.json({ success: true, message: 'OTP sent.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// VERIFY ADMIN OTP
const verifyAdminOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    try {
        const user = await userModel.findOne({ email }).select('+otp +otpExpiry');
        if (!user) return res.status(404).json({ success: false, message: 'Admin not found.' });
        if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not an admin account.' });
        if (!user.otp || !user.otpExpiry) return res.status(400).json({ success: false, message: 'OTP not requested.' });
        if (user.otp !== otp) return res.status(401).json({ success: false, message: 'Invalid OTP' });
        if (user.otpExpiry < new Date()) return res.status(401).json({ success: false, message: 'OTP expired.' });

        user.isVerified = true; user.otp = undefined; user.otpExpiry = undefined;
        await user.save();
        await sendWelcomeMail(email, user.name);

        const token = createToken(user._id, 'admin');
        res.json({ success: true, token, userId: user._id.toString(), name: user.name, role: 'admin', message: `Welcome ${user.name}!` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// FORGOT PASSWORD 
const sendForgotPasswordOtp = async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ success: false, message: 'Email and new password are required' });
    if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });
        if (!user.isVerified) return res.status(400).json({ success: false, message: 'Please complete your registration first.' });
        if (user.otpExpiry && user.otpExpiry > new Date()) {
            const timeLeft = Math.ceil((user.otpExpiry - new Date()) / 1000);
            return res.status(400).json({ success: false, message: `OTP already sent. Please wait ${timeLeft} seconds.` });
        }

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.tempPassword = hashedPassword; user.otp = otp; user.otpExpiry = otpExpiry;
        await user.save();
        await sendOtpMail(email, otp);
        res.json({ success: true, message: 'Password reset OTP sent.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    try {
        const user = await userModel.findOne({ email }).select('+otp +otpExpiry +tempPassword');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (!user.isVerified) return res.status(400).json({ success: false, message: 'Please complete your registration first.' });
        if (!user.otp || !user.otpExpiry) return res.status(400).json({ success: false, message: 'OTP not requested.' });
        if (user.otp !== otp) return res.status(401).json({ success: false, message: 'Invalid OTP' });
        if (user.otpExpiry < new Date()) return res.status(401).json({ success: false, message: 'OTP expired.' });
        if (!user.tempPassword) return res.status(400).json({ success: false, message: 'No password reset in progress.' });

        user.password = user.tempPassword; user.tempPassword = undefined;
        user.otp = undefined; user.otpExpiry = undefined;
        await user.save();
        res.json({ success: true, message: 'Password reset successful.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PROFILE
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?._id?.toString() || req.user?.id?.toString();
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        const user = await userModel.findById(userId).select('-password -otp -otpExpiry -tempPassword -refreshToken');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (error) {
        logger.error('getUserProfile failed', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id).select('-password -refreshToken');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (error) {
        logger.error('getUserDetails failed', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;
        let imageUrl = null;
        if (req.file) {
            try {
                const fileData = await fs.promises.readFile(req.file.path);
                const result = await imagekit.files.upload({
                    file: fileData.toString('base64'),
                    fileName: path.basename(req.file.path) || `profile_${Date.now()}`,
                    folder: 'user_profiles',
                });
                imageUrl = result.url;
            } finally {
                // Always clean up temp uploaded file
                fs.promises.unlink(req.file.path).catch((err) => {
                    console.error('[UserController] Failed to clean up temp file:', err.message);
                });
            }
        }
        const updatedFields = { name, email, phone };
        if (imageUrl) updatedFields.image = imageUrl;
        const user = await userModel.findByIdAndUpdate(id, updatedFields, { new: true, runValidators: true }).select('-password -refreshToken');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addOrUpdateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { addressObj, index } = req.body;
        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (typeof index === "number" && index >= 0) user.addresses[index] = addressObj;
        else user.addresses.push(addressObj);
        await user.save();
        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { index } = req.body;
        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        user.addresses.splice(index, 1);
        await user.save();
        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, currentPassword } = req.body;

        const authenticatedUserId = req.user?._id?.toString() || req.user?.id?.toString();
        if (!authenticatedUserId || authenticatedUserId !== id) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only change your own password." });
        }

        if (!password || password.length < 8) return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });

        const user = await userModel.findById(id).select('+password');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.password && currentPassword !== undefined) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await userModel.findByIdAndUpdate(id, { password: hashedPassword });
        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });
        await sendNewsletterMail(email);
        res.json({ success: true, message: "Email sent! Check your inbox for the WhatsApp join link." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ADMIN GOOGLE AUTH
const adminGoogleAuth = async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Google credential is required' });

    try {
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email } = payload;

        if (!email) return res.status(400).json({ success: false, message: 'Could not retrieve email from Google account' });

        const user = await userModel.findOne({ email, role: 'admin' });

        if (!user) {
            return res.status(403).json({
                success: false,
                message: 'No admin account found for this Google account. Please use admin credentials or contact a super admin.'
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: 'Admin account not yet verified.' });
        }

        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        const token = createToken(user._id, 'admin');
        res.json({
            success: true,
            token,
            userId: user._id.toString(),
            name: user.name,
            role: 'admin',
            message: `Welcome back, ${user.name}!`
        });
    } catch (err) {
        console.error('Admin Google auth error:', err);
        res.status(500).json({ success: false, message: 'Google authentication failed. Please try again.' });
    }
};

// GOOGLE AUTH
const googleAuth = async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Google credential is required' });

    try {
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) return res.status(400).json({ success: false, message: 'Could not retrieve email from Google account' });

        let user = await userModel.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                user.isVerified = true;
                if (picture && !user.image) user.image = picture;
                await user.save();
            }
        } else {
            user = new userModel({
                name,
                email,
                googleId,
                image: picture || undefined,
                role: 'user',
                isVerified: true,
            });
            await user.save();
            sendWelcomeMail(email, name).catch(console.error);
        }

        const token = createToken(user._id, user.role);
        const rToken = createRefreshToken(user._id, user.role);
        user.refreshToken = await bcrypt.hash(rToken, 10);
        await user.save();

        res.json({
            success: true,
            token,
            refreshToken: rToken,
            userId: user._id.toString(),
            name: user.name,
            role: user.role,
            message: `Welcome, ${user.name}!`
        });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(500).json({ success: false, message: 'Google authentication failed. Please try again.' });
    }
};

export {
    sendOtp, verifyOtp, registerUser, loginUser, refreshToken,
    sendAdminOtp, verifyAdminOtp, adminLogin, sendForgotPasswordOtp, resetPassword,
    getUserDetails, getUserProfile, updateUserProfile,
    addOrUpdateAddress, deleteAddress, changePassword, subscribeNewsletter,
    googleAuth, adminGoogleAuth
};
