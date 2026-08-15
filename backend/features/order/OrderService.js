import orderModel from './OrderModel.js';
import userModel from '../user/UserModel.js';
import productModel from '../product/ProductModel.js';
import { markCartAsConverted } from '../cart/AbandonedCartService.js';

const fetchAndMigrateUserOrders = async (userId) => {
    const orders = await orderModel.find({
        userId,
        $or: [
            { paymentMethod: 'COD' },
            { paymentMethod: 'Razorpay', payment: true }
        ]
    }).sort({ date: -1 });

    return orders;
};

const verifyAndFinaliseRazorpayOrder = async ({
    orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, crypto, userId
}) => {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) {
        const e = new Error('Invalid payment signature'); e.statusCode = 400; throw e;
    }

    // Always require orderId — remove the dangerous fallback entirely
    if (!orderId) {
        const e = new Error('orderId is required for payment verification');
        e.statusCode = 400; throw e;
    }

    const order = await orderModel.findById(orderId);
    if (!order) { const e = new Error('Order not found'); e.statusCode = 404; throw e; }

    // IDOR validation: order must belong to the authenticated user
    if (order.userId && order.userId.toString() !== userId) {
        const e = new Error('Access denied. You do not own this order.');
        e.statusCode = 403; throw e;
    }

    if (order.payment) return order; // already verified — idempotent

    await orderModel.findByIdAndUpdate(orderId,
        { payment: true, status: 'Order Placed', razorpayPaymentId: razorpay_payment_id });
    if (order.userId) {
        await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
        await markCartAsConverted(order.userId);
    }

    return order;
};

const getSellerAnalytics = async (adminId) => {
    const products = await productModel.find({ adminId }, '_id category name images price').lean();
    const productIds = products.map(p => p._id);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();

    const [summary, monthly, topProducts] = await Promise.all([

        // 1. Summary stats — one aggregation pass
        orderModel.aggregate([
            {
                $match: {
                    'items.productId': { $in: productIds },
                    $or: [
                        { paymentMethod: 'COD' },
                        { paymentMethod: 'Razorpay', payment: true }
                    ]
                }
            },
            { $unwind: '$items' },
            { $match: { 'items.productId': { $in: productIds } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $cond: ['$payment', { $multiply: ['$items.price', '$items.quantity'] }, 0] } },
                    totalOrders: { $addToSet: '$_id' },
                    completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
                    todayRevenue: { $sum: { $cond: [{ $and: ['$payment', { $gte: ['$date', todayStart] }] }, { $multiply: ['$items.price', '$items.quantity'] }, 0] } },
                }
            },
            {
                $project: {
                    totalRevenue: 1, completedOrders: 1, todayRevenue: 1,
                    totalOrders: { $size: '$totalOrders' }
                }
            }
        ]),

        // 2. Monthly breakdown
        orderModel.aggregate([
            { $match: { payment: true, date: { $gte: twelveMonthsAgo }, 'items.productId': { $in: productIds } } },
            { $unwind: '$items' },
            { $match: { 'items.productId': { $in: productIds } } },
            {
                $group: {
                    _id: { year: { $year: { $toDate: '$date' } }, month: { $month: { $toDate: '$date' } } },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    orders: { $addToSet: '$_id' },
                }
            },
            { $project: { revenue: 1, orders: { $size: '$orders' } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),

        // 3. Top 5 products by units sold
        orderModel.aggregate([
            {
                $match: {
                    'items.productId': { $in: productIds },
                    $or: [
                        { paymentMethod: 'COD' },
                        { paymentMethod: 'Razorpay', payment: true }
                    ]
                }
            },
            { $unwind: '$items' },
            { $match: { 'items.productId': { $in: productIds } } },
            { 
                $group: { 
                    _id: '$items.productId', 
                    sold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                } 
            },
            { $sort: { sold: -1 } }, { $limit: 5 }
        ])
    ]);

    const s = summary[0] || {};
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));
    const categoryMap = {};
    products.forEach(p => { categoryMap[p.category] = (categoryMap[p.category] || 0) + 1; });

    return {
        analytics: {
            totalRevenue: s.totalRevenue || 0,
            totalOrders: s.totalOrders || 0,
            completedOrders: s.completedOrders || 0,
            pendingOrders: (s.totalOrders || 0) - (s.completedOrders || 0),
            todayRevenue: s.todayRevenue || 0,
            avgOrderValue: s.totalOrders > 0 ? Math.round((s.totalRevenue || 0) / s.totalOrders) : 0,
            monthlySales: monthly,
            categoryBreakdown: Object.entries(categoryMap).map(([_id, count]) => ({ _id, count })),
            topProducts: topProducts.map(t => ({ ...productMap[t._id.toString()], sold: t.sold, revenue: t.revenue })),
        }
    };
};

export { fetchAndMigrateUserOrders, verifyAndFinaliseRazorpayOrder, getSellerAnalytics };
