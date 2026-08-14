import express from 'express';
import authUser from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import { validatePlaceOrder, validateOrderIdParam } from '../middlewares/validate.js';
import { authenticatedLimiter } from '../middlewares/rateLimiter.js';
import {
    placeOrder, placeOrderRazorpay, verifyRazorpay, verifyCOD, allOrders, userOrders, updateStatus,
    orderStatus, updatePaymentStatus, verifyDeliveryOtp, cancelPendingOrder, cancelOrder, createOrderAdmin
} from '../controllers/OrderController.js';

const orderRouter = express.Router();

orderRouter.post('/place', authUser, authenticatedLimiter, validatePlaceOrder, placeOrder);
orderRouter.post('/razorpay', authUser, authenticatedLimiter, validatePlaceOrder, placeOrderRazorpay);
orderRouter.post('/verifyRazorpay', authUser, verifyRazorpay);
orderRouter.post('/verifyCOD', authUser, verifyCOD);
orderRouter.post('/userorders', authUser, userOrders);
orderRouter.get('/track/:orderId', authUser, validateOrderIdParam, orderStatus);
orderRouter.get('/status/:orderId', authUser, validateOrderIdParam, orderStatus);
orderRouter.get('/list', adminAuth, allOrders);
orderRouter.post('/status', adminAuth, updateStatus);
orderRouter.post('/updatePayment', adminAuth, updatePaymentStatus);
orderRouter.post('/create-admin', adminAuth, createOrderAdmin);
orderRouter.post('/verifyDelivery', verifyDeliveryOtp);
orderRouter.post('/cancel', authUser, cancelPendingOrder);
orderRouter.post('/cancel-order', authUser, cancelOrder);

export default orderRouter;