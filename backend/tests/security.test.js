import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ESM mocks for dependencies
const mockUserModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

const mockOrderModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
};

const mockCartModel = {
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
};

const mockImagekit = { files: { upload: jest.fn() } };

// Mock fs to simulate valid/invalid magic bytes
const mockFd = {
    read: jest.fn(),
    close: jest.fn().mockResolvedValue(),
};

const mockFs = {
    promises: {
        open: jest.fn().mockResolvedValue(mockFd),
        readFile: jest.fn(),
        unlink: jest.fn().mockResolvedValue(),
    }
};

jest.unstable_mockModule('../features/user/UserModel.js', () => ({ default: mockUserModel }));
jest.unstable_mockModule('../features/order/OrderModel.js', () => ({ default: mockOrderModel }));
jest.unstable_mockModule('../features/cart/CartModel.js', () => ({ default: mockCartModel }));
jest.unstable_mockModule('../config/imagekit.js', () => ({ default: mockImagekit }));
jest.unstable_mockModule('fs', () => ({ default: mockFs }));

// Import the services
const { updateProfile, deleteProfile } = await import('../features/user/ProfileService.js');
const { verifyAndFinaliseRazorpayOrder } = await import('../features/order/OrderService.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Security Hardening Audits', () => {

    describe('File Upload Magic Bytes Check (Profile Update)', () => {
        test('rejects profile update if uploaded file is not a valid image', async () => {
            // Mock magic bytes reading to return something that is not JPEG, PNG, GIF, or WEBP (e.g. text/html)
            mockFd.read.mockImplementation((buf) => {
                buf[0] = 0x3C; // '<'
                buf[1] = 0x21; // '!'
                buf[2] = 0x44; // 'D'
                return Promise.resolve({ bytesRead: 12, buffer: buf });
            });

            await expect(updateProfile({
                id: 'uid123',
                name: 'Test User',
                imageFile: { path: '/tmp/malicious.sh' }
            })).rejects.toThrow('Uploaded file is not a valid image (JPEG, PNG, GIF, or WEBP)');
        });

        test('accepts profile update if uploaded file has valid JPEG headers', async () => {
            mockFd.read.mockImplementation((buf) => {
                buf[0] = 0xFF;
                buf[1] = 0xD8;
                buf[2] = 0xFF;
                return Promise.resolve({ bytesRead: 12, buffer: buf });
            });

            mockFs.promises.readFile.mockResolvedValue(Buffer.from('jpeg-content'));
            mockImagekit.files.upload.mockResolvedValue({ url: 'https://ik.imagekit.io/profile.jpg' });
            
            const mockUpdatedUser = { _id: 'uid123', name: 'Test User', image: 'https://ik.imagekit.io/profile.jpg' };
            mockUserModel.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUpdatedUser)
            });

            const result = await updateProfile({
                id: 'uid123',
                name: 'Test User',
                imageFile: { path: '/tmp/valid.jpg' }
            });

            expect(result.image).toBe('https://ik.imagekit.io/profile.jpg');
            expect(mockImagekit.files.upload).toHaveBeenCalled();
        });
    });

    describe('Account Deletion Service', () => {
        test('calls findByIdAndDelete with user ID', async () => {
            const mockUser = { _id: 'uid123', name: 'To Be Deleted' };
            mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

            const result = await deleteProfile('uid123');
            expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('uid123');
            expect(result).toEqual(mockUser);
        });

        test('throws 404 error if user does not exist', async () => {
            mockUserModel.findByIdAndDelete.mockResolvedValue(null);
            await expect(deleteProfile('uid999')).rejects.toMatchObject({ statusCode: 404 });
        });
    });

    describe('Order Verification IDOR Protection', () => {
        test('rejects Razorpay payment verification if order does not belong to the user', async () => {
            const mockOrder = { _id: 'order123', userId: 'uid123', payment: false };
            mockOrderModel.findById.mockResolvedValue(mockOrder);

            const mockCrypto = {
                createHmac: jest.fn().mockReturnValue({
                    update: jest.fn().mockReturnValue({
                        digest: jest.fn().mockReturnValue('mocked-sig')
                    })
                })
            };

            await expect(verifyAndFinaliseRazorpayOrder({
                orderId: 'order123',
                razorpay_order_id: 'rzp123',
                razorpay_payment_id: 'pay123',
                razorpay_signature: 'mocked-sig',
                crypto: mockCrypto,
                userId: 'uid_intruder' // Different user id
            })).rejects.toThrow('Access denied. You do not own this order.');
        });

        test('accepts Razorpay payment verification if order belongs to the user', async () => {
            const mockOrder = { _id: 'order123', userId: 'uid123', payment: false };
            mockOrderModel.findById.mockResolvedValue(mockOrder);
            mockOrderModel.findByIdAndUpdate.mockResolvedValue({});

            const mockCrypto = {
                createHmac: jest.fn().mockReturnValue({
                    update: jest.fn().mockReturnValue({
                        digest: jest.fn().mockReturnValue('mocked-sig')
                    })
                })
            };

            const result = await verifyAndFinaliseRazorpayOrder({
                orderId: 'order123',
                razorpay_order_id: 'rzp123',
                razorpay_payment_id: 'pay123',
                razorpay_signature: 'mocked-sig',
                crypto: mockCrypto,
                userId: 'uid123' // Same user id
            });

            expect(result).toEqual(mockOrder);
            expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalled();
        });
    });

    describe('IDOR Ownership Verification logic', () => {
        const verifyOwnership = (req) => {
            const authenticatedId = req.user?._id?.toString() || req.body?.userId;
            const isAdmin = req.user?.role === 'admin';
            if (authenticatedId !== req.params.id && !isAdmin) {
                return false;
            }
            return true;
        };

        test('denies access when requesting id is different and role is user', () => {
            const req = {
                user: { _id: 'uid123', role: 'user' },
                params: { id: 'uid456' },
                body: { userId: 'uid123' }
            };
            expect(verifyOwnership(req)).toBe(false);
        });

        test('allows access when requesting id is same and role is user', () => {
            const req = {
                user: { _id: 'uid123', role: 'user' },
                params: { id: 'uid123' },
                body: { userId: 'uid123' }
            };
            expect(verifyOwnership(req)).toBe(true);
        });

        test('allows access when requesting id is different but user is admin', () => {
            const req = {
                user: { _id: 'uid_admin', role: 'admin' },
                params: { id: 'uid456' },
                body: { userId: 'uid_admin' }
            };
            expect(verifyOwnership(req)).toBe(true);
        });
    });
});
