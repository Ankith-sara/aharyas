import cartModel from './CartModel.js';
import userModel from '../user/UserModel.js';
import productModel from '../product/ProductModel.js';
import transporter from '../../config/mailer.js';
import { abandonedCartEmailTemplate } from '../../config/emailTemplates.js';
import logger from '../../config/logger.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 72 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const markCartAsConverted = async (userId) => {
    try {
        await cartModel.findOneAndUpdate(
            { userId, status: { $ne: 'CONVERTED' } },
            {
                $set: {
                    status: 'CONVERTED',
                    convertedAt: new Date(),
                    items: [],
                },
            }
        );
        logger.info(`[AbandonedCartService] Marked cart as CONVERTED for user ${userId}`);
    } catch (err) {
        logger.error(`[AbandonedCartService] Error converting cart for user ${userId}`, err);
    }
};

const buildPopulatedItems = async (cartItems) => {
    const populated = [];
    for (const item of cartItems) {
        const product = await productModel.findById(item.productId);
        if (product && product.visible) {
            const effectivePrice = product.discount > 0
                ? Math.round(product.price * (1 - product.discount / 100))
                : product.price;

            populated.push({
                productId: product._id,
                name: product.name,
                size: item.size,
                quantity: item.quantity,
                price: effectivePrice,
                originalPrice: product.price,
                discount: product.discount || 0,
                image: product.images?.[0] || null,
            });
        }
    }
    return populated;
};

export const processAbandonedCartStage1 = async () => {
    const cutoff = new Date(Date.now() - ONE_DAY_MS);
    const candidates = await cartModel.find({
        status: { $in: ['ACTIVE', 'ABANDONED'] },
        reminder1SentAt: null,
        lastActivityAt: { $lte: cutoff },
        'items.0': { $exists: true },
    }).limit(50);

    let processedCount = 0;

    for (const cart of candidates) {
        // Atomic claim to guarantee idempotency across multiple workers
        const claimed = await cartModel.findOneAndUpdate(
            { _id: cart._id, reminder1SentAt: null, status: { $ne: 'CONVERTED' } },
            {
                $set: {
                    reminder1SentAt: new Date(),
                    status: 'ABANDONED',
                    abandonedAt: cart.abandonedAt || new Date(),
                },
            },
            { new: true }
        );

        if (!claimed) continue; // Already claimed or converted

        const user = await userModel.findById(cart.userId).select('email name');
        if (!user || !user.email) continue;

        const populatedItems = await buildPopulatedItems(cart.items);
        if (populatedItems.length === 0) continue;

        const html = abandonedCartEmailTemplate({
            user,
            items: populatedItems,
            cartUrl: `${process.env.FRONTEND_URL || 'https://aharyas.com'}/cart`,
            stage: 1,
        });

        try {
            await transporter.sendMail({
                from: `"Aharyas" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Your Aharyas cart is waiting',
                html,
            });
            processedCount++;
            logger.info(`[AbandonedCartWorker] Sent Stage 1 email to ${user.email} (cart: ${cart._id})`);
        } catch (mailErr) {
            logger.error(`[AbandonedCartWorker] Failed to send Stage 1 email to ${user.email}`, mailErr);
        }
    }

    return processedCount;
};

export const processAbandonedCartStage2 = async () => {
    const cutoff = new Date(Date.now() - THREE_DAYS_MS);
    const candidates = await cartModel.find({
        status: 'ABANDONED',
        reminder1SentAt: { $ne: null },
        reminder2SentAt: null,
        lastActivityAt: { $lte: cutoff },
        'items.0': { $exists: true },
    }).limit(50);

    let processedCount = 0;

    for (const cart of candidates) {
        const claimed = await cartModel.findOneAndUpdate(
            { _id: cart._id, reminder2SentAt: null, status: { $ne: 'CONVERTED' } },
            { $set: { reminder2SentAt: new Date() } },
            { new: true }
        );

        if (!claimed) continue;

        const user = await userModel.findById(cart.userId).select('email name');
        if (!user || !user.email) continue;

        const populatedItems = await buildPopulatedItems(cart.items);
        if (populatedItems.length === 0) continue;

        const html = abandonedCartEmailTemplate({
            user,
            items: populatedItems,
            cartUrl: `${process.env.FRONTEND_URL || 'https://aharyas.com'}/cart`,
            stage: 2,
        });

        try {
            await transporter.sendMail({
                from: `"Aharyas" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Still thinking about your Aharyas selection?',
                html,
            });
            processedCount++;
            logger.info(`[AbandonedCartWorker] Sent Stage 2 email to ${user.email} (cart: ${cart._id})`);
        } catch (mailErr) {
            logger.error(`[AbandonedCartWorker] Failed to send Stage 2 email to ${user.email}`, mailErr);
        }
    }

    return processedCount;
};

export const processAbandonedCartStage3 = async () => {
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
    const candidates = await cartModel.find({
        status: 'ABANDONED',
        reminder2SentAt: { $ne: null },
        reminder7SentAt: null,
        lastActivityAt: { $lte: cutoff },
        'items.0': { $exists: true },
    }).limit(50);

    let processedCount = 0;

    for (const cart of candidates) {
        const claimed = await cartModel.findOneAndUpdate(
            { _id: cart._id, reminder7SentAt: null, status: { $ne: 'CONVERTED' } },
            { $set: { reminder7SentAt: new Date(), status: 'EXPIRED' } },
            { new: true }
        );

        if (!claimed) continue;

        const user = await userModel.findById(cart.userId).select('email name');
        if (!user || !user.email) continue;

        const populatedItems = await buildPopulatedItems(cart.items);
        if (populatedItems.length === 0) continue;

        const html = abandonedCartEmailTemplate({
            user,
            items: populatedItems,
            cartUrl: `${process.env.FRONTEND_URL || 'https://aharyas.com'}/cart`,
            stage: 3,
        });

        try {
            await transporter.sendMail({
                from: `"Aharyas" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Your Aharyas selection is waiting',
                html,
            });
            processedCount++;
            logger.info(`[AbandonedCartWorker] Sent Stage 3 email to ${user.email} (cart: ${cart._id})`);
        } catch (mailErr) {
            logger.error(`[AbandonedCartWorker] Failed to send Stage 3 email to ${user.email}`, mailErr);
        }
    }

    return processedCount;
};

export const runAbandonedCartWorkerBatch = async () => {
    const count1 = await processAbandonedCartStage1();
    const count2 = await processAbandonedCartStage2();
    const count3 = await processAbandonedCartStage3();
    return { count1, count2, count3, total: count1 + count2 + count3 };
};
