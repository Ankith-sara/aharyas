import logger from '../../config/logger.js';

/**
 * Centralised error handler.
 *
 * - Client / operational errors (status < 500) → return the specific message.
 * - Internal / unexpected errors (status 500)  → return a generic message
 *   so stack traces, DB details, and file paths never leak to the caller.
 *   The full error is still logged server-side for debugging.
 */
const handleError = (res, error, context) => {
    const statusCode = error.statusCode || 500;

    // Always log the complete error server-side
    logger.error(`${context}: ${error.stack || error.message || error}`);

    if (statusCode < 500) {
        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }

    // 500+ → generic response to the client
    res.status(500).json({
        success: false,
        message: 'An internal server error occurred. Please try again later.',
    });
};

export { handleError };
