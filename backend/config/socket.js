import jwt from 'jsonwebtoken';
import userModel from '../features/user/UserModel.js';
import logger from '../config/logger.js';
import {
    trackUserConnected, trackUserDisconnected, trackProductViewed, 
    trackCartAdded, trackSearchPerformed, getDashboardCounters,
} from '../features/analytics/AnalyticsService.js';

// Module-level reference so server-side code can emit without circular imports
let _adminNs = null;

/**
 * Get the admin analytics namespace for server-side event emission.
 * Returns null if Socket.IO hasn't been initialized yet.
 */
export const getAdminNamespace = () => _adminNs;

/**
 * Emit a server-side analytics event to all connected admin clients.
 * Safe to call before Socket.IO is initialized (silently no-ops).
 */
export const emitToAdmins = (event, data) => {
    if (_adminNs) {
        _adminNs.emit(event, data);
    }
};

/**
 * Initialize Socket.IO analytics namespace.
 *
 * Events emitted to admin clients:
 *   - user:connected       { onlineUsers }
 *   - user:disconnected    { onlineUsers }
 *   - product:viewed       { productName, todayProductViews }
 *   - cart:added           { productName, todayCartAdds }
 *   - checkout:started     { todayCheckouts }
 *   - order:placed         { orderId, todayOrders }
 *   - search:performed     { query, todaySearches }
 *   - dashboard:counters   { all counters }
 *
 * @param {import('socket.io').Server} io
 */
const initAnalyticsSocket = (io) => {
    // Admin namespace for analytics dashboard
    const adminNs = io.of('/admin-analytics');
    _adminNs = adminNs;

    // Authenticate admin socket connection
    adminNs.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                (socket.handshake.headers?.authorization?.startsWith('Bearer ')
                    ? socket.handshake.headers.authorization.split(' ')[1]
                    : socket.handshake.headers?.authorization);

            if (!token) {
                return next(new Error('Authentication required for admin analytics'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id).select('role');
            if (!user || user.role !== 'admin') {
                return next(new Error('Access denied. Admin authorization required.'));
            }

            socket.user = user;
            next();
        } catch (err) {
            logger.warn(`[Socket Auth] Admin connection rejected: ${err.message}`);
            return next(new Error('Unauthorized socket connection'));
        }
    });

    adminNs.on('connection', async (socket) => {
        logger.info(`[Socket] Admin connected: ${socket.id} (user: ${socket.user?._id})`);

        // Send initial dashboard state
        try {
            const counters = await getDashboardCounters();
            socket.emit('dashboard:counters', counters);
        } catch (err) {
            logger.error('[Socket] Failed to send initial state', err);
        }

        socket.on('disconnect', () => {
            logger.info(`[Socket] Admin disconnected: ${socket.id}`);
        });
    });

    // User tracking
    io.on('connection', async (socket) => {
        const onlineCount = await trackUserConnected();
        adminNs.emit('user:connected', { onlineUsers: onlineCount });
        logger.info(`[Socket] User connected: ${socket.id} (online: ${onlineCount})`);

        // Track product views 
        socket.on('product:view', async (data) => {
            const rawName = typeof data?.productName === 'string' ? data.productName : '';
            const productName = rawName.trim().slice(0, 100) || 'Unknown Product';
            const count = await trackProductViewed(productName);
            adminNs.emit('product:viewed', { productName, todayProductViews: count });
        });

        // Track cart additions
        socket.on('cart:add', async (data) => {
            const rawName = typeof data?.productName === 'string' ? data.productName : '';
            const productName = rawName.trim().slice(0, 100) || 'Unknown Product';
            const count = await trackCartAdded(productName);
            adminNs.emit('cart:added', { productName, todayCartAdds: count });
        });

        // Track search 
        socket.on('search:perform', async (data) => {
            const rawQuery = typeof data?.query === 'string' ? data.query : '';
            const query = rawQuery.trim().slice(0, 100);
            if (query) {
                const count = await trackSearchPerformed(query);
                adminNs.emit('search:performed', { query, todaySearches: count });
            }
        });

        // Existing order tracking room join
        socket.on('track-order', (orderId) => {
            if (typeof orderId === 'string' && /^[0-9a-fA-F]{24}$/.test(orderId)) {
                socket.join(`order_${orderId}`);
            }
        });

        // Disconnect
        socket.on('disconnect', async () => {
            const remaining = await trackUserDisconnected();
            adminNs.emit('user:disconnected', { onlineUsers: remaining });
            logger.info(`[Socket] User disconnected: ${socket.id} (online: ${remaining})`);
        });
    });

    logger.info('[Socket] Analytics socket initialised');
};

export { initAnalyticsSocket };