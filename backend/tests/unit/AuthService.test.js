import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ESM mocks 
const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
};

const mockBcrypt = {
    hash: jest.fn(),
    compare: jest.fn(),
    genSalt: jest.fn(),
};

const mockJwt = {
    sign: jest.fn(),
    verify: jest.fn(),
};
const mockValidator = { isEmail: jest.fn() };
const mockSendOtpMail = jest.fn();
const mockSendWelcomeMail = jest.fn();
const mockOtpService = {
    generateOtp: jest.fn().mockReturnValue('123456'),
    storeOtp: jest.fn().mockResolvedValue(true),
    verifyOtp: jest.fn().mockResolvedValue({ valid: true }),
    checkOtpRequestLimit: jest.fn().mockResolvedValue({ allowed: true }),
};

jest.unstable_mockModule('../../features/user/UserModel.js', () => ({ default: mockUserModel }));
jest.unstable_mockModule('bcryptjs', () => ({ default: mockBcrypt }));
jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
jest.unstable_mockModule('validator', () => ({ default: mockValidator }));
jest.unstable_mockModule('../../middlewares/sendOtpMail.js', () => ({ default: mockSendOtpMail }));
jest.unstable_mockModule('../../middlewares/sendWelcomeMail.js', () => ({ default: mockSendWelcomeMail }));
jest.unstable_mockModule('../../config/logger.js', () => ({ default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }));
jest.unstable_mockModule('../../features/user/OtpService.js', () => mockOtpService);

const {
    createAccessToken, createRefreshToken,
    initiateRegistration, confirmRegistration,
    loginWithPassword, rotateRefreshToken,
    loginAdmin, initiateForgotPassword, confirmPasswordReset,
} = await import('../../features/user/AuthService.js');

beforeEach(() => {
    jest.clearAllMocks();
    mockSendWelcomeMail.mockResolvedValue();
    mockSendOtpMail.mockResolvedValue();
    mockOtpService.checkOtpRequestLimit.mockResolvedValue({ allowed: true });
    mockOtpService.verifyOtp.mockResolvedValue({ valid: true });
    mockUserModel.findOne.mockResolvedValue(null);
    mockValidator.isEmail.mockReturnValue(true);
});

// Token helpers
describe('createAccessToken', () => {
    test('signs with id, role, and JWT_SECRET with 14d expiry', () => {
        mockJwt.sign.mockReturnValue('access-token');

        const token = createAccessToken('user123', 'user');

        const [payload, , options] = mockJwt.sign.mock.calls[0];
        expect(payload).toEqual({ id: 'user123', role: 'user' });
        expect(options).toEqual({ expiresIn: '14d' });
        expect(token).toBe('access-token');
    });

    test('defaults role to user when not provided', () => {
        mockJwt.sign.mockReturnValue('token');
        mockSendWelcomeMail.mockResolvedValue();
        createAccessToken('id1');
        const [payload] = mockJwt.sign.mock.calls[0];
        expect(payload).toEqual({ id: 'id1', role: 'user' });
    });
});

describe('createRefreshToken', () => {
    test('signs with 21d expiry', () => {
        mockJwt.sign.mockReturnValue('refresh-token');
        createRefreshToken('user123', 'user');
        const [payload, , options] = mockJwt.sign.mock.calls[0];
        expect(payload).toEqual({ id: 'user123', role: 'user' });
        expect(options).toEqual({ expiresIn: '21d' });
    });
});

// initiateRegistration 
describe('initiateRegistration', () => {
    test('throws 400 for invalid email format', async () => {
        mockValidator.isEmail.mockReturnValue(false);
        await expect(initiateRegistration({ email: 'bad', name: 'Test', password: 'password123' }))
            .rejects.toMatchObject({ statusCode: 400, message: 'Invalid email format' });
    });

    test('throws 400 when password is too short', async () => {
        mockValidator.isEmail.mockReturnValue(true);
        await expect(initiateRegistration({ email: 'a@b.com', name: 'Test', password: 'short' }))
            .rejects.toMatchObject({ statusCode: 400 });
        expect(mockSendOtpMail).not.toHaveBeenCalled();
    });

    test('throws 400 when verified user already exists', async () => {
        mockValidator.isEmail.mockReturnValue(true);
        mockUserModel.findOne.mockResolvedValue({ isVerified: true });
        await expect(initiateRegistration({ email: 'a@b.com', name: 'Test', password: 'validpass' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 429 when OTP rate limit is reached', async () => {
        mockValidator.isEmail.mockReturnValue(true);
        mockOtpService.checkOtpRequestLimit.mockResolvedValueOnce({
            allowed: false,
            message: 'Please wait',
        });
        await expect(initiateRegistration({ email: 'a@b.com', name: 'Test', password: 'validpass' }))
            .rejects.toMatchObject({ statusCode: 429, message: expect.stringContaining('wait') });
    });

    test('creates new user and sends OTP for a fresh email', async () => {
        mockValidator.isEmail.mockReturnValue(true);
        mockUserModel.findOne.mockResolvedValue(null);
        mockBcrypt.hash.mockResolvedValue('hashed');
        mockUserModel.create.mockResolvedValue({});
        mockSendOtpMail.mockResolvedValue();

        await initiateRegistration({ email: 'new@b.com', name: 'Test', password: 'validpass' });

        expect(mockUserModel.create).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'new@b.com', isVerified: false })
        );
        expect(mockSendOtpMail).toHaveBeenCalledWith('new@b.com', expect.any(String));
    });

    test('updates existing unverified user instead of creating a duplicate', async () => {
        mockValidator.isEmail.mockReturnValue(true);
        const mockUser = { isVerified: false, otpExpiry: null, save: jest.fn() };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockBcrypt.hash.mockResolvedValue('hashed');
        mockSendOtpMail.mockResolvedValue();

        await initiateRegistration({ email: 'existing@b.com', name: 'NewName', password: 'validpass' });

        expect(mockUser.save).toHaveBeenCalled();
        expect(mockUserModel.create).not.toHaveBeenCalled();
        expect(mockUser.name).toBe('NewName');
    });
});

// confirmRegistration 
describe('confirmRegistration', () => {
    test('throws 404 when user not found', async () => {
        mockUserModel.findOne.mockResolvedValue(null);
        await expect(confirmRegistration({ email: 'x@x.com', otp: '123456' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 400 when account is already verified', async () => {
        mockUserModel.findOne.mockResolvedValue({ isVerified: true, role: 'user' });
        await expect(confirmRegistration({ email: 'x@x.com', otp: '123456' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 401 for wrong OTP', async () => {
        mockUserModel.findOne.mockResolvedValue({ isVerified: false, role: 'user' });
        mockOtpService.verifyOtp.mockResolvedValueOnce({ valid: false, message: 'Invalid OTP' });
        await expect(confirmRegistration({ email: 'x@x.com', otp: '123456' }))
            .rejects.toMatchObject({ statusCode: 401, message: 'Invalid OTP' });
    });

    test('throws 401 for expired OTP', async () => {
        mockUserModel.findOne.mockResolvedValue({ isVerified: false, role: 'user' });
        mockOtpService.verifyOtp.mockResolvedValueOnce({ valid: false, message: 'OTP expired.' });
        await expect(confirmRegistration({ email: 'x@x.com', otp: '123456' }))
            .rejects.toMatchObject({ statusCode: 401, message: 'OTP expired.' });
    });

    test('verifies user, clears OTP, and returns token on success', async () => {
        const mockUser = {
            _id: 'uid1', name: 'Ankit', role: 'user', isVerified: false,
            save: jest.fn(),
        };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockJwt.sign.mockReturnValue('tok');

        const result = await confirmRegistration({ email: 'x@x.com', otp: '123456' });

        expect(mockUser.isVerified).toBe(true);
        expect(mockUser.save).toHaveBeenCalled();
        expect(result.token).toBe('tok');
        expect(result.name).toBe('Ankit');
    });
});

// loginWithPassword 
describe('loginWithPassword', () => {
    test('throws 404 when user does not exist', async () => {
        mockUserModel.findOne.mockResolvedValue(null);
        await expect(loginWithPassword({ email: 'x@x.com', password: 'pass' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('allows admin accounts to login via customer portal', async () => {
        const mockUser = {
            _id: 'uid1', name: 'AdminName', role: 'admin', isVerified: true, isLocked: false,
            loginAttempts: 0,
            incrementLoginAttempts: jest.fn(),
            resetLoginAttempts: jest.fn(),
            save: jest.fn(),
        };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(true);
        mockBcrypt.hash.mockResolvedValue('hashed-refresh');
        mockJwt.sign.mockReturnValue('admin-token');

        const result = await loginWithPassword({ email: 'admin@admin.com', password: 'pass' });
        expect(result.token).toBe('admin-token');
        expect(result.role).toBe('admin');
    });

    test('throws 401 for unverified user', async () => {
        mockUserModel.findOne.mockResolvedValue({ role: 'user', isVerified: false });
        await expect(loginWithPassword({ email: 'x@x.com', password: 'pass' }))
            .rejects.toMatchObject({ statusCode: 401 });
    });

    test('throws 423 when account is locked', async () => {
        mockUserModel.findOne.mockResolvedValue({
            role: 'user', isVerified: true,
            isLocked: true, lockUntil: Date.now() + 10 * 60 * 1000,
        });
        await expect(loginWithPassword({ email: 'x@x.com', password: 'pass' }))
            .rejects.toMatchObject({ statusCode: 423 });
    });

    test('increments attempts and throws 401 on wrong password', async () => {
        const mockUser = {
            role: 'user', isVerified: true, isLocked: false, loginAttempts: 1,
            incrementLoginAttempts: jest.fn(),
        };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(false);

        await expect(loginWithPassword({ email: 'x@x.com', password: 'wrong' }))
            .rejects.toMatchObject({ statusCode: 401 });
        expect(mockUser.incrementLoginAttempts).toHaveBeenCalled();
    });

    test('returns token pair on successful login', async () => {
        const mockUser = {
            _id: 'uid1', name: 'Sarankar', role: 'user', isVerified: true, isLocked: false,
            loginAttempts: 0,
            incrementLoginAttempts: jest.fn(),
            resetLoginAttempts: jest.fn(),
            save: jest.fn(),
        };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(true);
        mockBcrypt.hash.mockResolvedValue('hashed-refresh');
        mockJwt.sign.mockReturnValue('jwt-token');

        const result = await loginWithPassword({ email: 'x@x.com', password: 'correct' });

        expect(mockUser.resetLoginAttempts).toHaveBeenCalled();
        expect(result.token).toBe('jwt-token');
        expect(result.refreshToken).toBe('jwt-token');
        expect(result.name).toBe('Sarankar');
    });
});

// rotateRefreshToken 
describe('rotateRefreshToken', () => {
    test('throws when jwt.verify fails', async () => {
        mockJwt.verify.mockImplementation(() => { throw new Error('expired'); });
        await expect(rotateRefreshToken('bad-token')).rejects.toThrow();
    });

    test('throws 401 when no stored refresh token found', async () => {
        mockJwt.verify.mockReturnValue({ id: 'uid1' });
        mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        await expect(rotateRefreshToken('tok')).rejects.toMatchObject({ statusCode: 401 });
    });

    test('throws 401 when token hash does not match', async () => {
        mockJwt.verify.mockReturnValue({ id: 'uid1' });
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ refreshToken: 'stored-hash', save: jest.fn() }),
        });
        mockBcrypt.compare.mockResolvedValue(false);
        await expect(rotateRefreshToken('tok')).rejects.toMatchObject({ statusCode: 401 });
    });

    test('returns new token pair when rotation succeeds', async () => {
        mockJwt.verify.mockReturnValue({ id: 'uid1', role: 'user' });
        const mockUser = { _id: 'uid1', role: 'user', refreshToken: 'hash', save: jest.fn() };
        mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
        mockBcrypt.compare.mockResolvedValue(true);
        mockBcrypt.hash.mockResolvedValue('new-hash');
        mockJwt.sign.mockReturnValue('new-token');

        const result = await rotateRefreshToken('valid-tok');

        expect(result.token).toBe('new-token');
        expect(result.refreshToken).toBe('new-token');
        expect(mockUser.save).toHaveBeenCalled();
    });
});

// loginAdmin 
describe('loginAdmin', () => {
    test('throws 404 when admin account not found', async () => {
        mockUserModel.findOne.mockResolvedValue(null);
        await expect(loginAdmin({ email: 'a@a.com', password: 'pass' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 401 for unverified admin', async () => {
        mockUserModel.findOne.mockResolvedValue({ isVerified: false });
        await expect(loginAdmin({ email: 'a@a.com', password: 'pass' }))
            .rejects.toMatchObject({ statusCode: 401 });
    });

    test('throws 401 for wrong password', async () => {
        mockUserModel.findOne.mockResolvedValue({ isVerified: true });
        mockBcrypt.compare.mockResolvedValue(false);
        await expect(loginAdmin({ email: 'a@a.com', password: 'wrong' }))
            .rejects.toMatchObject({ statusCode: 401 });
    });

    test('returns token on valid credentials', async () => {
        mockUserModel.findOne.mockResolvedValue({ _id: 'aid1', name: 'Admin', isVerified: true });
        mockBcrypt.compare.mockResolvedValue(true);
        mockJwt.sign.mockReturnValue('admin-token');

        const result = await loginAdmin({ email: 'a@a.com', password: 'correct' });

        expect(result.token).toBe('admin-token');
        expect(result.role).toBe('admin');
        expect(result.name).toBe('Admin');
    });
});

// initiateForgotPassword
describe('initiateForgotPassword', () => {
    test('throws 400 for invalid email format', async () => {
        mockValidator.isEmail.mockReturnValue(false);
        await expect(initiateForgotPassword({ email: 'bad', newPassword: 'validpass' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 400 when new password is too short', async () => {
        mockValidator.isEmail.mockReturnValue(true);
        await expect(initiateForgotPassword({ email: 'a@b.com', newPassword: 'short' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 404 when no account matches the email', async () => {
        mockValidator.isEmail.mockReturnValue(true);
        mockUserModel.findOne.mockResolvedValue(null);
        await expect(initiateForgotPassword({ email: 'x@x.com', newPassword: 'newpassword' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('stores tempPassword and sends OTP when valid', async () => {
        mockValidator.isEmail.mockReturnValue(true);
        const mockUser = { isVerified: true, save: jest.fn() };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockBcrypt.hash.mockResolvedValue('hashed-new');
        mockSendOtpMail.mockResolvedValue();

        await initiateForgotPassword({ email: 'x@x.com', newPassword: 'newpassword' });

        expect(mockUser.tempPassword).toBe('hashed-new');
        expect(mockSendOtpMail).toHaveBeenCalled();
    });
});

// ─── confirmPasswordReset ─────────────────────────────────────────────────────

describe('confirmPasswordReset', () => {
    test('throws 404 when user not found', async () => {
        mockUserModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        await expect(confirmPasswordReset({ email: 'x@x.com', otp: '123456' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 400 when no password reset is in progress', async () => {
        mockUserModel.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                isVerified: true, tempPassword: null,
            }),
        });
        await expect(confirmPasswordReset({ email: 'x@x.com', otp: '123456' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('resets password and clears all OTP fields on valid OTP', async () => {
        const mockUser = {
            isVerified: true, tempPassword: 'hashed-new',
            save: jest.fn(),
        };
        mockUserModel.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser),
        });

        await confirmPasswordReset({ email: 'x@x.com', otp: '123456' });

        expect(mockUser.password).toBe('hashed-new');
        expect(mockUser.tempPassword).toBeUndefined();
        expect(mockUser.save).toHaveBeenCalled();
    });
});
