import { Redis } from "@upstash/redis";
import logger from './logger.js';

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  (async () => {
    try {
      await redis.ping();
      logger.info('Redis connected successfully');
    } catch (err) {
      logger.error('Redis connection failed', err);
    }
  })();
} else {
  logger.warn('Redis credentials missing, skipping Redis cache initialization');
}

export default redis;