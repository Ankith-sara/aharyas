'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '../../../context/ProductContext';
import { useAuth } from '../../../context/AuthContext';
import Title from '../../../components/Title';
import { api } from '../../../context/api';
import {
  Package, Truck, CheckCircle, Clock, MapPin, AlertCircle,
  ChevronDown, ChevronUp, Phone, Hash, CreditCard, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function TrackOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { currency } = useProducts();
  const { token } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const allStatuses = ['Order Placed', 'Processing', 'Shipping', 'Out for Delivery', 'Delivered'];

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!orderId) throw new Error("Missing order ID");
        const { data } = await api.get(`/api/v1/order/track/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (data.success) {
          setOrder(data.order);
        } else {
          throw new Error(data.message || 'Failed to load order');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order data');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, token]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Order Placed': return <CheckCircle size={14} />;
      case 'Processing': return <Package size={14} />;
      case 'Shipping':
      case 'Out for Delivery': return <Truck size={14} />;
      case 'Delivered': return <CheckCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-green-700 bg-green-50 border-green-200';
      case 'Out for Delivery':
      case 'Shipping': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Processing': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Cancelled': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const canCancelOrder = () => {
    if (!order) return false;
    return ['Order Placed', 'Processing'].includes(order.status);
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const response = await api.post('/api/v1/order/cancel-order', { orderId: order._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Order cancelled successfully');
        setOrder((prev: any) => ({ ...prev, status: 'Cancelled' }));
      } else {
        toast.error(response.data.message || 'Failed to cancel order');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
      setCancelModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black mt-16 py-20 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-400 animate-pulse">Loading tracking details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white text-black mt-16 py-20 px-4 text-center">
        <AlertCircle size={32} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-lg font-light mb-2">Order Not Found</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">{error || 'Could not find requested order.'}</p>
        <button onClick={() => router.push('/orders')} className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest">
          View All Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black mt-16 sm:mt-20 py-8 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto">
      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white max-w-sm w-full p-6">
            <h3 className="text-base font-light mb-2">Cancel Order?</h3>
            <p className="text-xs text-gray-500 mb-6">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(false)} className="flex-1 py-3 border text-xs uppercase">Keep</button>
              <button onClick={handleCancelOrder} disabled={cancelling} className="flex-1 py-3 bg-red-600 text-white text-xs uppercase">
                {cancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-2xl sm:text-3xl mb-8 text-center">
        <Title text1="TRACK" text2="ORDER" />
      </div>

      <div className="border border-gray-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-widest">Order ID</span>
            <p className="text-sm font-medium">{order._id}</p>
          </div>
          <span className={`px-3 py-1 border text-xs font-medium uppercase ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-700 mb-4">Items</h3>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="py-3 flex justify-between text-sm font-light">
                <span>{item.name} x {item.quantity} {item.size ? `(${item.size})` : ''}</span>
                <span>{currency}{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button onClick={() => router.push('/orders')} className="px-6 py-3 border text-xs uppercase">Back to Orders</button>
          {canCancelOrder() && (
            <button onClick={() => setCancelModal(true)} className="px-6 py-3 border border-red-300 text-red-600 text-xs uppercase">
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
