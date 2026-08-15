import redis from '../config/redis.js';
import logger from '../config/logger.js';

// Helpers
const envInt = (key, fallback) => {
    const v = process.env[key];
    return v !== undefined ? parseInt(v, 10) : fallback;
};

const BASE_BLOCK_SEC = envInt('RATE_LIMIT_BASE_BLOCK_SEC', 60);
const MAX_BLOCK_SEC = envInt('RATE_LIMIT_MAX_BLOCK_SEC', 1800);

// Bounded in-memory fallback store for rate limiting when Redis is unavailable
const memoryFallbackStore = new Map();
const MAX_FALLBACK_ENTRIES = 5000;

const cleanupMemoryStore = () => {
    const now = Date.now();
    for (const [k, v] of memoryFallbackStore.entries()) {
        if (v.resetAt <= now && (!v.blockedUntil || v.blockedUntil <= now)) {
            memoryFallbackStore.delete(k);
        }
    }
    if (memoryFallbackStore.size > MAX_FALLBACK_ENTRIES) {
        const keysToDelete = Array.from(memoryFallbackStore.keys()).slice(0, 1000);
        for (const k of keysToDelete) memoryFallbackStore.delete(k);
    }
};

setInterval(cleanupMemoryStore, 60000).unref();

const checkInMemoryFallback = ({ key, limit, windowSeconds, res }) => {
    const now = Date.now();
    let entry = memoryFallbackStore.get(key);
    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowSeconds * 1000, blockedUntil: 0 };
    }
    if (entry.blockedUntil && entry.blockedUntil > now) {
        const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return false;
    }
    entry.count += 1;
    if (entry.count > limit) {
        entry.blockedUntil = now + windowSeconds * 1000;
        memoryFallbackStore.set(key, entry);
        const retryAfter = windowSeconds;
        res.setHeader('Retry-After', retryAfter);
        return false;
    }
    memoryFallbackStore.set(key, entry);
    return true;
};

// Core factory 
/**
 * Creates a Redis-backed rate-limiter middleware with bounded in-memory fallback.
 *
 * @param {Object}  opts
 * @param {string}  opts.name         – Unique key prefix (e.g. 'login')
 * @param {number}  opts.limit         – Max requests allowed in the window
 * @param {number}  opts.windowSeconds  – Sliding-window size in seconds
 * @param {boolean} [opts.trackAccount=false] – Also limit per-account (email)
 *         with exponential back-off on repeated blocks
 */
const createRateLimiter = ({ name, limit, windowSeconds, trackAccount = false }) => {
    return async (req, res, next) => {
        // Allow an escape hatch for local dev / CI
        if (process.env.DISABLE_RATE_LIMITS === 'true') return next();

        const ip =
            req.ip ||
            req.headers['x-forwarded-for'] ||
            req.connection?.remoteAddress ||
            'unknown';

        const email =
            trackAccount && req.body?.email
                ? String(req.body.email).trim().toLowerCase()
                : null;

        // Keys to enforce – always per-IP, optionally per-account
        const keys = [`rl:${name}:ip:${ip}`];
        if (email) keys.push(`rl:${name}:acct:${email}`);

        try {
            for (const key of keys) {
                const blockedKey = `${key}:blk`;

                // 1. Already blocked?
                const blocked = await redis.get(blockedKey);
                if (blocked) {
                    const ttl = await redis.ttl(blockedKey);
                    const retryAfter = ttl > 0 ? ttl : BASE_BLOCK_SEC;
                    res.setHeader('Retry-After', retryAfter);
                    logger.warn(`[RateLimit] Blocked ${key} | retry in ${retryAfter}s`);
                    return res.status(429).json({
                        success: false,
                        message: 'Too many requests. Please try again later.',
                    });
                }

                // 2. Increment counter
                const countKey = `${key}:cnt`;
                const count = await redis.incr(countKey);
                if (count === 1) await redis.expire(countKey, windowSeconds);

                const ttl = await redis.ttl(countKey);

                // 3. Standard rate-limit headers (from the first key only)
                if (key === keys[0]) {
                    res.setHeader('X-RateLimit-Limit', limit);
                    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
                    res.setHeader(
                        'X-RateLimit-Reset',
                        Math.ceil(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds),
                    );
                }

                // 4. Over the limit → block
                if (count > limit) {
                    let blockDuration = windowSeconds;

                    if (trackAccount) {
                        // Exponential back-off: 60s → 120s → 240s → … capped
                        const bCountKey = `${key}:bcnt`;
                        const bCount = await redis.incr(bCountKey);
                        if (bCount === 1) await redis.expire(bCountKey, 86400); // 24 h

                        blockDuration = Math.min(
                            BASE_BLOCK_SEC * Math.pow(2, bCount - 1),
                            MAX_BLOCK_SEC,
                        );
                        logger.warn(
                            `[RateLimit] Auth block ${key} | strike ${bCount} | ${blockDuration}s`,
                        );
                    } else {
                        logger.warn(`[RateLimit] Block ${key} | ${blockDuration}s`);
                    }

                    await redis.set(blockedKey, '1', { ex: blockDuration });
                    res.setHeader('Retry-After', blockDuration);
                    return res.status(429).json({
                        success: false,
                        message: 'Too many requests. Please try again later.',
                    });
                }
            }

            next();
        } catch (err) {
            logger.error('[RateLimit] Redis error – falling back to bounded in-memory limiter', err);
            const fallbackKey = keys[0];
            const allowed = checkInMemoryFallback({ key: fallbackKey, limit, windowSeconds, res });
            if (!allowed) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                });
            }
            next();
        }
    };
};

// ── Pre-configured limiters ──────────────────────────────────────────────────

// Auth routes – strict, per-IP + per-account, exponential back-off
export const loginLimiter = createRateLimiter({
    name: 'login',
    limit: envInt('RATE_LIMIT_LOGIN_MAX', 10),
    windowSeconds: envInt('RATE_LIMIT_LOGIN_WINDOW_SEC', 900),
    trackAccount: true,
});

export const registerLimiter = createRateLimiter({
    name: 'register',
    limit: envInt('RATE_LIMIT_REGISTER_MAX', 5),
    windowSeconds: envInt('RATE_LIMIT_REGISTER_WINDOW_SEC', 3600),
    trackAccount: true,
});

export const otpLimiter = createRateLimiter({
    name: 'otp',
    limit: envInt('RATE_LIMIT_OTP_MAX', 5),
    windowSeconds: envInt('RATE_LIMIT_OTP_WINDOW_SEC', 3600),
    trackAccount: true,
});

export const forgotPasswordLimiter = createRateLimiter({
    name: 'forgot',
    limit: envInt('RATE_LIMIT_FORGOT_MAX', 5),
    windowSeconds: envInt('RATE_LIMIT_FORGOT_WINDOW_SEC', 3600),
    trackAccount: true,
});

// Public endpoints – moderate
export const publicLimiter = createRateLimiter({
    name: 'public',
    limit: envInt('RATE_LIMIT_PUBLIC_MAX', 60),
    windowSeconds: envInt('RATE_LIMIT_PUBLIC_WINDOW_SEC', 60),
});

// Authenticated user actions – loose
export const authenticatedLimiter = createRateLimiter({
    name: 'user',
    limit: envInt('RATE_LIMIT_USER_MAX', 200),
    windowSeconds: envInt('RATE_LIMIT_USER_WINDOW_SEC', 60),
});

export default createRateLimiter;