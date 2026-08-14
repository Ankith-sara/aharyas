import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockUserModel = {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
};

jest.unstable_mockModule('../../models/UserModel.js', () => ({ default: mockUserModel }));

const { checkAccountLock, getUserAnalyticsData } = await import('../../services/UserService.js');

describe('UserService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkAccountLock', () => {
        test('returns locked when lockUntil is in the future', () => {
            const user = { lockUntil: new Date(Date.now() + 30 * 60 * 1000) };
            const result = checkAccountLock(user);
            expect(result.locked).toBe(true);
            expect(result.minutesLeft).toBeGreaterThan(0);
        });

        test('returns not locked when lockUntil has passed', () => {
            const user = { lockUntil: new Date(Date.now() - 1000) };
            const result = checkAccountLock(user);
            expect(result.locked).toBe(false);
        });

        test('returns not locked when no lockUntil', () => {
            const user = {};
            const result = checkAccountLock(user);
            expect(result.locked).toBe(false);
        });
    });

    describe('getUserAnalyticsData', () => {
        test('fetches total users, today logins, and daily logins aggregation successfully', async () => {
            mockUserModel.countDocuments
                .mockResolvedValueOnce(150) // totalUsers
                .mockResolvedValueOnce(25);  // todayLogins
            
            const mockDailyLogins = [
                { _id: { year: 2026, month: 5, day: 22 }, count: 18 },
                { _id: { year: 2026, month: 5, day: 21 }, count: 14 }
            ];
            mockUserModel.aggregate.mockResolvedValue(mockDailyLogins);

            const result = await getUserAnalyticsData();

            expect(mockUserModel.countDocuments).toHaveBeenCalledTimes(2);
            expect(mockUserModel.aggregate).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                totalUsers: 150,
                todayLogins: 25,
                dailyLogins: mockDailyLogins
            });
        });
    });
});
