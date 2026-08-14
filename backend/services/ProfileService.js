import bcrypt from 'bcryptjs';
import imagekit from '../config/imagekit.js';
import fs from 'fs';
import path from 'path';
import userModel from '../models/UserModel.js';

const BCRYPT_SALT_ROUNDS = 10;
const MIN_PASSWORD_LEN = 8;
const PROFILE_HIDDEN_FIELDS = '-password -otp -otpExpiry -tempPassword -refreshToken';

/**
 * Validate real file content by inspecting magic bytes.
 * Returns true only for JPEG, PNG, GIF, or WEBP headers.
 */
const validateImageContent = async (filePath) => {
    const fd = await fs.promises.open(filePath, 'r');
    try {
        const buf = Buffer.alloc(12);
        await fd.read(buf, 0, 12, 0);
        if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
        if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
            buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) return true;
        if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
        if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
            buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;

        return false;
    } finally {
        await fd.close();
    }
};

// Profile reads 
export const getProfile = async (userId) => {
    const user = await userModel.findById(userId).select(PROFILE_HIDDEN_FIELDS);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
};

export const getProfileById = async (id) => {
    const user = await userModel.findById(id).select('-password -refreshToken');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
};

// Profile writes
export const updateProfile = async ({ id, name, email, phone, imageFile }) => {
    const fields = { name, email, phone };

    if (imageFile) {
        try {
            const isImage = await validateImageContent(imageFile.path);
            if (!isImage) {
                throw Object.assign(
                    new Error('Uploaded file is not a valid image (JPEG, PNG, GIF, or WEBP)'),
                    { statusCode: 400 },
                );
            }

            const fileData = await fs.promises.readFile(imageFile.path);
            const result = await imagekit.files.upload({
                file: fileData.toString('base64'),
                fileName: path.basename(imageFile.path) || `profile_${Date.now()}`,
                folder: 'user_profiles',
            });
            fields.image = result.url;
        } finally {
            // Always clean up uploaded temp files
            fs.promises.unlink(imageFile.path).catch((err) => {
                console.error('[ProfileService] Failed to clean up temp file:', err.message);
            });
        }
    }

    const user = await userModel
        .findByIdAndUpdate(id, fields, { new: true, runValidators: true })
        .select('-password -refreshToken');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
};

// Address management
export const upsertAddress = async ({ userId, addressObj, index }) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    if (typeof index === 'number' && index >= 0) {
        user.addresses[index] = addressObj;
    } else {
        user.addresses.push(addressObj);
    }

    await user.save();
    return user.addresses;
};

export const removeAddress = async ({ userId, index }) => {
    const user = await userModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    user.addresses.splice(index, 1);
    await user.save();
    return user.addresses;
};

// Password change
export const changePassword = async ({ userId, currentPassword, newPassword }) => {
    if (!newPassword || newPassword.length < MIN_PASSWORD_LEN)
        throw Object.assign(new Error(`New password must be at least ${MIN_PASSWORD_LEN} characters`), { statusCode: 400 });

    const user = await userModel.findById(userId).select('+password');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    if (user.password && currentPassword !== undefined) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch)
            throw Object.assign(new Error('Current password is incorrect'), { statusCode: 401 });
    }

    const hashed = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await userModel.findByIdAndUpdate(userId, { password: hashed });
};

// Account deletion
export const deleteProfile = async (userId) => {
    const user = await userModel.findByIdAndDelete(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
};
