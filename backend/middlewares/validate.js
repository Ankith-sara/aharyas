import Joi from 'joi';

// Reusable atoms 
const objectId = Joi.string().hex().length(24);
const email    = Joi.string().email().max(254);
const password = Joi.string().min(8).max(128);

// Core validator factory
/**
 * Accepts either a single Joi schema (applied to req.body, legacy mode)
 * or an object with { body?, params?, query? } Joi schemas.
 *
 * Every schema defaults to strict mode (unknown keys → 400).
 */
const validate = (schema) => (req, res, next) => {
    const schemas =
        schema && (schema.body || schema.params || schema.query)
            ? schema          // new multi-target form
            : { body: schema }; // legacy single-schema form

    for (const [target, s] of Object.entries(schemas)) {
        if (!s) continue;
        const source = req[target];
        const { error, value } = s.validate(source, {
            abortEarly: false,
            convert: true,
            // Strict by default – no unknown keys
        });
        if (error) {
            const messages = error.details.map(d => d.message).join(', ');
            return res.status(400).json({ success: false, message: messages });
        }
        req[target] = value; // apply coerced / defaulted values
    }
    next();
};

// ── Path-parameter schemas (reusable) ────────────────────────────────────────
export const validateMongoId = validate({
    params: Joi.object({ id: objectId.required() }),
});

export const validateOrderIdParam = validate({
    params: Joi.object({ orderId: objectId.required() }),
});

// ── Auth schemas ─────────────────────────────────────────────────────────────
export const validateRegister = validate(Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: email.required(),
    password: password.required(),
}));

export const validateLogin = validate(Joi.object({
    email: email.required(),
    password: Joi.string().required(),
}));

export const validateOtp = validate(Joi.object({
    email: email.required(),
    otp: Joi.string().length(6).required(),
}));

export const validateForgotPasswordOtp = validate(Joi.object({
    email: email.required(),
    newPassword: password.required(),
}));

export const validateResetPassword = validate(Joi.object({
    email: email.required(),
    otp: Joi.string().length(6).required(),
}));

// ── Cart schemas ─────────────────────────────────────────────────────────────
export const validateCartAdd = validate(Joi.object({
    itemId: Joi.string().required(),
    size: Joi.string().optional(),
    quantity: Joi.number().integer().min(1).max(99).default(1),
}));

export const validateCartUpdate = validate(Joi.object({
    itemId: Joi.string().required(),
    size: Joi.string().optional(),
    quantity: Joi.number().integer().min(0).max(99).required(),
}));

export const validateCartRemove = validate(Joi.object({
    itemId: Joi.string().required(),
    size: Joi.string().optional(),
}));

// ── Order schemas ────────────────────────────────────────────────────────────
export const validatePlaceOrder = validate(Joi.object({
    items: Joi.array().items(Joi.object({
        productId: Joi.string().required(),
        name: Joi.string().max(200).required(),
        quantity: Joi.number().integer().min(1).max(100).required(),
        price: Joi.number().positive().required(),
        originalPrice: Joi.number().positive().optional(),
        discount: Joi.number().min(0).max(100).optional(),
        size: Joi.string().max(20).optional(),
        image: Joi.string().uri().optional().allow('', null),
    })).min(1).required(),
    amount: Joi.number().positive().required(),
    address: Joi.object({
        Name: Joi.string().max(100).required(),
        email: email.optional(),
        street: Joi.string().max(300).required(),
        city: Joi.string().max(100).required(),
        state: Joi.string().max(100).required(),
        pincode: Joi.string().max(20).required(),
        country: Joi.string().max(100).required(),
        phone: Joi.string().max(20).required(),
        geolocation: Joi.object({
            latitude: Joi.number().min(-90).max(90).required(),
            longitude: Joi.number().min(-180).max(180).required(),
        }).optional().allow(null),
    }).required(),
    couponCode: Joi.string().max(30).optional().allow('', null),
    discount: Joi.number().min(0).optional(),
    userId: Joi.string().optional(), // injected by auth middleware
}));

// ── Wishlist ─────────────────────────────────────────────────────────────────
export const validateWishlist = validate(Joi.object({
    itemId: objectId.required(),
    userId: objectId.optional(),
}));

// ── Coupon ───────────────────────────────────────────────────────────────────
export const validateCoupon = validate(Joi.object({
    code: Joi.string().max(30).required(),
    discountType: Joi.string().valid('percent', 'flat').required(),
    value: Joi.number().positive().required(),
    minOrderValue: Joi.number().min(0).default(0),
    expiresAt: Joi.date().greater('now').required(),
    usageLimit: Joi.number().positive().allow(null).default(null),
}));

// ── Reviews ──────────────────────────────────────────────────────────────────
export const validateReview = validate(Joi.object({
    productId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(1000).optional(),
}));

// ── Profile / address ────────────────────────────────────────────────────────
export const validateAddressUpdate = validate(Joi.object({
    userId: objectId.optional(),
    index: Joi.number().integer().min(0).optional(),
    addressObj: Joi.object({
        label: Joi.string().trim().max(50).optional().allow(''),
        address: Joi.string().trim().max(300).required(),
        city: Joi.string().trim().max(100).required(),
        state: Joi.string().trim().max(100).required(),
        zip: Joi.string().trim().max(20).required(),
        country: Joi.string().trim().max(100).required(),
        phone: Joi.string().trim().max(20).required(),
        isDefault: Joi.boolean().default(false),
    }).required(),
}));

export const validateAddressDelete = validate(Joi.object({
    userId: objectId.optional(),
    index: Joi.number().integer().min(0).required(),
}));

export const validateChangePassword = validate(Joi.object({
    userId: objectId.optional(),
    currentPassword: Joi.string().optional().allow(''),
    password: password.required(),
}));

// ── Newsletter ───────────────────────────────────────────────────────────────
export const validateSubscribe = validate(Joi.object({
    email: email.required(),
}));

// ── Chat ─────────────────────────────────────────────────────────────────────
export const validateChat = validate(Joi.object({
    messages: Joi.array().items(Joi.object({
        role: Joi.string().valid('user', 'assistant', 'system').required(),
        content: Joi.string().max(4000).required(),
    })).min(1).max(50).required(),
    max_tokens: Joi.number().integer().min(1).max(2048).optional(),
    temperature: Joi.number().min(0).max(2).optional(),
}));

export default validate;