import { jest } from '@jest/globals';

// ── Inline cache logic (mirrors SitemapRoute.js) ─────────────────────────────
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let _cache = null;
const isStale = () => !_cache || Date.now() - _cache.builtAt > CACHE_TTL_MS;
const setCache = (xml) => { _cache = { xml, builtAt: Date.now() }; };
const clearCache = () => { _cache = null; };

describe('Sitemap cache', () => {
    beforeEach(() => clearCache());

    test('isStale returns true when cache is null', () => {
        expect(isStale()).toBe(true);
    });

    test('isStale returns false immediately after setCache', () => {
        setCache('<xml/>');
        expect(isStale()).toBe(false);
    });

    test('isStale returns true after TTL has elapsed', () => {
        setCache('<xml/>');
        // Simulate time passing past TTL
        _cache.builtAt = Date.now() - CACHE_TTL_MS - 1;
        expect(isStale()).toBe(true);
    });

    test('setCache stores xml and builtAt', () => {
        setCache('<urlset/>');
        expect(_cache.xml).toBe('<urlset/>');
        expect(typeof _cache.builtAt).toBe('number');
    });

    test('clearCache resets to null', () => {
        setCache('<xml/>');
        clearCache();
        expect(_cache).toBeNull();
    });

    test('TTL is 6 hours', () => {
        expect(CACHE_TTL_MS).toBe(6 * 60 * 60 * 1000);
    });
});
