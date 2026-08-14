import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import Title from '../components/Title';
import { api } from '../context/api';
import {
  Truck, Package, CheckCircle, RefreshCw, ShoppingBag, Calendar, 
  CreditCard, Hash, ChevronDown, TrendingUp, Box, ArrowRight, IndianRupee, XCircle
} from 'lucide-react';
import usePageMeta from '../components/usePageMeta';
import { toast } from 'react-toastify';

const Orders = () => {
  const { currency } = useProducts();
  const { token } = useAuth();
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, itemName: '' });
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        if (!token) return;

        setLoading(true);
        const response = await api.post(
          '/api/v1/order/userorders',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          let allOrdersItem = [];
          for (const order of response.data.orders) {
            for (const [itemIdx, item] of order.items.entries()) {
              item['status'] = order.status;
              item['payment'] = order.payment;
              item['paymentMethod'] = order.paymentMethod;
              item['date'] = order.date;
              item['orderId'] = order._id || `ORD-${Date.now()}-${itemIdx}`;
              item['amount'] = order.amount;
              allOrdersItem.push(item);
            }
          }
          setOrderData(allOrdersItem.reverse());
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [token]);

  usePageMeta({ 
    title: 'Order History', description: 'Track and manage all your Aharyas orders.' 
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canCancelOrder = (status) => {
    const cancellable = ['order placed', 'processing'];
    return cancellable.includes(status?.toLowerCase());
  };

  const handleCancelOrder = async () => {
    if (!cancelModal.orderId) return;
    setCancelling(true);
    try {
      const response = await api.post(
        '/api/v1/order/cancel-order',
        { orderId: cancelModal.orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Order cancelled successfully');
        setOrderData(prev =>
          prev.map(item =>
            item.orderId === cancelModal.orderId
              ? { ...item, status: 'Cancelled' }
              : item
          )
        );
      } else {
        toast.error(response.data.message || 'Failed to cancel order');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
      setCancelModal({ open: false, orderId: null, itemName: '' });
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle size={14} className="sm:w-4 sm:h-4 text-green-600" />;
      case 'shipped':
      case 'out for delivery':
        return <Truck size={14} className="sm:w-4 sm:h-4 text-blue-600" />;
      case 'processing':
        return <RefreshCw size={14} className="sm:w-4 sm:h-4 text-amber-600" />;
      case 'cancelled':
        return <XCircle size={14} className="sm:w-4 sm:h-4 text-red-600" />;
      default:
        return <Package size={14} className="sm:w-4 sm:h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'shipped':
      case 'out for delivery':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'cancelled':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getFilteredOrders = () => {
    let filtered = orderData;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order =>
        order.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    if (sortOrder === 'newest') {
      filtered = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOrder === 'oldest') {
      filtered = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const getOrderStats = () => {
    const total = orderData.length;
    const delivered = orderData.filter(item => item.status?.toLowerCase() === 'delivered').length;
    const processing = orderData.filter(item =>
      item.status?.toLowerCase() === 'processing' ||
      item.status?.toLowerCase() === 'shipped' ||
      item.status?.toLowerCase() === 'out for delivery'
    ).length;
    const totalSpent = orderData.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return { total, delivered, processing, totalSpent };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black mt-16">
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .shimmer-gradient {
              background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite ease-in-out;
            }
          `
        }} />
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-20 animate-pulse">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-2xl sm:text-3xl mb-4 sm:mb-6">
                <Title text1="ORDER" text2="HISTORY" />
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-zinc-100 p-4 sm:p-6 bg-white">
                  <div className="flex gap-4">
                    <div className="shimmer-gradient w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="shimmer-gradient h-4 w-3/4" />
                      <div className="shimmer-gradient h-3 w-1/2" />
                      <div className="shimmer-gradient h-3 w-1/3" />
                    </div>
                    <div className="shimmer-gradient h-6 w-20 rounded-none flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black mt-16">
      {/* Cancel Order Confirmation Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !cancelling && setCancelModal({ open: false, orderId: null, itemName: '' })} />
          <div className="relative bg-white w-full max-w-sm shadow-2xl sm:rounded-sm z-10 flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle size={15} className="text-red-500" />
                <h2 className="text-md font-medium tracking-wide uppercase">Cancel Order</h2>
              </div>
              <button
                onClick={() => !cancelling && setCancelModal({ open: false, orderId: null, itemName: '' })}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              >
                <span className="text-lg">&times;</span>
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Are you sure you want to cancel your order for <span className="font-medium text-black">{cancelModal.itemName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setCancelModal({ open: false, orderId: null, itemName: '' })}
                disabled={cancelling}
                className="flex-1 py-3 border border-gray-300 text-black font-light hover:bg-gray-50 transition-all uppercase text-sm disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-500 text-white font-light hover:bg-red-600 transition-all uppercase text-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
              <Title text1="ORDER" text2="HISTORY" />
            </div>
            {orderData.length > 0 && (
              <p className="text-xs sm:text-sm md:text-base text-gray-500 font-light">
                Track and manage your {orderData.length} order{orderData.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Order Stats Cards */}
          {orderData.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <Box size={16} className="sm:w-5 sm:h-5 text-gray-600" />
                  <span className="text-lg sm:text-2xl md:text-3xl font-medium text-black">{stats.total}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-light uppercase tracking-wider">Total Orders</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <CheckCircle size={16} className="sm:w-5 sm:h-5 text-gray-600" />
                  <span className="text-lg sm:text-2xl md:text-3xl font-medium text-gray-700">{stats.delivered}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-light uppercase tracking-wider">Delivered</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <TrendingUp size={16} className="sm:w-5 sm:h-5 text-gray-600" />
                  <span className="text-lg sm:text-2xl md:text-3xl font-medium text-gray-700">{stats.processing}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-light uppercase tracking-wider">In Transit</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-white border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <IndianRupee size={16} className="sm:w-5 sm:h-5 text-gray-600" />
                  <span className="text-base sm:text-xl md:text-2xl font-medium text-gray-700">{currency}{stats.totalSpent.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-light uppercase tracking-wider">Total Spent</p>
              </div>
            </div>
          )}

          {orderData.length > 0 && (
            <>
              {/* Filters and Sort */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All Orders' },
                    { key: 'delivered', label: 'Delivered' },
                    { key: 'processing', label: 'Processing' },
                    { key: 'shipped', label: 'Shipped' },
                    { key: 'cancelled', label: 'Cancelled' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterStatus(key)}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-light tracking-wide border transition-all duration-300 ${filterStatus === key
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black active:bg-gray-50'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-xs sm:text-sm font-light text-gray-500 tracking-wide hidden sm:inline">SORT BY:</span>
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="appearance-none w-full border border-gray-300 bg-white px-3 sm:px-4 py-2 pr-8 sm:pr-10 font-light tracking-wide focus:border-black focus:outline-none transition-colors text-xs sm:text-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    <ChevronDown size={14} className="sm:w-4 sm:h-4 absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Orders Content */}
      <section className="px-4 sm:px-6 lg:px-20 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          {orderData.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-white border border-gray-200 shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-gray-300 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <ShoppingBag size={24} className="sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <div className="text-center max-w-md mb-6 sm:mb-8 px-4">
                <h3 className="text-xl sm:text-2xl font-medium mb-2 sm:mb-3 tracking-wide">NO ORDERS YET</h3>
                <p className="text-sm sm:text-base text-gray-600 font-light leading-relaxed">
                  Your order history is empty. Start exploring our amazing collection and place your first order.
                </p>
              </div>
              <button
                onClick={() => navigate('/shop/collection')}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 active:bg-gray-900 transition-all duration-300 text-sm sm:text-base"
              >
                BROWSE PRODUCTS
              </button>
            </div>
          ) : (
            // Orders List
            <div className="space-y-4 sm:space-y-6">
              {filteredOrders.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group">
                  <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Hash size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">ORDER ID:</span>
                            <span className="font-medium text-black tracking-wide text-xs sm:text-sm truncate">{item.orderId}</span>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Calendar size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-600 font-light">{formatDate(item.date)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <IndianRupee size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">ORDER TOTAL:</span>
                            <span className="font-semibold text-black tracking-wide text-xs sm:text-sm">{currency}{item.amount?.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {getStatusIcon(item.status)}
                          <span className={`px-2 sm:px-3 py-1 border text-[10px] sm:text-xs font-medium uppercase tracking-wider ${getStatusColor(item.status)}`}>
                            {item.status || 'Processing'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 sm:hidden">
                        <CreditCard size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 font-light">{item.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-3 sm:p-4 md:p-6">
                    <div className="flex gap-3 sm:gap-4 md:gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32">
                          <img
                            className="w-full h-full object-contain"
                            src={item.image || item.images?.[0]}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = '/api/placeholder/160/160';
                            }}
                          />
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-2 sm:space-y-3">
                          <div>
                            <h3 className="font-medium text-sm sm:text-base md:text-lg text-black tracking-wide group-hover:text-gray-700 transition-colors line-clamp-2"> {item.name}</h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div className="space-y-0.5">
                              <span className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</span>
                              {item.discount > 0 && item.originalPrice ? (
                                <div>
                                  <span className="font-medium text-black text-xs sm:text-sm">{currency}{item.price.toLocaleString("en-IN")}</span>
                                  <span className="text-[10px] text-gray-400 line-through ml-1">{currency}{item.originalPrice}</span>
                                </div>
                              ) : (
                                <span className="font-medium text-black text-xs sm:text-sm">{currency}{item.price.toLocaleString("en-IN")}</span>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <span className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">QTY</span>
                              <span className="font-medium text-black text-xs sm:text-sm">{item.quantity}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">SIZE</span>
                              <span className="font-medium text-black text-xs sm:text-sm">{item.size}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="block text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</span>
                              <span className="font-medium text-black text-sm sm:text-base">
                                {currency}{(item.price * item.quantity).toFixed(2).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
                          <button
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-black text-white font-light tracking-wide hover:bg-gray-800 active:bg-gray-900 transition-all duration-300 text-xs sm:text-sm"
                            onClick={() => navigate(`/trackorder/${item.orderId}`)}
                          >
                            <Truck size={14} className="sm:w-4 sm:h-4" />
                            <span>TRACK ORDER</span>
                          </button>
                          {canCancelOrder(item.status) && (
                            <button
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 border border-red-300 text-red-600 font-light tracking-wide hover:bg-red-50 hover:border-red-400 active:bg-red-100 transition-all duration-300 text-xs sm:text-sm"
                              onClick={() => setCancelModal({ open: true, orderId: item.orderId, itemName: item.name })}
                            >
                              <XCircle size={14} className="sm:w-4 sm:h-4" />
                              <span>CANCEL ORDER</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue Shopping Section */}
              <div className="mt-8 sm:mt-12 bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-6 sm:p-8 text-center">
                <h3 className="text-xl sm:text-2xl font-medium text-black mb-2 sm:mb-3 tracking-wide">WANT TO ORDER MORE?</h3>
                <p className="text-sm sm:text-base text-gray-600 font-light leading-relaxed mb-4 sm:mb-6 max-w-md mx-auto">
                  Discover new arrivals and trending products in our carefully curated collection
                </p>
                <button
                  onClick={() => navigate('/shop/collection')}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 active:bg-gray-900 transition-all duration-300 text-sm sm:text-base"
                >
                  <span>CONTINUE SHOPPING</span>
                  <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Contact Information Section */}
          <div className="mt-8 sm:mt-12 bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-medium text-black mb-2 tracking-wide">NEED HELP WITH YOUR ORDER?</h3>
              <p className="text-sm sm:text-base text-gray-600 font-light leading-relaxed">
                Our customer service team is here to assist you
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Phone Contact */}
              <div className="bg-white border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-black" />
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-black">Call Us</h4>
                </div>
                <div className="space-y-2 text-sm sm:text-base text-gray-700 font-light">
                  <p className="font-medium text-black">+91 9063284008</p>
                  <p className="font-medium text-black">+91 91211 57804</p>
                  <p className="text-xs sm:text-sm text-gray-500">Mon - Sat: 9 AM - 6 PM</p>
                </div>
              </div>

              {/* Email Contact */}
              <div className="bg-white border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard size={20} className="text-black" />
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-black">Email Us</h4>
                </div>
                <div className="space-y-2 text-sm sm:text-base text-gray-700 font-light">
                  <p className="font-medium text-black break-all">aharyasofficial@gmail.com</p>
                  <p className="text-xs sm:text-sm text-gray-500">We respond within 24 hours</p>
                </div>
              </div>

              {/* Visit Contact Page */}
              <div className="bg-white border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={20} className="text-black" />
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-black">Contact Page</h4>
                </div>
                <p className="text-sm sm:text-base text-gray-700 font-light mb-4">
                  Visit our contact page for more ways to reach us
                </p>
                <button
                  onClick={() => navigate('/contact')}
                  className="w-full px-4 py-2 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-all duration-300 text-xs sm:text-sm"
                >
                  VISIT CONTACT PAGE
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Orders;