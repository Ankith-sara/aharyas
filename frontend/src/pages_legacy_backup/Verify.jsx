import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../context/api';

const Verify = () => {
    const { navigate, token } = useAuth();
    const { setCartItems } = useCart();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);

    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');
    const paymentMethod = searchParams.get('paymentMethod');

    useEffect(() => {
        const verifyRazorpayPayment = async () => {
            try {
                const response = await api.post(
                    `/api/v1/order/verifyrazorpay`,
                    { orderId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data && response.data.success) {
                    toast.success("Payment verified successfully!");
                    setCartItems({});
                    setTimeout(() => navigate('/orders'), 2000);
                } else {
                    toast.error("Payment verification failed. Redirecting to cart...");
                    setTimeout(() => navigate('/cart'), 2000);
                }
            } catch (error) {
                console.error("Razorpay Verification Error:", error);
                toast.error("Payment verification failed. Redirecting to cart...");
                setTimeout(() => navigate('/cart'), 2000);
            } finally {
                setLoading(false);
            }
        };

        const verifyCODOrder = async () => {
            try {
                const response = await api.post(
                    `/api/v1/order/verifycod`,
                    { orderId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data && response.data.success) {
                    toast.success("Order placed successfully!");
                    setCartItems({});
                    setTimeout(() => navigate('/orders'), 2000);
                } else {
                    toast.error("Order verification failed. Redirecting to cart...");
                    setTimeout(() => navigate('/cart'), 2000);
                }
            } catch (error) {
                console.error("COD Verification Error:", error);
                toast.error("Order verification failed. Redirecting to cart...");
                setTimeout(() => navigate('/cart'), 2000);
            } finally {
                setLoading(false);
            }
        };

        const verifyPayment = async () => {
            if (!token) {
                toast.error("Please login to continue");
                navigate('/login');
                return;
            }

            if (!orderId) {
                toast.error("Invalid Order ID. Redirecting...");
                setTimeout(() => navigate('/cart'), 2000);
                return;
            }

            // Route to appropriate verification based on payment method
            switch (paymentMethod?.toLowerCase()) {
                case 'razorpay':
                    await verifyRazorpayPayment();
                    break;
                case 'cod':
                    await verifyCODOrder();
                    break;
                default:
                    // If no payment method specified, try to detect from success param
                    if (success !== null) {
                        await verifyRazorpayPayment();
                    } else {
                        toast.error("Invalid payment method");
                        setTimeout(() => navigate('/cart'), 2000);
                        setLoading(false);
                    }
            }
        };

        if (token && orderId) {
            verifyPayment();
        }
    }, [token, orderId, navigate, paymentMethod, success, setCartItems]);

    return (
        <div className='min-h-screen flex items-center justify-center'>
            <div className='text-center'>
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        <p className="text-gray-600 text-lg">
                            {paymentMethod === 'cod' 
                                ? 'Confirming your order...' 
                                : 'Verifying payment...'}
                        </p>
                        <p className="text-gray-400 text-sm">Please wait, do not close this page</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-gray-900 font-semibold text-lg">Verification Complete!</p>
                        <p className="text-gray-600">Redirecting to your orders...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Verify;