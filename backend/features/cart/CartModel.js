import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    size: { type: String, required: true, default: 'N/A' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true, index: true },
    items: [cartItemSchema],
    status: {
        type: String,
        enum: ['ACTIVE', 'ABANDONED', 'CONVERTED', 'EXPIRED'],
        default: 'ACTIVE',
        required: true,
        index: true,
    },
    lastActivityAt: { type: Date, default: Date.now, required: true, index: true },
    abandonedAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
    reminder1SentAt: { type: Date, default: null, index: true },
    reminder2SentAt: { type: Date, default: null, index: true },
    reminder7SentAt: { type: Date, default: null, index: true },
}, { timestamps: true });

cartSchema.index({ status: 1, lastActivityAt: 1 });
cartSchema.index({ status: 1, reminder1SentAt: 1, lastActivityAt: 1 });
cartSchema.index({ status: 1, reminder2SentAt: 1, lastActivityAt: 1 });
cartSchema.index({ status: 1, reminder7SentAt: 1, lastActivityAt: 1 });

const cartModel = mongoose.models.cart || mongoose.model('cart', cartSchema);

export default cartModel;
