import userModel from './UserModel.js';
import logger from '../../config/logger.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000;

const checkAccountLock = (user) => {
    if (user.lockUntil && user.lockUntil > Date.now()) {
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return { locked: true, minutesLeft };
    }
    return { locked: false };
};

const handleFailedLogin = async (user) => {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        logger.warn(`Account locked for user ${user.email} after ${MAX_LOGIN_ATTEMPTS} failed attempts`);
    }
    await user.save();
};

const resetLoginAttempts = async (user) => {
    if (user.loginAttempts > 0 || user.lockUntil) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
    }
};

const getUserAnalyticsData = async () => {
    const totalUsers = await userModel.countDocuments({ role: 'user' });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLogins = await userModel.countDocuments({ 
        role: 'user', 
        lastLogin: { $gte: todayStart } 
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyLogins = await userModel.aggregate([
        { $unwind: "$loginHistory" },
        { $match: { loginHistory: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: {
                    year: { $year: "$loginHistory" },
                    month: { $month: "$loginHistory" },
                    day: { $dayOfMonth: "$loginHistory" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    return {
        totalUsers,
        todayLogins,
        dailyLogins
    };
};

export { checkAccountLock, handleFailedLogin, resetLoginAttempts, getUserAnalyticsData };
