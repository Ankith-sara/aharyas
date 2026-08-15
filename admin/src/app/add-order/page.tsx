'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  ShoppingBag, User, MapPin, CreditCard, Search,
  Plus, Trash2, IndianRupee, Clock, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { backendUrl, currency } from '@/config';
import { useAuth } from '@/context/AuthContext';

const ORDER_STATUSES = [
  'Order Placed',
  'Processing',
  'Shipping',
  'Out of delivery',
  'Cancelled',
  'Delivered',
];

export default function AddOrderPage() {
  const { token } = useAuth();
  const router = useRouter();

  // Load products list for selection
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Shipping Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');

  // Order Items
  const [orderItems, setOrderItems] = useState<any[]>([]);

  // Selected Product details (Temporary selector state)
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [customPrice, setCustomPrice] = useState<any>('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Payment & status details
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentStatus, setPaymentStatus] = useState(false);
  const [orderStatus, setOrderStatus] = useState('Order Placed');

  const [submitting, setSubmitting] = useState(false);

  // Fetch product catalog on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await axios.get(`${backendUrl}/api/v1/product/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setProducts(res.data.products || []);
        } else {
          toast.error(res.data.message || 'Failed to load products');
        }
      } catch (err) {
        toast.error('Error fetching product catalog');
      } finally {
        setLoadingProducts(false);
      }
    };
    if (token) fetchProducts();
  }, [token]);

  // Filter products based on search term and sort by relevance
  const filteredProducts = products
    .filter(p =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.company?.toLowerCase().includes(productSearch.toLowerCase())
    )
    .map(p => {
      const nameLower = p.name?.toLowerCase() || '';
      const compLower = p.company?.toLowerCase() || '';
      const queryLower = productSearch.toLowerCase();
      
      let score = 999;
      const nameIndex = nameLower.indexOf(queryLower);
      const compIndex = compLower.indexOf(queryLower);

      if (nameIndex > -1) {
        score = nameIndex;
      } else if (compIndex > -1) {
        score = 100 + compIndex;
      }
      return { product: p, score };
    })
    .sort((a, b) => a.score - b.score)
    .map(item => item.product);

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setCustomPrice(product.price);
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize('');
    }
    setSelectedQty(1);
    setShowProductDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (selectedQty <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    const existingIndex = orderItems.findIndex(
      item => item.productId === selectedProduct._id && item.size === selectedSize
    );

    if (existingIndex > -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += Number(selectedQty);
      setOrderItems(updated);
      toast.success('Updated quantity of existing item');
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          image: selectedProduct.images?.[0] || '',
          size: selectedSize,
          quantity: Number(selectedQty),
          price: Number(customPrice),
          originalPrice: selectedProduct.price,
          discount: selectedProduct.price > Number(customPrice)
            ? Math.round(((selectedProduct.price - Number(customPrice)) / selectedProduct.price) * 100)
            : 0
        }
      ]);
      toast.success('Added item to order');
    }

    setSelectedProduct(null);
    setProductSearch('');
    setSelectedSize('');
    setSelectedQty(1);
    setCustomPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        address: {
          street,
          city,
          state,
          pincode,
          country
        },
        items: orderItems,
        amount: orderTotal,
        paymentMethod,
        payment: paymentStatus,
        status: orderStatus
      };

      const res = await axios.post(`${backendUrl}/api/v1/order/create-admin`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success('Order created successfully!');
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setStreet('');
        setCity('');
        setState('');
        setPincode('');
        setOrderItems([]);
        router.push('/orders');
      } else {
        toast.error(res.data.message || 'Failed to create order');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 sm:mb-12">
          <button
            onClick={() => router.push('/orders')}
            className="p-2 border border-gray-200 hover:border-black transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-light text-black mb-1 sm:mb-2 tracking-wide uppercase">
              Create New Order
            </h1>
            <div className="w-16 sm:w-20 h-0.5 bg-black" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Customer Details */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <User size={16} className="text-gray-600" />
              <h3 className="text-sm font-medium uppercase tracking-wide text-black">Customer Details</h3>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Customer Name *</label>
                <input
                  type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Customer Email *</label>
                <input
                  type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Customer Phone</label>
                <input
                  type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <MapPin size={16} className="text-gray-600" />
              <h3 className="text-sm font-medium uppercase tracking-wide text-black">Shipping Address</h3>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Street Address *</label>
                <input
                  type="text" required value={street} onChange={(e) => setStreet(e.target.value)}
                  placeholder="Building, street address"
                  className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">City *</label>
                  <input
                    type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">State *</label>
                  <input
                    type="text" required value={state} onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Pincode *</label>
                  <input
                    type="text" required value={pincode} onChange={(e) => setPincode(e.target.value)}
                    placeholder="Zip/PIN"
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Country *</label>
                  <input
                    type="text" required value={country} onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Products to Order */}
          <div className="bg-white border border-gray-200 overflow-visible relative z-20">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <ShoppingBag size={16} className="text-gray-600" />
              <h3 className="text-sm font-medium uppercase tracking-wide text-black">Product Item Selection</h3>
            </div>
            
            <div className="p-3 sm:p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Search Input */}
                <div className="sm:col-span-5 relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Search Catalog *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Type product name or brand..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                    />
                  </div>

                  {/* Dropdown */}
                  {showProductDropdown && productSearch && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-30 max-h-60 overflow-y-auto">
                      {loadingProducts ? (
                        <div className="p-3 text-center text-xs text-gray-400">Loading catalog...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-400">No products found</div>
                      ) : (
                        filteredProducts.map(p => (
                          <div
                            key={p._id}
                            onClick={() => handleSelectProduct(p)}
                            className="p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <img src={p.images?.[0]} alt={p.name} className="w-8 h-8 object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-black uppercase truncate">{p.name}</p>
                              <p className="text-[10px] text-gray-400 font-light uppercase tracking-wider">{p.company} • {currency}{p.price}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Product Sizes */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  >
                    <option value="">No Size</option>
                    {selectedProduct?.sizes?.map((size: string) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Qty</label>
                  <input
                    type="number" min="1" value={selectedQty} onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  />
                </div>

                {/* Custom price */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Price ({currency})</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                    <input
                      type="number" min="0" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full pl-7 pr-2 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Add button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-light uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {/* Order items summary list */}
              {orderItems.length > 0 && (
                <div className="border border-gray-200 mt-4 overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b border-gray-200">
                    <h4 className="text-xs font-medium text-black uppercase tracking-wide">Added Items ({orderItems.length})</h4>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-black uppercase truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-light">
                              Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''} • Price: {currency}{item.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="text-sm font-semibold text-black">{currency}{item.price * item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200 bg-white"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-600 font-light uppercase tracking-wider">Subtotal:</span>
                    <span className="text-base font-semibold text-black">{currency}{orderTotal}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Order Status */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-600" />
              <h3 className="text-sm font-medium uppercase tracking-wide text-black">Payment &amp; Status</h3>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm uppercase tracking-wide font-light"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Razorpay">Razorpay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Initial Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm uppercase tracking-wide font-light"
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status */}
              <div className="flex items-center gap-3 h-full sm:pt-6">
                <input
                  type="checkbox"
                  id="payment-status"
                  checked={paymentStatus}
                  onChange={() => setPaymentStatus(!paymentStatus)}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black flex-shrink-0"
                />
                <label
                  htmlFor="payment-status"
                  className="cursor-pointer flex items-center gap-2 text-black font-light uppercase tracking-wide text-xs sm:text-sm"
                >
                  <CheckCircle2 className="text-gray-600 flex-shrink-0" size={14} />
                  Mark as Paid
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push('/orders')}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-black text-xs font-light uppercase tracking-wider hover:border-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto sm:ml-auto px-8 py-3 bg-black text-white text-xs font-light uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Order…
                </>
              ) : (
                <>
                  <Clock size={14} /> Create Order
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
