const IS_PROD = process.env.NODE_ENV === 'production';

const parseCookies = (req, _res, next) => {
    req.cookies = {};
    const header = req.headers.cookie;
    if (!header) return next();

    header.split(';').forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx < 0) return;
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1');
        try {
            req.cookies[key] = decodeURIComponent(val);
        } catch {
            req.cookies[key] = val;
        }
    });

    next();
};

export default parseCookies;

// Refresh-token cookie helpers
const COOKIE_NAME = 'aharyas_rt';
const MAX_AGE_DAYS = 30;
const MAX_AGE_SECS = MAX_AGE_DAYS * 24 * 60 * 60;

/**
 * Sets an httpOnly, Secure (prod), SameSite=Strict refresh-token cookie.
 * @param {import('express').Response} res
 * @param {string} token
 */
export const setRefreshCookie = (res, token) => {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'strict' : 'lax',
        maxAge: MAX_AGE_SECS * 1000, // express takes ms
        path: '/api/v1/user',      // scope to auth routes only
    });
};

/**
 * Clears the refresh-token cookie (logout).
 * @param {import('express').Response} res
 */
export const clearRefreshCookie = (res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'strict' : 'lax',
        path: '/api/v1/user',
    });
};

/**
 * Reads the refresh token from the cookie (used in the refresh-token controller).
 * @param {import('express').Request} req
 * @returns {string | undefined}
 */
export const getRefreshCookie = (req) => req.cookies?.[COOKIE_NAME];