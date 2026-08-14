/**
 * Unit tests — cookies.js middleware
 */
import { jest } from '@jest/globals';

// ── Inline the cookie parser (no server boot) ─────────────────────────────
const parseCookies = (req, _res, next) => {
    req.cookies = {};
    const header = req.headers.cookie;
    if (!header) return next();
    header.split(';').forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx < 0) return;
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1');
        try { req.cookies[key] = decodeURIComponent(val); }
        catch { req.cookies[key] = val; }
    });
    next();
};

const run = (cookieHeader) => {
    const req = { headers: { cookie: cookieHeader }, cookies: {} };
    const next = jest.fn();
    parseCookies(req, {}, next);
    return { req, next };
};

describe('parseCookies', () => {
    test('sets req.cookies to empty object when no Cookie header', () => {
        const { req, next } = run(undefined);
        expect(req.cookies).toEqual({});
        expect(next).toHaveBeenCalled();
    });

    test('parses a single cookie', () => {
        const { req } = run('token=abc123');
        expect(req.cookies.token).toBe('abc123');
    });

    test('parses multiple cookies', () => {
        const { req } = run('a=1; b=2; c=3');
        expect(req.cookies).toEqual({ a: '1', b: '2', c: '3' });
    });

    test('decodes URI-encoded cookie values', () => {
        const { req } = run('name=John%20Doe');
        expect(req.cookies.name).toBe('John Doe');
    });

    test('strips surrounding double-quotes from cookie values', () => {
        const { req } = run('session="abc-def-ghi"');
        expect(req.cookies.session).toBe('abc-def-ghi');
    });

    test('handles cookies with = in the value', () => {
        const { req } = run('jwt=a.b.c==');
        expect(req.cookies.jwt).toBe('a.b.c==');
    });

    test('calls next() in all cases', () => {
        const { next: n1 } = run(undefined);
        const { next: n2 } = run('x=1');
        expect(n1).toHaveBeenCalled();
        expect(n2).toHaveBeenCalled();
    });
});
