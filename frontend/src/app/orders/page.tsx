'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Title from '../../components/Title';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../context/api';
import { Package, Truck, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function OrdersPage() {
  const { currency, getProductUrl } = useProducts();
  const { token } = useAuth();
  const [orderData, setOrderData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrderData = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.post('/api/v1/order/userorders', {});
      if (response.data.success) {
        const allOrdersItem: any[] = [];
        response.data.orders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            item['status'] = order.status;
            item['payment'] = order.payment;
            item['paymentMethod'] = order.paymentMethod;
            item['date'] = order.date;
            item['orderId'] = order._id;
            allOrdersItem.push(item);
          });
        });
        setOrderData(allOrdersItem.reverse());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200">
            <CheckCircle2 size={13} /> Delivered
          </span>
        );
      case 'shipped':
      case 'out for delivery':
        return (
          <span className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 border border-blue-200">
            <Truck size={13} /> {status}
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 border border-red-200">
            <XCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-200">
            <Clock size={13} /> {status || 'Order Placed'}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white text-black mt-16 sm:mt-20 py-8 sm:py-12 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto">
      <div className="text-2xl sm:text-3xl mb-8">
        <Title text1="MY" text2="ORDERS" />
      </div>

      {loading ? (
        <div className="py-24 text-center border-t border-gray-200">
          <p className="text-xs text-gray-400 uppercase tracking-widest animate-pulse">Loading orders...</p>
        </div>
      ) : orderData.length === 0 ? (
        <div className="py-16 sm:py-24 text-center border-t border-gray-200">
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Package size={24} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-light tracking-wide text-black mb-2">No orders found</h2>
          <p className="text-xs text-gray-500 font-light max-w-sm mx-auto mb-8 leading-relaxed">
            You have not placed any orders yet. Discover our handcrafted products today.
          </p>
          <Link
            href="/shop/collection"
            className="inline-block px-8 py-3.5 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="border-t border-gray-200 divide-y divide-gray-200">
          {orderData.map((item, index) => (
            <div key={index} className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-4 sm:gap-6 items-start">
                <div className="w-20 h-24 sm:w-24 sm:h-28 bg-gray-50 flex-shrink-0 relative overflow-hidden border border-gray-100">
                  {item.images?.[0] && (
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-medium text-black leading-snug">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-light">
                    <span>{currency}{item.price}</span>
                    <span>Quantity: {item.quantity}</span>
                    {item.size && <span>Size: {item.size}</span>}
                  </div>
                  <p className="text-[11px] text-gray-400 font-light pt-1">
                    Date: <span className="text-gray-700">{new Date(item.date).toDateString()}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 font-light">
                    Payment: <span className="text-gray-700 uppercase">{item.paymentMethod}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4">
                {getStatusBadge(item.status)}
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadOrderData}
                    className="px-4 py-2 border border-gray-300 text-xs uppercase tracking-wider font-light hover:border-black transition-colors"
                  >
                    Track Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
