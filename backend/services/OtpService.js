import redis from '../config/redis.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

// Constants
const OTP_EXPIRY_SECONDS = 300;          // 5 minutes
const MAX_OTP_REQUESTS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const OTP_REQUEST_WINDOW = 3600;         // 1 hour in seconds

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
export const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

/**
 * Store OTP in Redis with expiry.
 *
 * Key:   otp:{email}
 * Value: JSON { otp, createdAt }
 * TTL:   300 seconds
 */
export const storeOtp = async (email, otp) => {
    const key = `otp:${email}`;
    const data = JSON.stringify({ otp, createdAt: Date.now() });

    await redis.set(key, data, { ex: OTP_EXPIRY_SECONDS });
    logger.info(`[OTP] Stored OTP for ${email} (expires in ${OTP_EXPIRY_SECONDS}s)`);
};

/**
 * Verify a submitted OTP against the Redis-stored value.
 *
 * - Compares submitted OTP with stored OTP
 * - Deletes OTP after successful verification (prevents reuse)
 * - Tracks verification attempts to prevent brute-force
 *
 * @returns {{ valid: boolean, message: string }}
 */
export const verifyOtp = async (email, submittedOtp) => {
    const key = `otp:${email}`;
    const attemptsKey = `otp_attempts:${email}`;

    // Check verification attempts
    const attempts = (await redis.get(attemptsKey)) || 0;
    if (Number(attempts) >= MAX_VERIFY_ATTEMPTS) {
        // Delete OTP to force re-request
        await redis.del(key);
        await redis.del(attemptsKey);
        logger.warn(`[OTP] Max verification attempts exceeded for ${email}`);
        return { valid: false, message: 'Too many verification attempts. Please request a new OTP.' };
    }

    // Fetch stored OTP
    const stored = await redis.get(key);
    if (!stored) {
        logger.info(`[OTP] No OTP found for ${email} (expired or not requested)`);
        return { valid: false, message: 'OTP expired. Please request a new one.' };
    }

    const { otp: storedOtp } = typeof stored === 'string' ? JSON.parse(stored) : stored;

    if (storedOtp !== submittedOtp) {
        // Increment attempt counter (expires with OTP window)
        await redis.incr(attemptsKey);
        await redis.expire(attemptsKey, OTP_EXPIRY_SECONDS);
        const remaining = MAX_VERIFY_ATTEMPTS - Number(attempts) - 1;
        logger.info(`[OTP] Invalid OTP for ${email} (${remaining} attempts left)`);
        return { valid: false, message: `Invalid OTP. ${remaining} attempts remaining.` };
    }

    // OTP is valid – delete from Redis to prevent reuse
    await redis.del(key);
    await redis.del(attemptsKey);
    logger.info(`[OTP] OTP verified successfully for ${email}`);
    return { valid: true, message: 'OTP verified.' };
};

/**
 * Check OTP request rate limit.
 *
 * Key:   otp_req:{email}
 * Limit: 5 requests per hour
 */
export const checkOtpRequestLimit = async (email) => {
    const key = `otp_req:${email}`;
    const count = await redis.incr(key);

    if (count === 1) {
        await redis.expire(key, OTP_REQUEST_WINDOW);
    }

    if (count > MAX_OTP_REQUESTS_PER_HOUR) {
        const ttl = await redis.ttl(key);
        logger.warn(`[OTP] Rate limit hit for ${email} (${count}/${MAX_OTP_REQUESTS_PER_HOUR})`);
        return {
            allowed: false,
            message: `Too many OTP requests. Try again in ${Math.ceil(ttl / 60)} minutes.`,
        };
    }

    logger.info(`[OTP] OTP request ${count}/${MAX_OTP_REQUESTS_PER_HOUR} for ${email}`);
    return { allowed: true };
};
