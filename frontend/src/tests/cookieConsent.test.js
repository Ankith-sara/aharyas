

// ── CookieConsent logic (pure functions extracted for unit testing) ──────────

const STORAGE_KEY = 'aharyas_cookie_consent';

// Minimal localStorage stub
const store = {};
global.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

// -- Helpers mirroring CookieConsent.jsx logic --------------------------------

const loadConsent = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (err) {
        console.error("loadConsent error", err);
        return null;
    }
};

const saveConsent = (accepted, prefs) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            accepted, prefs, ts: Date.now(), version: 1,
        }));
        return true;
    } catch (err) {
        console.error("saveConsent error", err);
        return false;
    }
};

const buildPrefs = (accepted, customPrefs) => {
    if (!accepted) return { analytics: false, marketing: false };
    return customPrefs || { analytics: true, marketing: false };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('cookieConsent — loadConsent', () => {
    beforeEach(() => localStorage.clear());

    test('returns null when no consent stored', () => {
        expect(loadConsent()).toBeNull();
    });

    test('returns parsed object when consent stored', () => {
        saveConsent(true, { analytics: true, marketing: false });
        const result = loadConsent();
        expect(result).not.toBeNull();
        expect(result.accepted).toBe(true);
    });

    test('returns null on corrupted JSON', () => {
        store[STORAGE_KEY] = '{bad json';
        expect(loadConsent()).toBeNull();
    });
});

describe('cookieConsent — saveConsent', () => {
    beforeEach(() => localStorage.clear());

    test('persists accepted=true with custom prefs', () => {
        saveConsent(true, { analytics: true, marketing: true });
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        expect(stored.accepted).toBe(true);
        expect(stored.prefs.marketing).toBe(true);
    });

    test('persists accepted=false with essential-only prefs', () => {
        saveConsent(false, { analytics: false, marketing: false });
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        expect(stored.accepted).toBe(false);
    });

    test('stores version and timestamp', () => {
        const before = Date.now();
        saveConsent(true, { analytics: true, marketing: false });
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        expect(stored.version).toBe(1);
        expect(stored.ts).toBeGreaterThanOrEqual(before);
    });
});

describe('cookieConsent — buildPrefs', () => {
    test('accept all → analytics true, marketing true', () => {
        const prefs = buildPrefs(true, { analytics: true, marketing: true });
        expect(prefs.analytics).toBe(true);
        expect(prefs.marketing).toBe(true);
    });

    test('decline → analytics false, marketing false', () => {
        const prefs = buildPrefs(false, null);
        expect(prefs.analytics).toBe(false);
        expect(prefs.marketing).toBe(false);
    });

    test('accept with default custom prefs → analytics true, marketing false', () => {
        const prefs = buildPrefs(true, null);
        expect(prefs.analytics).toBe(true);
        expect(prefs.marketing).toBe(false);
    });

    test('custom partial prefs are respected', () => {
        const prefs = buildPrefs(true, { analytics: false, marketing: true });
        expect(prefs.analytics).toBe(false);
        expect(prefs.marketing).toBe(true);
    });
});

describe('cookieConsent — full accept / reject flow', () => {
    beforeEach(() => localStorage.clear());

    test('acceptAll saves both analytics and marketing as true', () => {
        const all = { analytics: true, marketing: true };
        saveConsent(true, all);
        const consent = loadConsent();
        expect(consent.prefs.analytics).toBe(true);
        expect(consent.prefs.marketing).toBe(true);
    });

    test('acceptEssential saves analytics and marketing as false', () => {
        saveConsent(false, { analytics: false, marketing: false });
        const consent = loadConsent();
        expect(consent.prefs.analytics).toBe(false);
        expect(consent.prefs.marketing).toBe(false);
    });

    test('saveCustom respects user toggle selections', () => {
        const custom = { analytics: true, marketing: false };
        saveConsent(true, custom);
        const consent = loadConsent();
        expect(consent.prefs.marketing).toBe(false);
        expect(consent.prefs.analytics).toBe(true);
    });

    test('overwriting consent updates preferences', () => {
        saveConsent(false, { analytics: false, marketing: false });
        saveConsent(true, { analytics: true, marketing: true });
        const consent = loadConsent();
        expect(consent.accepted).toBe(true);
        expect(consent.prefs.marketing).toBe(true);
    });
});
