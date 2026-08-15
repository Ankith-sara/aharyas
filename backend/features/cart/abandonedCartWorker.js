import { runAbandonedCartWorkerBatch } from './AbandonedCartService.js';
import logger from '../../config/logger.js';

let _workerInterval = null;
const CHECK_INTERVAL_MS = parseInt(process.env.ABANDONED_CART_CHECK_INTERVAL_MS, 10) || 15 * 60 * 1000; // Default 15 mins

export const startAbandonedCartWorker = () => {
    if (_workerInterval) {
        logger.warn('[AbandonedCartWorker] Worker is already running.');
        return;
    }

    logger.info(`[AbandonedCartWorker] Starting background worker (check interval: ${CHECK_INTERVAL_MS / 1000}s)`);

    const executeJob = async () => {
        try {
            const results = await runAbandonedCartWorkerBatch();
            if (results.total > 0) {
                logger.info(`[AbandonedCartWorker] Processed ${results.total} abandoned cart emails (Stage 1: ${results.count1}, Stage 2: ${results.count2}, Stage 3: ${results.count3})`);
            }
        } catch (err) {
            logger.error('[AbandonedCartWorker] Error executing worker batch', err);
        }
    };

    // Run first batch after initial bootup delay (30 seconds)
    setTimeout(() => {
        executeJob();
        _workerInterval = setInterval(executeJob, CHECK_INTERVAL_MS);
    }, 30000);
};

export const stopAbandonedCartWorker = () => {
    if (_workerInterval) {
        clearInterval(_workerInterval);
        _workerInterval = null;
        logger.info('[AbandonedCartWorker] Worker stopped.');
    }
};
