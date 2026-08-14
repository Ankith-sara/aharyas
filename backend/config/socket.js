import logger from '../config/logger.js';
import {
    trackUserConnected, trackUserDisconnected, trackProductViewed, trackCartAdded, trackCheckoutStarted,
    trackOrderPlaced, trackSearchPerformed, getDashboardCounters,
} from '../services/AnalyticsService.js';

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

    adminNs.on('connection', async (socket) => {
        logger.info(`[Socket] Admin connected: ${socket.id}`);

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
            const productName = data?.productName || 'Unknown Product';
            const count = await trackProductViewed(productName);
            adminNs.emit('product:viewed', { productName, todayProductViews: count });
        });

        // Track cart additions
        socket.on('cart:add', async (data) => {
            const productName = data?.productName || 'Unknown Product';
            const count = await trackCartAdded(productName);
            adminNs.emit('cart:added', { productName, todayCartAdds: count });
        });

        // Track checkout start
        socket.on('checkout:start', async () => {
            const count = await trackCheckoutStarted();
            adminNs.emit('checkout:started', { todayCheckouts: count });
        });

        // Track order placed
        socket.on('order:place', async (data) => {
            const orderId = data?.orderId || 'Unknown';
            const count = await trackOrderPlaced(orderId);
            adminNs.emit('order:placed', { orderId, todayOrders: count });
        });

        // Track search
        socket.on('search:perform', async (data) => {
            const query = data?.query || '';
            const count = await trackSearchPerformed(query);
            adminNs.emit('search:performed', { query, todaySearches: count });
        });

        // Existing order tracking
        socket.on('track-order', (orderId) => {
            socket.join(`order_${orderId}`);
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