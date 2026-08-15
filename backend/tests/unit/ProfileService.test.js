import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ESM mocks
const mockUserModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
};

const mockBcrypt = {
    hash: jest.fn(),
    compare: jest.fn(),
};

const mockImagekit = { files: { upload: jest.fn() } };
const mockFd = {
    read: jest.fn().mockImplementation((buf) => {
        buf[0] = 0xFF;
        buf[1] = 0xD8;
        buf[2] = 0xFF;
        return Promise.resolve({ bytesRead: 12, buffer: buf });
    }),
    close: jest.fn().mockResolvedValue(),
};
const mockFs = {
    promises: {
        open: jest.fn().mockResolvedValue(mockFd),
        readFile: jest.fn(),
        unlink: jest.fn().mockResolvedValue(),
    }
};

jest.unstable_mockModule('../../features/user/UserModel.js', () => ({ default: mockUserModel }));
jest.unstable_mockModule('bcryptjs', () => ({ default: mockBcrypt }));
jest.unstable_mockModule('../../config/imagekit.js', () => ({ default: mockImagekit }));
jest.unstable_mockModule('fs', () => ({ default: mockFs }));

const {
    getProfile, getProfileById, updateProfile,
    upsertAddress, removeAddress, changePassword,
} = await import('../../features/user/ProfileService.js');

beforeEach(() => jest.clearAllMocks());

// getProfile 
describe('getProfile', () => {
    test('throws 404 when user not found', async () => {
        mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        await expect(getProfile('uid1')).rejects.toMatchObject({ statusCode: 404 });
    });

    test('returns user when found', async () => {
        const mockUser = { _id: 'uid1', name: 'Sarankar' };
        mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

        const result = await getProfile('uid1');
        expect(result.name).toBe('Sarankar');
    });
});

// getProfileById 
describe('getProfileById', () => {
    test('throws 404 when user not found', async () => {
        mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        await expect(getProfileById('uid1')).rejects.toMatchObject({ statusCode: 404 });
    });

    test('returns user when found', async () => {
        const mockUser = { _id: 'uid1', name: 'Sarankar', email: 'a@b.com' };
        mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

        const result = await getProfileById('uid1');
        expect(result.name).toBe('Sarankar');
    });
});

// updateProfile
describe('updateProfile', () => {
    test('throws 404 when user not found after update', async () => {
        mockUserModel.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        await expect(updateProfile({ id: 'uid1', name: 'New' })).rejects.toMatchObject({ statusCode: 404 });
    });

    test('updates fields without uploading when no image file provided', async () => {
        const mockUser = { _id: 'uid1', name: 'Updated' };
        mockUserModel.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

        const result = await updateProfile({ id: 'uid1', name: 'Updated', email: 'a@b.com', phone: '9999' });

        expect(mockImagekit.files.upload).not.toHaveBeenCalled();
        expect(result.name).toBe('Updated');
    });

    test('uploads to imagekit and sets image URL when file is provided', async () => {
        mockFs.promises.readFile.mockResolvedValue('filedata');
        mockImagekit.files.upload.mockResolvedValue({ url: 'https://ik.imagekit.io/example/img.jpg' });
        const mockUser = { _id: 'uid1', image: 'https://ik.imagekit.io/example/img.jpg' };
        mockUserModel.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

        const result = await updateProfile({ id: 'uid1', name: 'X', imageFile: { path: '/tmp/img.jpg' } });

        expect(mockImagekit.files.upload).toHaveBeenCalledWith(
            expect.objectContaining({ folder: 'user_profiles', file: 'filedata', fileName: 'img.jpg' })
        );
        expect(result.image).toBe('https://ik.imagekit.io/example/img.jpg');
    });
});

// upsertAddress
describe('upsertAddress', () => {
    test('throws 404 when user not found', async () => {
        mockUserModel.findById.mockResolvedValue(null);
        await expect(upsertAddress({ userId: 'uid1', addressObj: {} }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('appends new address when no index provided', async () => {
        const mockUser = { addresses: [], save: jest.fn() };
        mockUserModel.findById.mockResolvedValue(mockUser);

        const result = await upsertAddress({ userId: 'uid1', addressObj: { city: 'Hyderabad' } });

        expect(mockUser.addresses).toHaveLength(1);
        expect(mockUser.addresses[0].city).toBe('Hyderabad');
        expect(mockUser.save).toHaveBeenCalled();
        expect(result).toEqual(mockUser.addresses);
    });

    test('updates address at the given index when index is valid', async () => {
        const mockUser = { addresses: [{ city: 'Old' }, { city: 'Keep' }], save: jest.fn() };
        mockUserModel.findById.mockResolvedValue(mockUser);

        await upsertAddress({ userId: 'uid1', addressObj: { city: 'New' }, index: 0 });

        expect(mockUser.addresses[0].city).toBe('New');
        expect(mockUser.addresses[1].city).toBe('Keep');
    });
});

// removeAddress
describe('removeAddress', () => {
    test('throws 404 when user not found', async () => {
        mockUserModel.findById.mockResolvedValue(null);
        await expect(removeAddress({ userId: 'uid1', index: 0 })).rejects.toMatchObject({ statusCode: 404 });
    });

    test('removes address at the specified index', async () => {
        const mockUser = { addresses: [{ city: 'A' }, { city: 'B' }, { city: 'C' }], save: jest.fn() };
        mockUserModel.findById.mockResolvedValue(mockUser);

        const result = await removeAddress({ userId: 'uid1', index: 1 });

        expect(result).toHaveLength(2);
        expect(result.map((a) => a.city)).toEqual(['A', 'C']);
    });
});

// changePassword 
describe('changePassword', () => {
    test('throws 400 when new password is too short', async () => {
        await expect(changePassword({ userId: 'uid1', currentPassword: 'old', newPassword: 'short' }))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 404 when user not found', async () => {
        mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
        await expect(changePassword({ userId: 'uid1', newPassword: 'validpassword' }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 401 when current password is incorrect', async () => {
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ password: 'hashed' }),
        });
        mockBcrypt.compare.mockResolvedValue(false);

        await expect(changePassword({ userId: 'uid1', currentPassword: 'wrong', newPassword: 'newvalidpass' }))
            .rejects.toMatchObject({ statusCode: 401 });
    });

    test('updates password when current password is correct', async () => {
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ password: 'hashed' }),
        });
        mockBcrypt.compare.mockResolvedValue(true);
        mockBcrypt.hash.mockResolvedValue('new-hashed');
        mockUserModel.findByIdAndUpdate.mockResolvedValue({});

        await changePassword({ userId: 'uid1', currentPassword: 'correct', newPassword: 'newvalidpass' });

        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('uid1', { password: 'new-hashed' });
    });

    test('skips current password check for Google-auth users with no password', async () => {
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ password: null }),
        });
        mockBcrypt.hash.mockResolvedValue('new-hashed');
        mockUserModel.findByIdAndUpdate.mockResolvedValue({});

        await changePassword({ userId: 'uid1', newPassword: 'newvalidpass' });

        expect(mockBcrypt.compare).not.toHaveBeenCalled();
        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });
});
