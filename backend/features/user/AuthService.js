import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import validator from 'validator';
import userModel from './UserModel.js';
import sendOtpMail from '../../middlewares/sendOtpMail.js';
import sendWelcomeMail from '../../middlewares/sendWelcomeMail.js';
import logger from '../../config/logger.js';
import {
    generateOtp as generateRedisOtp, storeOtp,
    verifyOtp as verifyRedisOtp, checkOtpRequestLimit,
} from './OtpService.js';

// Constants
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const BCRYPT_SALT_ROUNDS = 10;
const ACCESS_TOKEN_TTL = '14d';
const REFRESH_TOKEN_TTL = '21d';
const MIN_PASSWORD_LEN = 8;

// Token helpers 
const createAccessToken = (id, role = 'user') =>
    jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

const createRefreshToken = (id, role = 'user') =>
    jwt.sign(
        { id, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_TTL }
    );

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);

// Registration
const initiateRegistration = async ({ email, name, password }) => {
    if (!validator.isEmail(email))
        throw Object.assign(new Error('Invalid email format'), { statusCode: 400 });
    if (password.length < MIN_PASSWORD_LEN)
        throw Object.assign(new Error(`Password must be at least ${MIN_PASSWORD_LEN} characters`), { statusCode: 400 });

    const existing = await userModel.findOne({ email });
    if (existing?.isVerified)
        throw Object.assign(new Error('User already exists. Please login instead.'), { statusCode: 400 });

    // Redis-backed OTP rate limiting per email
    const rateCheck = await checkOtpRequestLimit(email);
    if (!rateCheck.allowed)
        throw Object.assign(new Error(rateCheck.message), { statusCode: 429 });

    const otp = generateRedisOtp();
    const hashedPass = await hashPassword(password);

    if (existing) {
        existing.name = name; existing.password = hashedPass; existing.role = 'user';
        existing.isVerified = false;
        await existing.save();
    } else {
        await userModel.create({ email, name, password: hashedPass, role: 'user', isVerified: false });
    }

    // Store OTP in Redis (5 min TTL)
    await storeOtp(email, otp);
    await sendOtpMail(email, otp);
};

const confirmRegistration = async ({ email, otp }) => {
    const user = await userModel.findOne({ email });
    if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
    if (user.isVerified) throw Object.assign(new Error('Account already verified.'), { statusCode: 400 });
    if (user.role === 'admin')
        throw Object.assign(new Error('Please use admin verification portal'), { statusCode: 403 });

    // Verify OTP via Redis
    const otpResult = await verifyRedisOtp(email, otp);
    if (!otpResult.valid)
        throw Object.assign(new Error(otpResult.message), { statusCode: 401 });

    user.isVerified = true; user.role = 'user';
    await recordUserLogin(user);
    sendWelcomeMail(email, user.name).catch((e) => logger.error('Welcome email failed', e));

    const token = createAccessToken(user._id, 'user');
    return { token, userId: user._id.toString(), name: user.name, role: 'user' };
};

// Login
const loginWithPassword = async ({ email, password }) => {
    const user = await userModel.findOne({ email });
    if (!user)
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (!user.isVerified)
        throw Object.assign(new Error('Please verify your email first.'), { statusCode: 401 });
    if (user.isLocked) {
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
        throw Object.assign(new Error(`Account locked. Try again in ${minutesLeft} minutes.`), { statusCode: 423 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        await user.incrementLoginAttempts();
        const attemptsLeft = Math.max(0, 5 - (user.loginAttempts + 1));
        const msg = attemptsLeft > 0
            ? `Invalid credentials. ${attemptsLeft} attempts remaining.`
            : 'Account locked for 30 minutes due to too many failed attempts.';
        throw Object.assign(new Error(msg), { statusCode: 401 });
    }

    await user.resetLoginAttempts();

    const token = createAccessToken(user._id, user.role);
    const refreshToken = createRefreshToken(user._id, user.role);
    user.refreshToken = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
    await recordUserLogin(user);

    return { token, refreshToken, userId: user._id.toString(), name: user.name, role: user.role };
};

const rotateRefreshToken = async (incomingToken) => {
    const decoded = jwt.verify(
        incomingToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    const user = await userModel.findById(decoded.id).select('+refreshToken');
    if (!user?.refreshToken)
        throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });

    const isValid = await bcrypt.compare(incomingToken, user.refreshToken);
    if (!isValid)
        throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });

    const newAccessToken = createAccessToken(user._id, user.role);
    const newRefreshToken = createRefreshToken(user._id, user.role);
    user.refreshToken = await bcrypt.hash(newRefreshToken, BCRYPT_SALT_ROUNDS);
    await user.save();

    return { token: newAccessToken, refreshToken: newRefreshToken };
};

// Google OAuth
const verifyGoogleCredential = async (credential) => {
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
};

const loginWithGoogle = async (credential) => {
    const payload = await verifyGoogleCredential(credential);
    const { sub: googleId, email, name, picture } = payload;
    if (!email)
        throw Object.assign(new Error('Could not retrieve email from Google account'), { statusCode: 400 });

    let user = await userModel.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
        if (!user.googleId) {
            user.googleId = googleId;
            user.isVerified = true;
            if (picture && !user.image) user.image = picture;
            await user.save();
        }
    } else {
        user = await userModel.create({ name, email, googleId, image: picture, role: 'user', isVerified: true });
        sendWelcomeMail(email, name).catch((e) => logger.error('Welcome email failed', e));
    }

    const token = createAccessToken(user._id, user.role);
    const refreshToken = createRefreshToken(user._id, user.role);
    user.refreshToken = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
    await recordUserLogin(user);

    return { token, refreshToken, userId: user._id.toString(), name: user.name, role: user.role };
};

const loginAdminWithGoogle = async (credential) => {
    const payload = await verifyGoogleCredential(credential);
    const { sub: googleId, email } = payload;
    if (!email)
        throw Object.assign(new Error('Could not retrieve email from Google account'), { statusCode: 400 });

    const user = await userModel.findOne({ email, role: 'admin' });
    if (!user)
        throw Object.assign(new Error('No admin account found for this Google account.'), { statusCode: 403 });
    if (!user.isVerified)
        throw Object.assign(new Error('Admin account not yet verified.'), { statusCode: 401 });

    if (!user.googleId) { user.googleId = googleId; }
    await recordUserLogin(user);

    const token = createAccessToken(user._id, 'admin');
    return { token, userId: user._id.toString(), name: user.name, role: 'admin' };
};

// Admin auth 
const loginAdmin = async ({ email, password }) => {
    const user = await userModel.findOne({ email, role: 'admin' });
    if (!user)
        throw Object.assign(new Error('Admin account not found'), { statusCode: 404 });
    if (!user.isVerified)
        throw Object.assign(new Error('Please verify your email first.'), { statusCode: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

    await recordUserLogin(user);

    const token = createAccessToken(user._id, 'admin');
    return { token, userId: user._id.toString(), name: user.name, role: 'admin' };
};

const initiateAdminOtp = async (email) => {
    if (!validator.isEmail(email))
        throw Object.assign(new Error('Invalid email format'), { statusCode: 400 });

    const user = await userModel.findOne({ email, role: 'admin' });
    if (!user?.isVerified)
        throw Object.assign(new Error('This email is not authorised for admin access.'), { statusCode: 403 });

    // Redis-backed OTP rate limiting
    const rateCheck = await checkOtpRequestLimit(email);
    if (!rateCheck.allowed)
        throw Object.assign(new Error(rateCheck.message), { statusCode: 429 });

    const otp = generateRedisOtp();
    await storeOtp(email, otp);
    await sendOtpMail(email, otp);
};

const confirmAdminOtp = async ({ email, otp }) => {
    const user = await userModel.findOne({ email });
    if (!user) throw Object.assign(new Error('Admin not found.'), { statusCode: 404 });
    if (user.role !== 'admin') throw Object.assign(new Error('Not an admin account.'), { statusCode: 403 });

    // Verify OTP via Redis
    const otpResult = await verifyRedisOtp(email, otp);
    if (!otpResult.valid)
        throw Object.assign(new Error(otpResult.message), { statusCode: 401 });

    user.isVerified = true;
    await recordUserLogin(user);

    const token = createAccessToken(user._id, 'admin');
    return { token, userId: user._id.toString(), name: user.name, role: 'admin' };
};

// Password reset
const initiateForgotPassword = async ({ email, newPassword }) => {
    if (!validator.isEmail(email))
        throw Object.assign(new Error('Invalid email format'), { statusCode: 400 });
    if (newPassword.length < MIN_PASSWORD_LEN)
        throw Object.assign(new Error(`Password must be at least ${MIN_PASSWORD_LEN} characters`), { statusCode: 400 });

    const user = await userModel.findOne({ email });
    if (!user)
        throw Object.assign(new Error('No account found with this email'), { statusCode: 404 });
    if (!user.isVerified)
        throw Object.assign(new Error('Please complete your registration first.'), { statusCode: 400 });

    // Redis-backed OTP rate limiting
    const rateCheck = await checkOtpRequestLimit(email);
    if (!rateCheck.allowed)
        throw Object.assign(new Error(rateCheck.message), { statusCode: 429 });

    const otp = generateRedisOtp();
    const hashedPass = await hashPassword(newPassword);

    user.tempPassword = hashedPass;
    await user.save();

    // Store OTP in Redis
    await storeOtp(email, otp);
    await sendOtpMail(email, otp);
};

const confirmPasswordReset = async ({ email, otp }) => {
    const user = await userModel.findOne({ email }).select('+tempPassword');
    if (!user)
        throw Object.assign(new Error('User not found.'), { statusCode: 404 });
    if (!user.isVerified)
        throw Object.assign(new Error('Please complete your registration first.'), { statusCode: 400 });
    if (!user.tempPassword)
        throw Object.assign(new Error('No password reset in progress.'), { statusCode: 400 });

    // Verify OTP via Redis
    const otpResult = await verifyRedisOtp(email, otp);
    if (!otpResult.valid)
        throw Object.assign(new Error(otpResult.message), { statusCode: 401 });

    user.password = user.tempPassword; user.tempPassword = undefined;
    await user.save();
};

// Shared OTP validator 
const validateOtpOrThrow = (user, otp) => {
    if (!user.otp || !user.otpExpiry)
        throw Object.assign(new Error('OTP not requested.'), { statusCode: 400 });
    if (user.otp !== otp)
        throw Object.assign(new Error('Invalid OTP'), { statusCode: 401 });
    if (user.otpExpiry < new Date())
        throw Object.assign(new Error('OTP expired.'), { statusCode: 401 });
};

// Helper to record login history
const recordUserLogin = async (user) => {
    const now = new Date();
    user.lastLogin = now;
    if (!user.loginHistory) user.loginHistory = [];
    user.loginHistory.push(now);
    
    // Trim login history older than 90 days to keep the document bounded
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    user.loginHistory = user.loginHistory.filter(date => date >= ninetyDaysAgo);
    
    if (typeof user.save === 'function') {
        await user.save();
    }
};

export {
    createAccessToken, createRefreshToken, initiateRegistration, confirmRegistration, hashPassword, loginWithPassword,
    rotateRefreshToken, loginWithGoogle, loginAdminWithGoogle, loginAdmin, initiateAdminOtp, confirmAdminOtp,
    initiateForgotPassword, confirmPasswordReset,
};
