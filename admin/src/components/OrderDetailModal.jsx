'use client';

import ReactDOM from "react-dom";
import {
    X, Package, Clock, Truck, Package2, PackageCheck, Calendar, User, Phone,
    Mail, MapPin, CreditCard, IndianRupee, CheckCircle, AlertCircle
} from "lucide-react";

const statusConfig = {
    "Order Placed": { color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", icon: Package },
    "Processing": { color: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500", icon: Clock },
    "Shipping": { color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500", icon: Truck },
    "Out of delivery": { color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", icon: Package2 },
    "Delivered": { color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500", icon: PackageCheck },
};

const OrderDetailModal = ({ order, orderNumber, onClose }) => {
    if (!order) return null;

    const cfg = statusConfig[order.status] || statusConfig["Order Placed"];
    const StatusIcon = cfg.icon;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-gray-200 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-sm sm:text-base font-medium text-black uppercase tracking-wide">
                            Order #{orderNumber}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-light tracking-wider mt-0.5">
                            ID: {order._id ? order._id.toUpperCase() : "N/A"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 border text-xs font-light uppercase tracking-wider ${cfg.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                            <StatusIcon size={11} />
                            {order.status}
                        </span>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 transition-colors" aria-label="Close">
                            <X size={18} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    {/* Status + Date row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-light uppercase tracking-wider">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 border text-xs font-light uppercase tracking-wider sm:hidden ${cfg.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {order.status}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(order.date).toLocaleDateString("en-US", {
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit"
                            })}
                        </span>
                    </div>

                    {/* Order Items */}
                    <div className="border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-100 px-3 sm:px-4 py-2.5 flex items-center gap-1.5">
                            <Package size={13} className="text-gray-600" />
                            <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                Items ({order.items?.length || 0})
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 border border-gray-100 flex items-center justify-center bg-gray-50">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="max-w-full max-h-full object-contain"
                                            onError={e => { e.target.style.display = "none"; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-black truncate uppercase tracking-wide">{item.name}</p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                            <span className="text-[10px] sm:text-xs text-gray-500 font-light uppercase">Qty: {item.quantity}</span>
                                            {item.size && (
                                                <span className="text-[10px] sm:text-xs text-gray-500 font-light uppercase">Size: {item.size}</span>
                                            )}
                                            {item.discount > 0 && item.originalPrice ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="text-[10px] sm:text-xs font-medium text-black">₹{item.price}</span>
                                                    <span className="text-[10px] text-gray-400 line-through">₹{item.originalPrice}</span>
                                                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1">{item.discount}% OFF</span>
                                                </span>
                                            ) : (
                                                <span className="text-[10px] sm:text-xs font-medium text-black">₹{item.price}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Customer + Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-100 px-3 sm:px-4 py-2.5 flex items-center gap-1.5">
                                <User size={13} className="text-gray-600" />
                                <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Customer</h3>
                            </div>
                            <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                                <p className="text-xs sm:text-sm font-medium text-black uppercase tracking-wide">{order.address?.Name}</p>
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <Phone size={11} className="flex-shrink-0" />
                                    <span className="text-xs font-light">{order.address?.phone}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <Mail size={11} className="flex-shrink-0" />
                                    <span className="text-xs font-light truncate">{order.address?.email || order.guestEmail || "—"}</span>
                                </div>
                                {order.guestEmail && !order.userId && (
                                    <span className="inline-block text-[10px] px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 uppercase tracking-wider font-medium">
                                        Guest
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-100 px-3 sm:px-4 py-2.5 flex items-center gap-1.5">
                                <MapPin size={13} className="text-gray-600" />
                                <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Address</h3>
                            </div>
                            <div className="p-3 sm:p-4 space-y-1 text-xs text-gray-600 font-light">
                                <p className="truncate">{order.address?.street}</p>
                                <p>{order.address?.city}, {order.address?.country}</p>
                                <p className="font-medium uppercase tracking-wide">PIN: {order.address?.pincode}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment + Amount */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-100 px-3 sm:px-4 py-2.5 flex items-center gap-1.5">
                                <CreditCard size={13} className="text-gray-600" />
                                <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Payment</h3>
                            </div>
                            <div className="p-3 sm:p-4 space-y-1.5">
                                <p className="text-xs text-gray-500 font-light uppercase tracking-wider">{order.paymentMethod}</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-light uppercase tracking-wide ${order.payment
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}>
                                    {order.payment ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                                    {order.payment ? "Paid" : "Pending"}
                                </span>
                            </div>
                        </div>
                        <div className="border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-100 px-3 sm:px-4 py-2.5 flex items-center gap-1.5">
                                <IndianRupee size={13} className="text-gray-600" />
                                <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Amount</h3>
                            </div>
                            <div className="p-3 sm:p-4 flex items-center gap-0.5">
                                <IndianRupee size={16} className="text-black" />
                                <span className="text-xl sm:text-2xl font-light text-black">{order.amount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-black text-white text-xs font-light uppercase tracking-wide hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OrderDetailModal;