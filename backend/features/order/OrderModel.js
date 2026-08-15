import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },      
        originalPrice: { type: Number, default: null },
        discount: { type: Number, default: 0 },       
        size: { type: String },
        image: { type: String }
    }],
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, required: true, default: 'Order Placed' },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true, default: false },
    razorpayPaymentId: { type: String, default: null },
    date: { type: Number, required: true },
    deliveryOtp: { type: String, default: null, select: false },
    deliveryOtpHash: { type: String, default: null, select: false },
    deliveryOtpExpiresAt: { type: Date, default: null, select: false },
    deliveryOtpAttempts: { type: Number, default: 0 },
    deliveryOtpLockoutUntil: { type: Date, default: null },
    deliveryOtpVerified: { type: Boolean, default: false }
})

orderSchema.index({ userId: 1, date: -1 });

orderSchema.index({ status: 1, date: -1 });
orderSchema.index({ payment: 1 });
orderSchema.index({ date: -1 });
orderSchema.index({ 'items.productId': 1 });

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)

export default orderModel;
