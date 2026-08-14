'use client';

import { useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { api } from '../../context/api';
import { toast } from 'react-toastify';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setCartItems } = useCart();

  const success = searchParams.get('success');
  const orderId = searchParams.get('orderId');

  const verifyPayment = useCallback(async () => {
    try {
      if (!orderId) return;

      const response = await api.post('/api/v1/order/verifyStripe', { success, orderId });
      if (response.data.success) {
        setCartItems({});
        toast.success('Payment completed successfully!');
        router.push('/orders');
      } else {
        toast.error('Payment verification failed.');
        router.push('/cart');
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification error');
      router.push('/cart');
    }
  }, [success, orderId, setCartItems, router]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  return (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs uppercase tracking-widest text-gray-500 font-light">
        Verifying your payment...
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center py-24">
      <Suspense fallback={
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-gray-500 font-light">Loading verification...</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
