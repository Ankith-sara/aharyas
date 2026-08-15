import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockCartModel = {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
};

const mockUserModel = {
    findById: jest.fn(),
};

const mockProductModel = {
    findById: jest.fn(),
};

const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-123' }),
};

jest.unstable_mockModule('../../features/cart/CartModel.js', () => ({ default: mockCartModel }));
jest.unstable_mockModule('../../features/user/UserModel.js', () => ({ default: mockUserModel }));
jest.unstable_mockModule('../../features/product/ProductModel.js', () => ({ default: mockProductModel }));
jest.unstable_mockModule('../../config/mailer.js', () => ({ default: mockTransporter }));

const {
    processAbandonedCartStage1,
    processAbandonedCartStage2,
    processAbandonedCartStage3,
    markCartAsConverted,
} = await import('../../features/cart/AbandonedCartService.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Abandoned Cart Email System', () => {
    test('markCartAsConverted updates cart status to CONVERTED', async () => {
        mockCartModel.findOneAndUpdate.mockResolvedValue({ userId: 'u1', status: 'CONVERTED' });
        await markCartAsConverted('u1');
        expect(mockCartModel.findOneAndUpdate).toHaveBeenCalledWith(
            { userId: 'u1', status: { $ne: 'CONVERTED' } },
            expect.objectContaining({ $set: expect.objectContaining({ status: 'CONVERTED' }) })
        );
    });

    test('processAbandonedCartStage1 claims cart atomically and sends email', async () => {
        const mockCart = {
            _id: 'c1',
            userId: 'u1',
            items: [{ productId: 'p1', size: 'M', quantity: 1 }],
            lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h ago
            reminder1SentAt: null,
        };

        const mockCandidates = [mockCart];
        mockCartModel.find.mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockCandidates),
        });

        mockCartModel.findOneAndUpdate.mockResolvedValue({ ...mockCart, reminder1SentAt: new Date() });
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'u1', email: 'customer@example.com', name: 'Sarav' }),
        });
        mockProductModel.findById.mockResolvedValue({ _id: 'p1', name: 'Kanjivaram Saree', price: 5000, discount: 0, visible: true });

        const count = await processAbandonedCartStage1();

        expect(count).toBe(1);
        expect(mockCartModel.findOneAndUpdate).toHaveBeenCalled();
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'customer@example.com',
                subject: 'Your Aharyas cart is waiting',
            })
        );
    });

    test('processAbandonedCartStage2 sends 72h (3-day) reminder email', async () => {
        const mockCart = {
            _id: 'c2',
            userId: 'u1',
            items: [{ productId: 'p1', size: 'M', quantity: 1 }],
            lastActivityAt: new Date(Date.now() - 73 * 60 * 60 * 1000), // 73h ago
            reminder1SentAt: new Date(),
            reminder2SentAt: null,
            status: 'ABANDONED',
        };

        mockCartModel.find.mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockCart]),
        });

        mockCartModel.findOneAndUpdate.mockResolvedValue({ ...mockCart, reminder2SentAt: new Date() });
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'u1', email: 'customer@example.com', name: 'Sarav' }),
        });
        mockProductModel.findById.mockResolvedValue({ _id: 'p1', name: 'Kanjivaram Saree', price: 5000, discount: 0, visible: true });

        const count = await processAbandonedCartStage2();

        expect(count).toBe(1);
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'customer@example.com',
                subject: 'Still thinking about your Aharyas selection?',
            })
        );
    });

    test('skips email dispatch if findOneAndUpdate returns null (claimed by another worker or converted)', async () => {
        mockCartModel.find.mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ _id: 'c3', userId: 'u1' }]),
        });

        mockCartModel.findOneAndUpdate.mockResolvedValue(null); // Already claimed

        const count = await processAbandonedCartStage1();

        expect(count).toBe(0);
        expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
});
