'use client';

import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  ShoppingBag, User, MapPin, CreditCard, Package2, Filter, Search,
  CheckCircle, Clock, Truck, Package, PackageCheck, AlertCircle,
  Phone, Mail, IndianRupee, ChevronLeft, ChevronRight, TrendingUp,
  BarChart3, RefreshCw, Banknote, X, TriangleAlert, List, Kanban, LayoutGrid,
} from 'lucide-react';
import { backendUrl } from '../config';

// Constants
const ORDER_STATUSES = [
  'Order Placed',
  'Processing',
  'Shipping',
  'Out of delivery',
  'Delivered',
];

const STATUS_CONFIG = {
  'Order Placed': { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: Package },
  'Processing': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', icon: Clock },
  'Shipping': { color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', icon: Truck },
  'Out of delivery': { color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', icon: Package2 },
  'Delivered': { color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', icon: PackageCheck },
};

// StatusBadge 
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Order Placed'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-light uppercase tracking-wider whitespace-nowrap ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <Icon size={11} className="flex-shrink-0" />
      <span className="hidden sm:inline">{status}</span>
      <span className="sm:hidden">
        {status === 'Order Placed' ? 'Placed' : status === 'Out of delivery' ? 'Out' : status}
      </span>
    </span>
  );
};

// PaymentBadge
const PaymentBadge = ({ payment, paymentMethod }) => {
  const isCOD = paymentMethod === 'COD';

  if (payment) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{paymentMethod}</p>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-light uppercase tracking-wider w-full justify-center">
          <CheckCircle size={11} />
          {isCOD ? 'Cash Received' : 'Paid Online'}
        </span>
      </div>
    );
  }

  if (isCOD) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">COD</p>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-light uppercase tracking-wider w-full justify-center">
          <Banknote size={11} />
          Collect on Delivery
        </span>
        <p className="text-[10px] text-gray-400 font-light text-center leading-tight">
          Payment confirmed when marked Delivered
        </p>
      </div>
    );
  }

  // Online payment pending
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{paymentMethod}</p>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-light uppercase tracking-wider w-full justify-center">
        <AlertCircle size={11} />
        Payment Pending
      </span>
    </div>
  );
};

// StatusDropdown
const StatusDropdown = ({ order, onStatusChange, onCODDeliveryConfirm }) => {
  const handleChange = (e) => {
    const next = e.target.value;
    if (next === 'Delivered' && order.paymentMethod === 'COD' && !order.payment) {
      onCODDeliveryConfirm(order._id);
      return;
    }
    onStatusChange(order._id, next);
  };

  return (
    <select
      onChange={handleChange}
      value={order.status}
      className="w-full px-2 sm:px-3 py-2 sm:py-3 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-xs font-light uppercase tracking-wide"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
};

// COD Delivery Confirm Modal
const CODDeliveryModal = ({ orderId, onConfirm, onCancel }) =>
  ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 flex items-center justify-center flex-shrink-0">
              <PackageCheck size={16} className="text-green-700" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
              Confirm Delivery &amp; Payment
            </h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-black transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
            <Banknote size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-light leading-relaxed">
              This is a <span className="font-semibold">Cash on Delivery</span> order.
              Have you received the payment from the customer?
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confirming will:
            </p>
            <div className="space-y-1.5">
              {[
                { icon: PackageCheck, text: 'Mark order as Delivered', color: 'text-green-600' },
                { icon: Banknote, text: 'Mark payment as Received', color: 'text-green-600' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon size={13} className={`flex-shrink-0 ${color}`} />
                  <span className="text-sm text-gray-700 font-light">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex items-start gap-2.5">
            <TriangleAlert size={13} className="text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              This action cannot be undone. Only confirm if the customer has physically handed over the cash.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-light hover:bg-white transition-colors uppercase tracking-wide"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(orderId)}
            className="flex-1 py-2.5 bg-black text-white text-sm font-light hover:bg-gray-800 transition-colors uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <CheckCircle size={14} />
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

// OrderCard
const OrderCard = ({ order, onStatusChange, onCODDeliveryConfirm }) => (
  <div className="bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
    <div className="bg-gray-50 border-b border-gray-200 p-3 sm:p-6">
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <ShoppingBag size={15} className="text-gray-600 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-medium uppercase tracking-wide text-black leading-tight">
              Order #{order._id?.slice(-8).toUpperCase()}
            </h3>
            <p className="text-gray-400 mt-0.5 text-xs font-light tracking-wider" title={order._id}>
              ID: {order._id?.slice(-8).toUpperCase() ?? 'N/A'}
            </p>
            <p className="text-gray-500 mt-0.5 text-xs font-light uppercase tracking-wider">
              {new Date(order.date).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>
    </div>

    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
      {/* Items */}
      <div className="border border-gray-200 overflow-hidden">
        <div className="p-2.5 sm:p-4 border-b border-gray-100 bg-gray-50">
          <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
            <Package size={13} /> Items ({order.items.length})
          </h4>
        </div>
        <div className="p-2 sm:p-4">
          <div className="space-y-2 max-h-36 sm:max-h-48 overflow-y-auto">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-xs sm:text-sm uppercase tracking-wide">{item.name}</p>
                  <div className="flex items-center gap-2 sm:gap-4 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500 font-light uppercase">Qty: {item.quantity}</span>
                    {item.size && <span className="text-xs text-gray-500 font-light uppercase">Size: {item.size}</span>}
                    {item.discount > 0 && item.originalPrice ? (
                      <span className="flex items-center gap-1">
                        <span className="text-xs font-medium text-black">₹{item.price}</span>
                        <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                        <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1">{item.discount}% OFF</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-black">₹{item.price}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer + Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="border border-gray-200 overflow-hidden">
          <div className="p-2.5 sm:p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
              <User size={12} /> Customer
            </h4>
          </div>
          <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
            <p className="font-medium text-gray-900 uppercase tracking-wide text-xs sm:text-sm">{order.address.Name}</p>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Phone size={12} className="flex-shrink-0" />
              <span className="text-xs font-light">{order.address.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Mail size={12} className="flex-shrink-0" />
              <span className="text-xs font-light truncate">{order.address.email || order.guestEmail || '—'}</span>
            </div>
            {order.guestEmail && !order.userId && (
              <span className="inline-block text-[10px] px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 uppercase tracking-wider font-medium">
                Guest
              </span>
            )}
          </div>
        </div>

        <div className="border border-gray-200 overflow-hidden">
          <div className="p-2.5 sm:p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
              <MapPin size={12} /> Address
            </h4>
          </div>
          <div className="p-2.5 sm:p-4 space-y-0.5 text-xs text-gray-600 font-light">
            <p className="truncate">{order.address.street}</p>
            <p>{order.address.city}, {order.address.country}</p>
            <p className="font-medium uppercase tracking-wide">PIN: {order.address.pincode}</p>
          </div>
        </div>
      </div>

      {/* Payment | Amount | Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="border border-gray-200 overflow-hidden">
          <div className="p-2.5 sm:p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
              <CreditCard size={12} /> Payment
            </h4>
          </div>
          <div className="p-2.5 sm:p-4">
            <PaymentBadge payment={order.payment} paymentMethod={order.paymentMethod} />
          </div>
        </div>

        {/* Amount */}
        <div className="border border-gray-200 overflow-hidden">
          <div className="p-2.5 sm:p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
              <IndianRupee size={12} /> Amount
            </h4>
          </div>
          <div className="p-2.5 sm:p-4">
            <div className="flex items-center gap-0.5">
              <IndianRupee size={15} className="text-black" />
              <span className="text-lg sm:text-xl font-medium text-black">{order.amount}</span>
            </div>
          </div>
        </div>

        {/* Status dropdown */}
        <div className="border border-gray-200 overflow-hidden">
          <div className="p-2.5 sm:p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Package2 size={12} /> Update Status
            </h4>
          </div>
          <div className="p-2.5 sm:p-4">
            <StatusDropdown
              order={order}
              onStatusChange={onStatusChange}
              onCODDeliveryConfirm={onCODDeliveryConfirm}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Orders page 
const Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [codConfirmId, setCodConfirmId] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const ITEMS_PER_PAGE = 20;

  // Data fetching 
  const fetchAllOrders = useCallback(async () => {
    if (!token) { setAuthError(true); return; }
    setLoading(true); setAuthError(false);
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/order/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        const normalized = data.orders
          .map((o) => ({ ...o, status: o.status === 'Order placed' ? 'Order Placed' : o.status }))
          .sort((a, b) => Number(b.date) - Number(a.date));
        setOrders(normalized);
        setFilteredOrders(normalized);
      } else {
        toast.error(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) { setAuthError(true); toast.error('Session expired. Please log in again.'); }
      else if (status === 403) toast.error('Access denied.');
      else toast.error('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Status update
  const handleStatusChange = async (orderId, newStatus) => {
    setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/v1/order/status`,
        { orderId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) toast.success('Status updated');
      else { await fetchAllOrders(); toast.error(data.message || 'Failed to update status'); }
    } catch {
      await fetchAllOrders();
      toast.error('Failed to update status');
    }
  };

  // COD delivery confirmation
  const handleCODDeliveryConfirm = async (orderId) => {
    setCodConfirmId(null);
    setOrders((prev) =>
      prev.map((o) => o._id === orderId ? { ...o, status: 'Delivered', payment: true } : o)
    );
    try {
      const [statusRes, paymentRes] = await Promise.all([
        axios.post(`${backendUrl}/api/v1/order/status`,
          { orderId, status: 'Delivered' },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.post(`${backendUrl}/api/v1/order/updatePayment`,
          { orderId, payment: true },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);
      if (statusRes.data.success && paymentRes.data.success) {
        toast.success('Delivery confirmed & payment received');
      } else {
        await fetchAllOrders();
        toast.error('Partial update — please refresh');
      }
    } catch {
      await fetchAllOrders();
      toast.error('Failed to confirm delivery');
    }
  };

  // Filters 
  useEffect(() => {
    const s = searchTerm.toLowerCase().trim();
    const result = orders.filter((o) => {
      const matchSearch = !s || (
        o.address?.Name?.toLowerCase().includes(s) ||
        o.address?.phone?.includes(searchTerm) ||
        o.items?.some((i) => i.name?.toLowerCase().includes(s)) ||
        o.address?.city?.toLowerCase().includes(s)
      );
      const matchStatus = !statusFilter || o.status === statusFilter;
      const matchPayment = !paymentFilter || (paymentFilter === 'paid' ? o.payment : !o.payment);
      return matchSearch && matchStatus && matchPayment;
    });
    setFilteredOrders(result);
    setCurrentPage(1);
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  useEffect(() => { fetchAllOrders(); }, [fetchAllOrders]);

  // Pagination 
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const pageNumbers = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  })();

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'Order Placed').length,
    processing: orders.filter((o) => o.status === 'Processing').length,
    delivered: orders.filter((o) => o.status === 'Delivered').length,
    revenue: orders.filter((o) => o.payment).reduce((sum, o) => sum + parseFloat(o.amount || 0), 0),
  };

  // Auth error screen 
  if (authError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 p-6 sm:p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <h2 className="text-xl font-medium text-black mb-2 uppercase tracking-wide">Session Expired</h2>
          <p className="text-gray-600 mb-6 font-light text-sm">Please log in again to continue.</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-all duration-300 uppercase tracking-wide font-light text-sm">
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

      {/* COD delivery + payment confirm modal */}
      {codConfirmId && (
        <CODDeliveryModal
          orderId={codConfirmId}
          onConfirm={handleCODDeliveryConfirm}
          onCancel={() => setCodConfirmId(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-light text-black mb-2 sm:mb-3 tracking-wide uppercase">Order Management</h1>
          <div className="w-16 sm:w-20 h-0.5 bg-black mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600 font-light tracking-wide">
            Track, manage, and update all customer orders
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white border border-gray-200 mb-4 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <BarChart3 size={18} className="text-gray-600" />
              <h2 className="text-sm sm:text-lg font-medium uppercase tracking-wide text-black">Statistics</h2>
            </div>
          </div>
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
              {[
                { label: 'Total Orders', value: stats.total, icon: ShoppingBag },
                { label: 'Pending', value: stats.pending, icon: Clock },
                { label: 'Processing', value: stats.processing, icon: Package },
                { label: 'Delivered', value: stats.delivered, icon: PackageCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center p-3 sm:p-6 bg-gray-50 border border-gray-200">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Icon className="text-gray-600" size={18} />
                  </div>
                  <p className="text-xs text-gray-600 mb-1 sm:mb-2 uppercase tracking-wider font-light leading-tight">{label}</p>
                  <p className="text-2xl sm:text-3xl font-light text-black">{value}</p>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-1 text-center p-3 sm:p-6 bg-gray-50 border border-gray-200">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <TrendingUp className="text-gray-600" size={18} />
                </div>
                <p className="text-xs text-gray-600 mb-1 sm:mb-2 uppercase tracking-wider font-light">Revenue</p>
                <div className="flex items-center justify-center gap-0.5">
                  <IndianRupee size={15} className="text-black" />
                  <span className="text-xl sm:text-2xl font-light text-black">{stats.revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & filters */}
        <div className="bg-white border border-gray-200 mb-4 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Search size={18} className="text-gray-600" />
                <h2 className="text-sm sm:text-lg font-medium uppercase tracking-wide text-black">Search & Filter</h2>
              </div>
              <button onClick={fetchAllOrders} disabled={loading}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-black hover:bg-gray-800 text-white transition-all duration-300 disabled:opacity-50 uppercase tracking-wide text-xs font-light">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="text" placeholder="Customer, phone, product, location..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Status</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 appearance-none text-sm">
                    <option value="">All Status</option>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Payment</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 appearance-none text-sm">
                    <option value="">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-light">
                {filteredOrders.length > 0
                  ? `${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)} of ${filteredOrders.length} orders`
                  : '0 orders'}
              </p>
            </div>
          </div>
        </div>

        {/* Orders list */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShoppingBag size={18} className="text-gray-600" />
              <h2 className="text-sm sm:text-lg font-medium uppercase tracking-wide text-black">Customer Orders</h2>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white border border-gray-200 p-0.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                title="Kanban View"
                className={`px-3 py-2 text-xs font-light uppercase tracking-wider transition-colors ${viewMode === 'kanban' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}
              >
                <Kanban size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tiles')}
                title="Tiles View"
                className={`px-3 py-2 text-xs font-light uppercase tracking-wider transition-colors ${viewMode === 'tiles' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List View"
                className={`px-3 py-2 text-xs font-light uppercase tracking-wider transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600 font-light uppercase tracking-wide">Loading orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <ShoppingBag className="mx-auto text-gray-300 mb-4" size={52} />
                <h3 className="text-lg sm:text-xl font-medium text-black mb-2 uppercase tracking-wide">
                  {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto font-light px-4 mb-6">
                  {orders.length === 0
                    ? "Your store hasn't received any orders yet. Orders will appear here once customers start purchasing."
                    : 'Try clearing your filters to see all orders.'}
                </p>
                {orders.length === 0 ? (
                  <button onClick={fetchAllOrders} disabled={loading}
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 border border-gray-300 text-black text-sm uppercase tracking-wide font-light hover:border-black transition-all duration-300">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Check Again
                  </button>
                ) : (
                  <button onClick={() => { setSearchTerm(''); setStatusFilter(''); setPaymentFilter(''); }}
                    className="px-6 sm:px-8 py-3 bg-black text-white text-sm uppercase tracking-wide font-light hover:bg-gray-800 transition-all duration-300">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'tiles' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-2 lg:gap-4">
                      {currentItems.map((order, index) => (
                        <OrderCard
                          key={order._id ?? index}
                          order={order}
                          onStatusChange={handleStatusChange}
                          onCODDeliveryConfirm={setCodConfirmId}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4 sm:pt-6">
                        <p className="text-xs sm:text-sm text-gray-600 font-light order-2 sm:order-1">
                          Page <span className="font-medium text-black">{currentPage}</span> of{' '}
                          <span className="font-medium text-black">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                            className="p-1.5 sm:p-2 border border-gray-300 hover:border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                            <ChevronLeft size={15} />
                          </button>
                          <div className="flex gap-1">
                            {pageNumbers.map((page, i) =>
                              page === '...' ? (
                                <span key={`e-${i}`} className="px-2 py-1.5 text-gray-400 text-sm">…</span>
                              ) : (
                                <button key={page} onClick={() => goToPage(page)}
                                  className={`w-8 h-8 sm:w-9 sm:h-9 text-xs border transition-all duration-300 ${currentPage === page ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black hover:bg-gray-50'
                                    }`}>
                                  {page}
                                </button>
                              )
                            )}
                          </div>
                          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                            className="p-1.5 sm:p-2 border border-gray-300 hover:border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                            <ChevronRight size={15} />
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 font-light order-3">{filteredOrders.length} total</p>
                      </div>
                    )}
                  </>
                )}

                {viewMode === 'list' && (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {currentItems.map((order, index) => {
                        const isExpanded = expandedOrders.has(order._id);
                        return (
                          <div key={order._id ?? index} className="bg-white border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden">
                            <div
                              onClick={() => {
                                const newSet = new Set(expandedOrders);
                                if (newSet.has(order._id)) newSet.delete(order._id); else newSet.add(order._id);
                                setExpandedOrders(newSet);
                              }}
                              className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <ShoppingBag size={14} className="text-gray-600" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs sm:text-sm text-black">#{order._id?.slice(-8).toUpperCase()}</span>
                                    <span className="text-[10px] text-gray-400 font-light">
                                      {new Date(order.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide truncate max-w-[200px]">{order.address?.Name}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] text-gray-400 font-light uppercase">{order.items?.length} Item(s)</p>
                                  <p className="text-sm font-semibold text-black">₹{order.amount}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] text-gray-400 font-light uppercase">{order.paymentMethod}</p>
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${order.payment ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {order.payment ? 'Paid' : 'Unpaid'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={order.status} />
                                </div>
                              </div>
                            </div>

                            {/* Collapsible expanded detail view */}
                            {isExpanded && (
                              <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Items */}
                                  <div className="bg-white border border-gray-200 p-4 space-y-3">
                                    <h4 className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                                      <Package size={13} className="text-gray-600" /> Items
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 border border-gray-100">
                                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-black uppercase truncate">{item.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">
                                              Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''} • ₹{item.price}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Customer & Shipping info */}
                                  <div className="bg-white border border-gray-200 p-4 space-y-3">
                                    <h4 className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                                      <User size={13} className="text-gray-600" /> Customer &amp; Shipping
                                    </h4>
                                    <div className="text-xs text-gray-600 space-y-1.5 font-light">
                                      <p className="font-semibold text-black uppercase">{order.address?.Name}</p>
                                      <p>Phone: {order.address?.phone || '—'}</p>
                                      <p>Email: {order.address?.email || order.guestEmail || '—'}</p>
                                      <p className="border-t border-gray-100 pt-1.5 mt-1.5">
                                        Address: {order.address?.street}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}, {order.address?.country}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Status controls */}
                                <div className="bg-white border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                  <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                                    <div>
                                      <label className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Update Status</label>
                                      <StatusDropdown
                                        order={order}
                                        onStatusChange={handleStatusChange}
                                        onCODDeliveryConfirm={setCodConfirmId}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 h-full sm:pt-4">
                                      <input
                                        type="checkbox"
                                        id={`pay-status-${order._id}`}
                                        checked={order.payment}
                                        onChange={async () => {
                                          const newPay = !order.payment;
                                          setOrders(prev => prev.map(o => o._id === order._id ? { ...o, payment: newPay } : o));
                                          try {
                                            await axios.post(
                                              `${backendUrl}/api/v1/order/updatePayment`,
                                              { orderId: order._id, payment: newPay },
                                              { headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            toast.success('Payment status updated');
                                          } catch {
                                            setOrders(prev => prev.map(o => o._id === order._id ? { ...o, payment: !newPay } : o));
                                            toast.error('Failed to update payment status');
                                          }
                                        }}
                                        className="w-3.5 h-3.5 text-black border-gray-300 focus:ring-black flex-shrink-0"
                                      />
                                      <label htmlFor={`pay-status-${order._id}`} className="cursor-pointer text-xs text-gray-700 font-light uppercase tracking-wide">
                                        Mark Paid
                                      </label>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newSet = new Set(expandedOrders);
                                      newSet.delete(order._id);
                                      setExpandedOrders(newSet);
                                    }}
                                    className="text-xs text-gray-400 hover:text-black uppercase tracking-wider font-light border border-gray-200 px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
                                  >
                                    Close Details
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4 sm:pt-6">
                        <p className="text-xs sm:text-sm text-gray-600 font-light order-2 sm:order-1">
                          Page <span className="font-medium text-black">{currentPage}</span> of{' '}
                          <span className="font-medium text-black">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                            className="p-1.5 sm:p-2 border border-gray-300 hover:border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                            <ChevronLeft size={15} />
                          </button>
                          <div className="flex gap-1">
                            {pageNumbers.map((page, i) =>
                              page === '...' ? (
                                <span key={`e-${i}`} className="px-2 py-1.5 text-gray-400 text-sm">…</span>
                              ) : (
                                <button key={page} onClick={() => goToPage(page)}
                                  className={`w-8 h-8 sm:w-9 sm:h-9 text-xs border transition-all duration-300 ${currentPage === page ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black hover:bg-gray-50'
                                    }`}>
                                  {page}
                                </button>
                              )
                            )}
                          </div>
                          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                            className="p-1.5 sm:p-2 border border-gray-300 hover:border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                            <ChevronRight size={15} />
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 font-light order-3">{filteredOrders.length} total</p>
                      </div>
                    )}
                  </>
                )}

                {viewMode === 'kanban' && (
                  <div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-4 pt-1 select-none">
                    <div
                      className="grid grid-flow-col gap-3 sm:gap-4
                 auto-cols-[85%]
                 sm:auto-cols-[calc((100%-1rem)/2)]
                 lg:auto-cols-[calc((100%-2rem)/3)]"
                    >
                      {ORDER_STATUSES.map(colStatus => {
                        const colOrders = filteredOrders.filter(o => o.status === colStatus);
                        return (
                          <div key={colStatus} className="min-w-0 bg-gray-50 border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                              <h3 className="text-xs font-semibold text-black uppercase tracking-wider truncate">{colStatus}</h3>
                              <span className="text-[10px] bg-black text-white font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2">{colOrders.length}</span>
                            </div>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                              {colOrders.map(order => (
                                <div key={order._id} className="bg-white border border-gray-200 p-4 hover:shadow-md transition-all duration-300 relative group space-y-3">
                                  {/* Header Info */}
                                  <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <div>
                                      <span className="text-xs font-semibold text-black">#{order._id?.slice(-8).toUpperCase()}</span>
                                      <p className="text-[9px] text-gray-400 font-light mt-0.5">
                                        {new Date(order.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-semibold text-black">₹{order.amount}</p>
                                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${order.payment ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {order.payment ? 'Paid' : 'Unpaid'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Customer Details */}
                                  <div className="text-xs space-y-0.5 text-gray-600 font-light bg-gray-50 p-2 border border-gray-100">
                                    <p className="font-semibold text-black uppercase truncate">{order.address?.Name}</p>
                                    <p className="text-[10px]">Ph: {order.address?.phone || '—'}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{order.address?.email || order.guestEmail || '—'}</p>
                                  </div>

                                  {/* Product Items list */}
                                  <div className="space-y-1.5">
                                    {order.items?.slice(0, 2).map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2 bg-gray-50/50 p-1.5 border border-gray-100">
                                        <img src={item.image} alt={item.name} className="w-8 h-8 object-cover flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] font-semibold text-black uppercase truncate">{item.name}</p>
                                          <p className="text-[9px] text-gray-500 uppercase">
                                            Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                    {order.items?.length > 2 && (
                                      <p className="text-[9px] text-gray-400 italic text-center font-light">
                                        + {order.items.length - 2} more item(s)
                                      </p>
                                    )}
                                  </div>

                                  {/* Bottom controls */}
                                  <div className="flex gap-2 justify-between border-t border-gray-100 pt-2 items-center">
                                    <button
                                      type="button"
                                      disabled={ORDER_STATUSES.indexOf(colStatus) === 0}
                                      onClick={() => {
                                        const prevIdx = ORDER_STATUSES.indexOf(colStatus) - 1;
                                        handleStatusChange(order._id, ORDER_STATUSES[prevIdx]);
                                      }}
                                      className="p-1 border border-gray-200 hover:border-black disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
                                      title="Move Back"
                                    >
                                      <ChevronLeft size={12} />
                                    </button>

                                    <select
                                      value={order.status}
                                      onChange={(e) => {
                                        if (e.target.value === 'Delivered' && order.paymentMethod === 'COD' && !order.payment) {
                                          setCodConfirmId(order._id);
                                        } else {
                                          handleStatusChange(order._id, e.target.value);
                                        }
                                      }}
                                      className="text-[10px] border border-gray-200 font-light p-1 flex-1 min-w-0 uppercase bg-white focus:outline-none"
                                    >
                                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>

                                    <button
                                      type="button"
                                      disabled={ORDER_STATUSES.indexOf(colStatus) === ORDER_STATUSES.length - 1}
                                      onClick={() => {
                                        const nextStatus = ORDER_STATUSES[ORDER_STATUSES.indexOf(colStatus) + 1];
                                        if (nextStatus === 'Delivered' && order.paymentMethod === 'COD' && !order.payment) {
                                          setCodConfirmId(order._id);
                                        } else {
                                          handleStatusChange(order._id, nextStatus);
                                        }
                                      }}
                                      className="p-1 border border-gray-200 hover:border-black disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
                                      title="Move Forward"
                                    >
                                      <ChevronRight size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {colOrders.length === 0 && (
                                <div className="py-8 text-center text-xs text-gray-400 font-light italic bg-white border border-dashed border-gray-200">
                                  No orders
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;