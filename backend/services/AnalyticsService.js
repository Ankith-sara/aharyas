import redis from '../config/redis.js';
import logger from '../config/logger.js';

// Redis keys for live counters
const COUNTER_KEYS = {
    ONLINE_USERS: 'analytics:onlineUsers',
    TODAY_PRODUCT_VIEWS: 'analytics:todayProductViews',
    TODAY_CART_ADDS: 'analytics:todayCartAdds',
    TODAY_CHECKOUTS: 'analytics:todayCheckouts',
    TODAY_ORDERS: 'analytics:todayOrders',
    TODAY_SEARCHES: 'analytics:todaySearches',
};

// Midnight reset TTL helper – seconds remaining until midnight UTC
const secondsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    return Math.ceil((midnight - now) / 1000);
};

const incrementDailyCounter = async (key) => {
    try {
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, secondsUntilMidnight());
        }
        return count;
    } catch (err) {
        logger.error(`[Analytics] Failed to increment ${key}`, err);
        return 0;
    }
};



const getDashboardCounters = async () => {
    try {
        const [onlineUsers, todayProductViews, todayCartAdds, todayCheckouts, todayOrders, todaySearches] =
            await Promise.all([
                redis.get(COUNTER_KEYS.ONLINE_USERS),
                redis.get(COUNTER_KEYS.TODAY_PRODUCT_VIEWS),
                redis.get(COUNTER_KEYS.TODAY_CART_ADDS),
                redis.get(COUNTER_KEYS.TODAY_CHECKOUTS),
                redis.get(COUNTER_KEYS.TODAY_ORDERS),
                redis.get(COUNTER_KEYS.TODAY_SEARCHES),
            ]);

        return {
            onlineUsers: Number(onlineUsers) || 0,
            todayProductViews: Number(todayProductViews) || 0,
            todayCartAdds: Number(todayCartAdds) || 0,
            todayCheckouts: Number(todayCheckouts) || 0,
            todayOrders: Number(todayOrders) || 0,
            todaySearches: Number(todaySearches) || 0,
        };
    } catch (err) {
        logger.error('[Analytics] Failed to fetch dashboard counters', err);
        return {
            onlineUsers: 0, todayProductViews: 0, todayCartAdds: 0,
            todayCheckouts: 0, todayOrders: 0, todaySearches: 0,
        };
    }
};

// Event Tracking Functions
const trackUserConnected = async () => {
    try {
        const count = await redis.incr(COUNTER_KEYS.ONLINE_USERS);
        return count;
    } catch (err) {
        logger.error('[Analytics] trackUserConnected failed', err);
        return 0;
    }
};

const trackUserDisconnected = async () => {
    try {
        const count = await redis.decr(COUNTER_KEYS.ONLINE_USERS);
        if (count < 0) await redis.set(COUNTER_KEYS.ONLINE_USERS, 0);
        return Math.max(0, count);
    } catch (err) {
        logger.error('[Analytics] trackUserDisconnected failed', err);
        return 0;
    }
};

const trackProductViewed = async (productName) => {
    const count = await incrementDailyCounter(COUNTER_KEYS.TODAY_PRODUCT_VIEWS);
    return count;
};

const trackCartAdded = async (productName) => {
    const count = await incrementDailyCounter(COUNTER_KEYS.TODAY_CART_ADDS);
    return count;
};

const trackCheckoutStarted = async () => {
    const count = await incrementDailyCounter(COUNTER_KEYS.TODAY_CHECKOUTS);
    return count;
};

const trackOrderPlaced = async (orderId) => {
    const count = await incrementDailyCounter(COUNTER_KEYS.TODAY_ORDERS);
    return count;
};

const trackSearchPerformed = async (query) => {
    const count = await incrementDailyCounter(COUNTER_KEYS.TODAY_SEARCHES);
    return count;
};

export {
    COUNTER_KEYS, getDashboardCounters, trackUserConnected, 
    trackUserDisconnected, trackProductViewed, trackCartAdded, trackCheckoutStarted, 
    trackOrderPlaced, trackSearchPerformed,
};