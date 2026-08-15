import { jest } from '@jest/globals';

// Helpers under test 
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function sanitiseText(str) {
    if (!str) return '';
    return String(str)
        .trim()
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<[^>]*>/g, '');
}

// generateOtp 
describe('generateOtp', () => {
    test('returns a 6-digit string', () => {
        const otp = generateOtp();
        expect(otp).toMatch(/^\d{6}$/);
    });

    test('is always within the 100000–999999 range', () => {
        for (let i = 0; i < 200; i++) {
            const n = parseInt(generateOtp(), 10);
            expect(n).toBeGreaterThanOrEqual(100000);
            expect(n).toBeLessThanOrEqual(999999);
        }
    });
});

// sanitiseText
describe('sanitiseText', () => {
    test('trims leading and trailing whitespace', () => {
        expect(sanitiseText('  hello  ')).toBe('hello');
    });

    test('strips HTML tags', () => {
        expect(sanitiseText('<script>alert(1)</script>Cotton Kurta')).toBe('Cotton Kurta');
    });

    test('strips nested/multiple tags', () => {
        expect(sanitiseText('<b><i>Bold</i></b> text')).toBe('Bold text');
    });

    test('returns empty string for null/undefined', () => {
        expect(sanitiseText(null)).toBe('');
        expect(sanitiseText(undefined)).toBe('');
    });

    test('leaves plain text unchanged', () => {
        expect(sanitiseText('Handmade Toys')).toBe('Handmade Toys');
    });
});

// JWT token creation
describe('createToken shape', () => {
    const jwt = { sign: jest.fn().mockReturnValue('mock.jwt.token') };

    function createToken(id, role = 'user') {
        return jwt.sign({ id, role }, 'secret', { expiresIn: '14d' });
    }

    test('includes the role in the payload', () => {
        createToken('user123', 'admin');
        expect(jwt.sign).toHaveBeenCalledWith(
            expect.objectContaining({ role: 'admin' }),
            expect.any(String),
            expect.objectContaining({ expiresIn: '14d' })
        );
    });

    test('defaults role to "user"', () => {
        createToken('user123');
        expect(jwt.sign).toHaveBeenCalledWith(
            expect.objectContaining({ role: 'user' }),
            expect.any(String),
            expect.any(Object)
        );
    });
});

// changePassword ownership check
describe('changePassword ownership', () => {
    function buildMockRes() {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    }

    async function changePasswordGuard(req, res) {
        const authenticatedUserId = req.user?._id || req.user?.id;
        if (!authenticatedUserId || authenticatedUserId !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Forbidden: You can only change your own password.' });
        }
        if (!req.body.password || req.body.password.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
        }
        return res.json({ success: true, message: 'Password updated successfully' });
    }

    test('rejects when authenticated user does not match :id', async () => {
        const req = { params: { id: 'user_B' }, user: { _id: 'user_A' }, body: { password: 'newpassword123' } };
        const res = buildMockRes();
        await changePasswordGuard(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test('rejects short passwords', async () => {
        const req = { params: { id: 'user_A' }, user: { _id: 'user_A' }, body: { password: 'short' } };
        const res = buildMockRes();
        await changePasswordGuard(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('passes when authenticated user matches :id and password is valid', async () => {
        const req = { params: { id: 'user_A' }, user: { _id: 'user_A' }, body: { password: 'validpass123' } };
        const res = buildMockRes();
        await changePasswordGuard(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});