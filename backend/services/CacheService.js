import redis from '../config/redis.js';
import logger from '../config/logger.js';

// Cache TTLs in seconds
const CACHE_TTL = {
    PRODUCT: 3600,       
    PRODUCTS_ALL: 3600, 
    CATEGORY: 1800,      
    HOMEPAGE: 900,       
    COMPANIES: 1800,     
};

// Cache key prefixes
const KEYS = {
    PRODUCT_BY_ID: (id) => `cache:product:${id}`,
    PRODUCT_BY_SLUG: (slug) => `cache:product:slug:${slug}`,
    PRODUCTS_ALL: 'cache:products:all',
    PRODUCTS_BY_CATEGORY: (cat) => `cache:products:category:${cat}`,
    PRODUCTS_BY_COMPANY: (company) => `cache:products:company:${company}`,
    HOMEPAGE_FEATURED: 'cache:homepage:featured',
    COMPANIES: 'cache:companies',
    MOST_CLICKED: (limit) => `cache:products:most_clicked:${limit}`,
};

const cacheGet = async (key, fetcher, ttl) => {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
            const cached = await redis.get(key);
            if (cached !== null && cached !== undefined) {
                logger.info(`[Cache] HIT  → ${key}`);
                return typeof cached === 'string' ? JSON.parse(cached) : cached;
            }
        } catch (err) {
            logger.error(`[Cache] Redis GET error for ${key}`, err);
        }
    }

    logger.info(`[Cache] MISS → ${key}`);

    const freshData = await fetcher();

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
            await redis.set(key, JSON.stringify(freshData), { ex: ttl });
        } catch (err) {
            logger.error(`[Cache] Redis SET error for ${key}`, err);
        }
    }

    return freshData;
};

const invalidateKey = async (key) => {
    try {
        await redis.del(key);
        logger.info(`[Cache] Invalidated → ${key}`);
    } catch (err) {
        logger.error(`[Cache] Invalidation error for ${key}`, err);
    }
};

const invalidateProductCaches = async (productId, slug) => {
    const keysToDelete = [
        KEYS.PRODUCTS_ALL,
        KEYS.HOMEPAGE_FEATURED,
        KEYS.COMPANIES,
    ];

    if (productId) keysToDelete.push(KEYS.PRODUCT_BY_ID(productId));
    if (slug) keysToDelete.push(KEYS.PRODUCT_BY_SLUG(slug));

    [5, 10, 20].forEach(l => keysToDelete.push(KEYS.MOST_CLICKED(l)));

    await Promise.allSettled(keysToDelete.map(invalidateKey));
    logger.info(`[Cache] Invalidated ${keysToDelete.length} product-related keys`);
};

const invalidateCategoryCache = async (category) => {
    if (category) {
        await invalidateKey(KEYS.PRODUCTS_BY_CATEGORY(category));
    }
};

const invalidateCompanyCache = async (company) => {
    if (company) {
        await invalidateKey(KEYS.PRODUCTS_BY_COMPANY(company));
    }
};

const invalidateOnProductChange = async (product) => {
    if (!product) return;

    await Promise.allSettled([
        invalidateProductCaches(product._id, product.slug),
        invalidateCategoryCache(product.category),
        invalidateCompanyCache(product.company),
    ]);
};

export {
    CACHE_TTL, KEYS, cacheGet, invalidateKey, invalidateProductCaches, 
    invalidateCategoryCache, invalidateCompanyCache, invalidateOnProductChange,
};