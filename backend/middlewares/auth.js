import jwt from 'jsonwebtoken';
import userModel from '../features/user/UserModel.js';

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. Malformed token.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id).select('-password -refreshToken -otp -otpExpiry -tempPassword');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }
        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: 'Account not verified.' });
        }

        req.user = user;
        req.body.userId = user._id.toString();

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please refresh your session.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }
        console.error('Auth middleware error:', error);
        res.status(401).json({ success: false, message: 'Authentication failed.' });
    }
};

export default auth;
