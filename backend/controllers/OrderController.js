import userModel from '../models/UserModel.js';
import orderModel from '../models/OrderModel.js';
import productModel from '../models/ProductModel.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import logger from '../config/logger.js';
import sendOrderEmails, { sendShippingEmail, sendDeliveryOtpEmail, sendDeliveredEmail } from '../middlewares/sendOrderMail.js';
import { fetchAndMigrateUserOrders, verifyAndFinaliseRazorpayOrder } from '../services/OrderService.js';
import { trackOrderPlaced, trackCheckoutStarted } from '../services/AnalyticsService.js';
import { emitToAdmins } from '../config/socket.js';
import { handleError } from './utils.js';
dotenv.config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Shared helpers 
const sendOrderNotifications = async (order, user) => {
    try { await sendOrderEmails(order, user); }
    catch (err) { logger.error('Email sending failed', err); }
};

const resolveEmailRecipient = async (order) => {
    return userModel.findById(order.userId);
};

const calculateOrderDetails = async (items, address, couponCode) => {
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
        const product = await productModel.findById(item.productId);
        if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
        }
        if (!product.visible) {
            throw new Error(`Product not available: ${product.name}`);
        }

        const effectivePrice = product.discount > 0
            ? Math.round(product.price * (1 - product.discount / 100))
            : product.price;

        subtotal += effectivePrice * item.quantity;

        verifiedItems.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            price: effectivePrice,
            originalPrice: product.price,
            discount: product.discount || 0,
            size: item.size || 'N/A',
            image: product.images?.[0] || null
        });
    }

    // Calculate delivery fee
    const country = (address?.country || '').trim().toLowerCase();
    const state = (address?.state || '').trim().toLowerCase();
    const INDIA_ALIASES = ["india", "in", "bharat", "ind"];
    const TELANGANA_ALIASES = ["telangana", "tg", "ts"];

    let deliveryFee = 100; // default India
    if (country && !INDIA_ALIASES.includes(country)) {
        deliveryFee = 150; // International
    } else if (TELANGANA_ALIASES.includes(state)) {
        deliveryFee = 50; // Telangana
    }

    // Calculate coupon discount
    let discount = 0;
    if (couponCode) {
        const cCode = couponCode.trim().toUpperCase();
        if (cCode === 'FLAT500' && subtotal >= 4000) {
            discount = 500;
        } else if (cCode === 'FLAT1000' && subtotal >= 7000) {
            discount = 1000;
        }
    }

    const calculatedAmount = subtotal + deliveryFee - discount;

    return {
        items: verifiedItems,
        amount: calculatedAmount > 0 ? calculatedAmount : 0,
    };
};

// Controllers 
const placeOrder = async (req, res) => {
    try {
        const { userId, items, address, couponCode } = req.body;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Authentication required. Please log in to place an order.' });
        if (!items || !address)
            return res.status(400).json({ success: false, message: 'Missing required fields: items or address' });

        const verifiedDetails = await calculateOrderDetails(items, address, couponCode);

        const newOrder = await orderModel.create({
            userId, items: verifiedDetails.items, amount: verifiedDetails.amount, address,
            paymentMethod: 'COD', payment: false, date: Date.now(),
        });

        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Track analytics
        const orderCount = await trackOrderPlaced(newOrder._id);
        emitToAdmins('order:placed', { orderId: newOrder._id, todayOrders: orderCount });

        const recipient = await userModel.findById(userId);
        if (recipient?.email) await sendOrderNotifications(newOrder, recipient);

        res.status(201).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        handleError(res, error, 'placeOrder');
    }
};

const verifyCOD = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId)
            return res.status(400).json({ success: false, message: 'Order ID required' });

        const order = await orderModel.findById(orderId);
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.paymentMethod !== 'COD')
            return res.status(400).json({ success: false, message: 'Invalid payment method for this verification' });

        res.json({ success: true, message: 'COD Order confirmed', order });
    } catch (error) {
        handleError(res, error, 'verifyCOD');
    }
};

const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, address, couponCode } = req.body;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Authentication required. Please log in to place an order.' });
        if (!items || !address)
            return res.status(400).json({ success: false, message: 'Missing required fields: items or address' });

        const verifiedDetails = await calculateOrderDetails(items, address, couponCode);

        const newOrder = await orderModel.create({
            userId, items: verifiedDetails.items, amount: verifiedDetails.amount, address,
            paymentMethod: 'Razorpay', payment: false, status: 'Payment Pending', date: Date.now(),
        });

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: verifiedDetails.amount * 100,
            currency: 'INR',
            receipt: `receipt_${newOrder._id}`,
            notes: { orderId: newOrder._id.toString() },
        });

        // Track checkout started
        const checkoutCount = await trackCheckoutStarted();
        emitToAdmins('checkout:started', { todayCheckouts: checkoutCount });

        res.json({ success: true, order: razorpayOrder, orderId: newOrder._id });
    } catch (error) {
        handleError(res, error, 'placeOrderRazorpay');
    }
};

const verifyRazorpay = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (orderId && !razorpay_payment_id) {
            const order = await orderModel.findById(orderId);
            if (!order)
                return res.status(404).json({ success: false, message: 'Order not found' });
            if (order.userId && order.userId.toString() !== req.body.userId)
                return res.status(403).json({ success: false, message: 'Access denied. You do not own this order.' });
            if (order.payment)
                return res.json({ success: true, message: 'Payment already verified', order });
            return res.json({ success: false, message: 'Payment verification pending' });
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
            return res.status(400).json({ success: false, message: 'Missing payment verification details' });

        const order = await verifyAndFinaliseRazorpayOrder({
            orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, crypto,
            userId: req.body.userId,
        });

        // Track analytics for successful Razorpay payment
        const rzpOrderCount = await trackOrderPlaced(order._id);
        emitToAdmins('order:placed', { orderId: order._id, todayOrders: rzpOrderCount });

        const recipient = await resolveEmailRecipient(order);
        if (recipient?.email) await sendOrderNotifications(order, recipient);

        res.json({ success: true, message: 'Payment verified & order confirmed', orderId: order._id });
    } catch (error) {
        handleError(res, error, 'verifyRazorpay');
    }
};

const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({
            $or: [
                { paymentMethod: 'COD' },
                { paymentMethod: 'Razorpay', payment: true }
            ]
        }).sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        handleError(res, error, 'allOrders');
    }
};

const userOrders = async (req, res) => {
    try {
        const orders = await fetchAndMigrateUserOrders(req.body.userId);
        res.json({ success: true, orders });
    } catch (error) {
        handleError(res, error, 'userOrders');
    }
};

const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const oldOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: false });
        if (!oldOrder)
            return res.status(404).json({ success: false, message: 'Order not found' });

        const statusChanged = oldOrder.status !== status;
        if (oldOrder.userId && statusChanged) {
            const user = await userModel.findById(oldOrder.userId, 'email name').lean();
            if (user?.email) {
                const updatedOrder = { ...oldOrder.toObject(), status };
                if (status === 'Shipping') {
                    // Generate a 6-digit delivery OTP and save it hashed on the order
                    const rawOtp = crypto.randomInt(100000, 1000000).toString();
                    await orderModel.findByIdAndUpdate(orderId, { deliveryOtp: rawOtp, deliveryOtpVerified: false });
                    sendShippingEmail(updatedOrder, user).catch((e) => logger.error('Shipping email failed', e));
                    sendDeliveryOtpEmail(updatedOrder, user, rawOtp).catch((e) => logger.error('Delivery OTP email failed', e));
                }
                if (status === 'Delivered') sendDeliveredEmail(updatedOrder, user).catch((e) => logger.error('Delivered email failed', e));
            }
        }

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        handleError(res, error, 'updateStatus');
    }
};

const orderStatus = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.orderId);
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });

        const requestingUserId = req.user?._id?.toString();
        const isAdmin = req.user?.role === 'admin';
        const isOwner = order.userId && order.userId.toString() === requestingUserId;

        if (!isAdmin && !isOwner)
            return res.status(403).json({ success: false, message: 'Access denied.' });

        if (order.paymentMethod === 'Razorpay' && !order.payment && !isAdmin)
            return res.status(403).json({ success: false, message: 'Order payment is pending.' });

        res.json({ success: true, order });
    } catch (error) {
        handleError(res, error, 'orderStatus');
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId, payment } = req.body;
        if (!orderId || payment === undefined)
            return res.status(400).json({ success: false, message: 'orderId and payment are required' });

        const order = await orderModel.findByIdAndUpdate(orderId, { payment }, { new: true });
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });

        res.json({ success: true, message: `Payment marked as ${payment ? 'paid' : 'pending'}`, order });
    } catch (error) {
        handleError(res, error, 'updatePaymentStatus');
    }
};

// Delivery person submits OTP to confirm delivery
const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, otp } = req.body;
        if (!orderId || !otp)
            return res.status(400).json({ success: false, message: 'orderId and otp are required' });

        const order = await orderModel.findById(orderId).select('+deliveryOtp');
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.deliveryOtpVerified)
            return res.json({ success: true, message: 'Delivery already verified' });
        if (!order.deliveryOtp)
            return res.status(400).json({ success: false, message: 'No delivery OTP set for this order' });
        if (order.deliveryOtp !== otp)
            return res.status(401).json({ success: false, message: 'Invalid delivery OTP' });

        await orderModel.findByIdAndUpdate(orderId, {
            status: 'Delivered',
            deliveryOtpVerified: true,
            deliveryOtp: null,
        });

        if (order.userId) {
            const user = await userModel.findById(order.userId, 'email name').lean();
            if (user?.email) sendDeliveredEmail(order, user).catch((e) => logger.error('Delivered email after OTP failed', e));
        }

        res.json({ success: true, message: 'Delivery confirmed successfully' });
    } catch (error) {
        handleError(res, error, 'verifyDeliveryOtp');
    }
};

// Cancel an unpaid Razorpay order (user dismissed or payment failed)
const cancelPendingOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId)
            return res.status(400).json({ success: false, message: 'orderId is required' });

        const order = await orderModel.findById(orderId);
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });

        // Only the order owner can cancel
        if (order.userId.toString() !== req.body.userId)
            return res.status(403).json({ success: false, message: 'Access denied' });

        // Only allow cancelling unpaid Razorpay orders
        if (order.paymentMethod !== 'Razorpay' || order.payment === true)
            return res.status(400).json({ success: false, message: 'Only unpaid Razorpay orders can be cancelled' });

        await orderModel.findByIdAndDelete(orderId);
        logger.info(`Cancelled pending Razorpay order ${orderId} for user ${req.body.userId}`);

        res.json({ success: true, message: 'Pending order cancelled' });
    } catch (error) {
        handleError(res, error, 'cancelPendingOrder');
    }
};

// Cancel an order by the user (before shipping)
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId)
            return res.status(400).json({ success: false, message: 'orderId is required' });

        const order = await orderModel.findById(orderId);
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });

        // Only the order owner can cancel
        if (order.userId.toString() !== req.body.userId)
            return res.status(403).json({ success: false, message: 'Access denied' });

        // Only allow cancelling orders that haven't shipped yet
        const cancellableStatuses = ['Order Placed', 'Processing'];
        if (!cancellableStatuses.includes(order.status))
            return res.status(400).json({ success: false, message: `Cannot cancel order with status "${order.status}". Only orders that haven't shipped can be cancelled.` });

        await orderModel.findByIdAndUpdate(orderId, { status: 'Cancelled' });
        logger.info(`Order ${orderId} cancelled by user ${req.body.userId}`);

        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        handleError(res, error, 'cancelOrder');
    }
};

const createOrderAdmin = async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, address, items, amount, paymentMethod, payment, status } = req.body;

        if (!customerName || !customerEmail || !items || items.length === 0 || amount === undefined || !address) {
            return res.status(400).json({ success: false, message: 'Missing required fields: customerName, customerEmail, items, amount, or address' });
        }

        // Find or create customer
        let user = await userModel.findOne({ email: customerEmail.toLowerCase() });
        if (!user) {
            user = await userModel.create({
                name: customerName,
                email: customerEmail.toLowerCase(),
                isVerified: true
            });
        }

        // Setup the address object.
        const orderAddress = {
            Name: customerName,
            phone: customerPhone || address.phone || '',
            email: customerEmail.toLowerCase(),
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || address.zipcode || '',
            country: address.country || 'India'
        };

        const newOrder = await orderModel.create({
            userId: user._id,
            items,
            amount,
            address: orderAddress,
            paymentMethod: paymentMethod || 'COD',
            payment: payment !== undefined ? payment : false,
            status: status || 'Order Placed',
            date: Date.now()
        });

        // Send order notification emails
        if (user.email) {
            sendOrderNotifications(newOrder, user).catch((err) => logger.error('Admin order email notification failed', err));
        }

        res.status(201).json({ success: true, message: 'Order created successfully by admin', order: newOrder });
    } catch (error) {
        handleError(res, error, 'createOrderAdmin');
    }
};

export {
    verifyRazorpay, verifyCOD, placeOrder, placeOrderRazorpay, allOrders,
    userOrders, updateStatus, orderStatus, updatePaymentStatus, verifyDeliveryOtp,
    cancelPendingOrder, cancelOrder, createOrderAdmin,
};