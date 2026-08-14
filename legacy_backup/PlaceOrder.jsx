import { useState, useMemo, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  CreditCard, Home, ArrowLeft,
  MapPin, Mail, User, Package, ChevronDown, Search, ShieldCheck
} from 'lucide-react';
import { api } from '../context/api';

/* Reusable searchable dropdown */
const SearchableSelect = ({
  label, placeholder, options, value, onChange,
  disabled = false, required = false
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const filtered = useMemo(() =>
    options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="space-y-2" ref={ref}>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}{required && ' *'}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) { setOpen(o => !o); setQuery(''); } }}
          className={`w-full px-4 py-3 border bg-white text-left flex items-center justify-between transition-colors font-light text-sm
            ${disabled
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
              : 'border-gray-300 hover:border-gray-400 focus:outline-none focus:border-black cursor-pointer'}
            ${open ? 'border-black' : ''}`}
        >
          <span className={`flex items-center gap-2 ${selected ? 'text-black' : 'text-gray-400'}`}>
            {selected && selected.flagUrl && (
              <img src={selected.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
            )}
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 shadow-lg max-w-full overflow-hidden">
            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
              <Search size={12} className="text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="flex-1 text-xs focus:outline-none"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400">No results found</p>
              ) : filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value, opt.label); setQuery(''); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2
                    ${opt.value === value ? 'bg-gray-100 font-medium' : 'font-light'}`}
                >
                  {opt.flagUrl && (
                    <img src={opt.flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
                  )}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Dial code dropdown */
const DialCodeSelect = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const filtered = useMemo(() =>
    options.filter(o =>
      o.label.includes(query) ||
      o.country.toLowerCase().includes(query.toLowerCase())
    ),
    [options, query]
  );

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        className={`h-full px-3 py-3 border border-gray-300 bg-white flex items-center gap-1.5 hover:border-gray-400 transition-colors cursor-pointer min-w-[80px]
          ${open ? 'border-black' : ''}`}
      >
        {selected && selected.flagUrl && (
          <img src={selected.flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
        )}
        <span className="text-sm font-light text-black whitespace-nowrap">
          {selected ? `${selected.label}` : '+?'}
        </span>
        <ChevronDown size={12} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-45 bg-white border border-gray-200 shadow-lg w-64">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={12} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search country or code…"
              className="flex-1 text-xs focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400">No results</p>
            ) : filtered.map(opt => (
              <button
                key={`${opt.isoCode}-${opt.value}`}
                type="button"
                onClick={() => { onChange(opt.value); setQuery(''); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2
                  ${opt.value === value ? 'bg-gray-100 font-medium' : 'font-light'}`}
              >
                {opt.flagUrl && (
                  <img src={opt.flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
                )}
                <span>{opt.label}</span>
                <span className="text-gray-400 text-[10px] truncate ml-auto">{opt.country}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* Main PlaceOrder component */
const PlaceOrder = () => {
  const [method, setMethod] = useState('cod');
  const { products } = useProducts();
  const { cartItems, setCartItems, getCartAmount, delivery_fee, getDeliveryFee, appliedCoupon, clearCoupon } = useCart();
  const { navigate, token } = useAuth();
  const [formData, setFormData] = useState({
    Name: '', email: '', street: '', city: '',
    state: '', pincode: '', country: '', phone: '',
  });
  const [countryCode, setCountryCode] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [cityName, setCityName] = useState('');
  const [dialCode, setDialCode] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [geolocation, setGeolocation] = useState(null);
  const [csc, setCsc] = useState(null);

  // Dynamically import country-state-city to keep PlaceOrder bundle size small
  useEffect(() => {
    import('country-state-city').then(module => {
      setCsc(module);
    }).catch(err => {
      console.error('Failed to load country-state-city data', err);
    });
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        }
      );
    }
  }, []);

  const orderItems = useMemo(() => {
    let itemsList = [];
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          const product = products.find(p => p._id === items);
          if (product) {
            const effectivePrice = product.discount > 0
              ? Math.round(product.price * (1 - product.discount / 100))
              : product.price;
            itemsList.push({
              productId: product._id, name: product.name,
              price: effectivePrice, originalPrice: product.price,
              discount: product.discount || 0,
              quantity: cartItems[items][item], size: item,
              image: product.images?.[0] || null
            });
          }
        }
      }
    }
    return itemsList;
  }, [cartItems, products]);

  /* Option lists */
  const countryOptions = useMemo(() => {
    if (!csc) return [];
    return csc.Country.getAllCountries().map(c => ({
      value: c.isoCode,
      label: c.name,
      flagUrl: `https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`
    }));
  }, [csc]);

  const dialOptions = useMemo(() => {
    if (!csc) return [];
    return csc.Country.getAllCountries()
      .filter(c => c.phonecode)
      .map(c => {
        const code = c.phonecode.replace(/\D/g, '');
        return {
          value: code,
          isoCode: c.isoCode,
          label: `+${code}`,
          country: c.name,
          flagUrl: `https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`
        };
      })
      .filter(c => c.value)
      .filter((c, i, arr) => arr.findIndex(x => x.value === c.value) === i);
  }, [csc]);

  const stateOptions = useMemo(() => {
    if (!csc || !countryCode) return [];
    return csc.State.getStatesOfCountry(countryCode).map(s => ({ value: s.isoCode, label: s.name }));
  }, [csc, countryCode]);

  const cityOptions = useMemo(() => {
    if (!csc || !countryCode) return [];
    const list = stateCode
      ? csc.City.getCitiesOfState(countryCode, stateCode)
      : csc.City.getCitiesOfCountry(countryCode);
    return (list || []).map(c => ({ value: c.name, label: c.name }));
  }, [csc, countryCode, stateCode]);

  useEffect(() => {
    if (!token) {
      toast.error('Please log in to place an order.');
      navigate('/login');
      return;
    }
    const hasItems = Object.values(cartItems).some(s => Object.values(s).some(q => q > 0));
    if (!hasItems && !isLoading) navigate('/cart');
  }, [cartItems, token, navigate, isLoading]);

  /* Pre-fill from user profile */
  useEffect(() => {
    if (!csc) return;
    const fetchUser = async () => {
      try {
        const t = localStorage.getItem('token');
        if (!t) return;
        let decoded;
        try { decoded = jwtDecode(t); } catch { return; }
        const res = await api.get(`/api/v1/user/profile/${decoded.id}`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        if (res.data.success) {
          const u = res.data.user;
          const savedCountry = u.addresses?.[0]?.country || '';
          const savedState = u.addresses?.[0]?.state || '';
          const savedCity = u.addresses?.[0]?.city || '';

          const matchedCountry = csc.Country.getAllCountries().find(
            c => c.name.toLowerCase() === savedCountry.toLowerCase() || c.isoCode === savedCountry.toUpperCase()
          );
          const cCode = matchedCountry?.isoCode || '';

          const matchedState = cCode
            ? csc.State.getStatesOfCountry(cCode).find(
              s => s.name.toLowerCase() === savedState.toLowerCase() || s.isoCode === savedState.toUpperCase()
            )
            : null;

          setCountryCode(cCode);
          setStateCode(matchedState?.isoCode || '');
          setCityName(savedCity);

          // Parse saved phone: strip leading + and dial code
          const savedPhone = u.addresses?.[0]?.phone || '';
          const savedDial = cCode ? csc.Country.getCountryByCode(cCode)?.phonecode?.replace(/\D/g, '') : '91';
          let localPhone = savedPhone.replace(/\D/g, '');
          if (savedDial && localPhone.startsWith(savedDial)) localPhone = localPhone.slice(savedDial.length);
          if (savedDial) setDialCode(savedDial);
          setPhoneNumber(localPhone);

          setFormData(prev => ({
            ...prev,
            Name: u.name || '',
            email: u.email || '',
            street: u.addresses?.[0]?.address || '',
            city: savedCity,
            state: matchedState?.name || savedState,
            pincode: u.addresses?.[0]?.zip || '',
            country: matchedCountry?.name || savedCountry,
          }));
        }
      } catch (e) { console.error('Error fetching user:', e); }
    };
    fetchUser();
  }, [csc]);

  const onChangeHandler = e => {
    const { name, value } = e.target;
    setFormData(d => ({ ...d, [name]: value }));
  };

  const handleCountryChange = (isoCode, label) => {
    if (!csc) return;
    const name = label;
    setCountryCode(isoCode);
    setStateCode('');
    setCityName('');
    // auto-update dial code
    const countryData = csc.Country.getCountryByCode(isoCode);
    if (countryData?.phonecode) {
      setDialCode(countryData.phonecode.replace(/\D/g, ''));
    }
    setFormData(d => ({ ...d, country: name, state: '', city: '', pincode: '' }));
  };

  const handleStateChange = (isoCode, label) => {
    setStateCode(isoCode);
    setCityName('');
    setFormData(d => ({ ...d, state: label, city: '' }));
  };

  const handleCityChange = (val, label) => {
    setCityName(val);
    setFormData(d => ({ ...d, city: label }));
  };

  // Keep formData.phone in sync with dial code + local number
  useEffect(() => {
    setFormData(d => ({ ...d, phone: phoneNumber ? `+${dialCode}${phoneNumber}` : '' }));
  }, [dialCode, phoneNumber]);

  /* Dynamic shipping fee — based on country + state */
  const shippingFee = useMemo(() => {
    const subtotal = getCartAmount ? getCartAmount() : 0;
    if (subtotal === 0) return 0;
    return getDeliveryFee ? getDeliveryFee(formData.country, formData.state) : delivery_fee;
  }, [formData.country, formData.state, getCartAmount, getDeliveryFee, delivery_fee]);



  const subtotal = getCartAmount ? getCartAmount() : 0;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalAmount = subtotal === 0 ? 0 : subtotal + shippingFee - discount;

  function loadRazorpayScript(src) {
    return new Promise(resolve => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = src; s.onload = () => resolve(true); s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  const cancelPendingOrder = async (mongoOrderId) => {
    try {
      await api.post('/api/v1/order/cancel', { orderId: mongoOrderId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Ignore background cancel failure
    }
  };

  const initPay = async (razorpayOrder, mongoOrderId, userId, orderItems, totalAmount) => {
    const loaded = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!loaded) { toast.error('Failed to load payment gateway.'); setIsLoading(false); cancelPendingOrder(mongoOrderId); return; }
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount, currency: razorpayOrder.currency,
      name: 'Aharyas', description: 'Handcrafted with love', image: '/favicon.ico',
      order_id: razorpayOrder.id,
      handler: async (response) => {
        try {
          const verifyRes = await api.post(`/api/v1/order/verifyRazorpay`, {
            ...response, orderId: mongoOrderId, userId,
            items: orderItems, amount: totalAmount, address: {
              ...formData,
              geolocation: geolocation || null
            }
          }, { headers: { Authorization: `Bearer ${token}` } });
          if (verifyRes.data.success) {
            if (userId) saveAddressToProfile(userId);
            setCartItems({}); if (clearCoupon) clearCoupon();
            navigate('/orders'); toast.success('Payment successful! Your order has been placed.');
          } else { toast.error(verifyRes.data.message || 'Payment verification failed.'); }
        } catch { toast.error('Payment verification failed. Contact support if money was deducted.'); }
        finally { setIsLoading(false); }
      },
      modal: {
        ondismiss: () => {
          toast.info('Payment cancelled.');
          setIsLoading(false);
          cancelPendingOrder(mongoOrderId);
        }
      },
      prefill: { name: formData.Name, email: formData.email, contact: formData.phone },
      theme: { color: '#000000' }
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', r => {
      toast.error(`Payment failed: ${r.error.description}`);
      setIsLoading(false);
      cancelPendingOrder(mongoOrderId);
    });
    rzp.open();
  };

  // Save checkout address to user profile (fire-and-forget)
  const saveAddressToProfile = async (userId) => {
    try {
      const addressObj = {
        label: 'Checkout',
        address: formData.street || '',
        city: formData.city || '',
        state: formData.state || '',
        zip: formData.pincode || '',
        country: formData.country || '',
        phone: formData.phone || '',
      };
      await api.put(
        `/api/v1/user/address/${userId}`,
        { addressObj },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // Silently fail — address saving is a convenience, not critical
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!agreeToTerms) { toast.error('Please agree to our Terms & Conditions to proceed.'); return; }
    if (!formData.country) { toast.error('Please select a country.'); return; }
    if (!formData.city) { toast.error('Please select or enter a city.'); return; }
    if (!formData.pincode.trim()) { toast.error('Please enter a postal code.'); return; }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) { toast.error('Please enter a valid phone number.'); return; }

    setIsLoading(true);
    const decoded = (() => { try { return token ? jwtDecode(token) : null; } catch { return null; } })();
    const userId = decoded?.id || null;

    try {
      if (orderItems.length === 0) { toast.error('Your cart is empty.'); setIsLoading(false); return; }

      const orderData = {
        userId, address: {
          ...formData,
          geolocation: geolocation || null
        }, items: orderItems,
        amount: finalAmount, discount,
        couponCode: appliedCoupon ? appliedCoupon.code : null
      };

      switch (method) {
        case 'cod': {
          const headers = { Authorization: `Bearer ${token}` };
          const response = await api.post(`/api/v1/order/place`, orderData, { headers });
          if (response.data.success) {
            if (userId) saveAddressToProfile(userId);
            setCartItems({}); if (clearCoupon) clearCoupon();
            navigate('/orders');
            toast.success('Order placed!');
          } else { toast.error(response.data.message); }
          break;
        }
        case 'razorpay': {
          const rzHeaders = { Authorization: `Bearer ${token}` };
          const responseRazorpay = await api.post(`/api/v1/order/razorpay`, orderData, { headers: rzHeaders });
          if (responseRazorpay.data.success) {
            initPay(responseRazorpay.data.order, responseRazorpay.data.orderId, userId, orderItems, orderData.amount);
          } else { toast.error(responseRazorpay.data.message); }
          break;
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black mt-16">
      <section className="py-12 px-4 sm:px-8 md:px-10 lg:px-20">
        <div className="max-w-7xl mx-auto text-center mb-8">
          <div className="text-3xl mb-6"><Title text1="CHECKOUT" text2="DETAILS" /></div>
        </div>
      </section>

      <section className="px-3 sm:px-6 md:px-10 lg:px-20 pb-20 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full min-w-0">
          <form onSubmit={onSubmitHandler} className="w-full min-w-0 grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
            <div className="xl:hidden w-full bg-gray-50 border border-gray-200 rounded-sm overflow-hidden mb-2">
              <button
                type="button"
                onClick={() => setShowMobileSummary(!showMobileSummary)}
                className="w-full px-5 py-4 flex items-center justify-between text-xs font-light text-gray-700 hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-gray-400" />
                  <span className="uppercase tracking-wider">{showMobileSummary ? 'Hide Order Summary' : 'Show Order Summary'}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showMobileSummary ? 'rotate-180' : ''}`} />
                </div>
                <span className="font-semibold text-black tracking-wider text-sm">
                  ₹{finalAmount}
                </span>
              </button>

              {showMobileSummary && (
                <div className="p-6 border-t border-gray-200 bg-white space-y-6 animate-[fadeIn_0.3s_ease]">
                  {/* Dynamic Product Item List */}
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                    {orderItems.map((item, idx) => (
                      <div key={`${item.productId}-${item.size}-${idx}`} className="flex items-center gap-5 py-3.5 border-b border-gray-100 last:border-b-0">
                        <div className="relative w-14 h-18 bg-gray-50 border border-gray-100 flex-shrink-0 overflow-visible">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-sm" />
                          <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-light shadow-md z-10">
                            {item.quantity}
                          </span>
                        </div>
                        {/* Product details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-sm font-light text-gray-900 leading-relaxed truncate pr-2" title={item.name}>
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="inline-block text-[9px] text-gray-400 uppercase tracking-[0.12em] bg-gray-50 px-2 py-0.5 border border-gray-100 rounded-sm">
                              Size: {item.size}
                            </span>
                            <span className="text-[10px] text-gray-400 font-light">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-2">
                          <span className="text-xs sm:text-sm font-medium text-black tracking-wider">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <CartTotal overrideShipping={shippingFee} />
                  </div>
                </div>
              )}
            </div>

            {/* Left column */}
            <div className="w-full min-w-0 xl:col-span-3 space-y-6">
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Information</span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Personal details */}
                  <div className="space-y-4 relative z-20">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <User size={14} className="text-gray-400" /> Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name *</label>
                        <input onChange={onChangeHandler} name="Name" value={formData.Name}
                          className="w-full px-4 py-3 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors font-light"
                          type="text" placeholder="Your full name" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address *</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input onChange={onChangeHandler} name="email" value={formData.email}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors font-light"
                            type="email" placeholder="your@email.com" required />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number *</label>
                      <div className="flex items-stretch h-12 gap-0">
                        <DialCodeSelect
                          options={dialOptions}
                          value={dialCode}
                          onChange={setDialCode}
                        />
                        <input
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-4 py-3 border border-l-0 border-gray-300 bg-white focus:outline-none focus:border-black transition-colors font-light text-sm h-full"
                          type="tel"
                          placeholder="Phone number"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery address */}
                  <div className="space-y-4 pt-6 border-t border-gray-200 relative z-10">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" /> Delivery Address
                    </h3>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Street Address *</label>
                      <input onChange={onChangeHandler} name="street" value={formData.street}
                        className="w-full px-4 py-3 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors font-light"
                        type="text" placeholder="House number, street name, area" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
                      <SearchableSelect
                        label="Country" placeholder={csc ? "Select country" : "Loading countries..."}
                        options={countryOptions} value={countryCode}
                        onChange={handleCountryChange} required
                        disabled={!csc}
                      />
                      <div>
                        <SearchableSelect
                          label="State / Province"
                          placeholder={!csc ? 'Loading...' : countryCode ? (stateOptions.length ? 'Select state' : 'No states listed') : 'Select country first'}
                          options={stateOptions} value={stateCode}
                          onChange={handleStateChange}
                          disabled={!csc || !countryCode || stateOptions.length === 0}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      <SearchableSelect
                        label="City"
                        placeholder={!csc ? 'Loading...' : countryCode ? (cityOptions.length ? 'Select city' : 'No cities listed') : 'Select country first'}
                        options={cityOptions} value={cityName}
                        onChange={handleCityChange}
                        disabled={!csc || !countryCode || cityOptions.length === 0}
                        required
                      />
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Postal Code *</label>
                        <input onChange={onChangeHandler} name="pincode" value={formData.pincode}
                          className="w-full px-4 py-3 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors font-light"
                          type="text" maxLength={12}
                          placeholder={
                            countryCode === 'IN' ? 'e.g. 500032'
                              : countryCode === 'US' ? 'e.g. 90210'
                                : countryCode === 'GB' ? 'e.g. SW1A 1AA'
                                  : countryCode === 'CA' ? 'e.g. K1A 0A6'
                                    : 'Postal / ZIP code'}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-4">
                      <input type="checkbox" id="agree-terms" checked={agreeToTerms}
                        onChange={e => setAgreeToTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 text-black bg-white border-gray-300 focus:ring-black focus:ring-2 cursor-pointer" required />
                      <div className="flex-1">
                        <label htmlFor="agree-terms" className="block text-sm text-gray-700 cursor-pointer leading-relaxed font-light">
                          I agree to the{' '}
                          <a href="/termsconditions" target="_blank" className="text-black font-medium underline hover:text-gray-700">Terms & Conditions</a>,{' '}
                          <a href="/privacypolicy" target="_blank" className="text-black font-medium underline hover:text-gray-700">Privacy Policy</a>, and{' '}
                          <a href="/shippingpolicy" target="_blank" className="text-black font-medium underline hover:text-gray-700">Shipping Policy</a>.
                          I understand that orders are processed within 0-7 days and Aharya is not liable for courier delays. Support available at +91 9063284008 or aharyasofficial@gmail.com *
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification & Location Capture */}
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Verification</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    To prevent fraudulent and fake orders, we capture and verify your real phone number and order geolocation details.
                  </p>
                  <div className="bg-gray-50 p-4 border border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-light uppercase tracking-wider">Verification Phone:</span>
                      <span className="font-medium text-black">
                        {dialCode ? `+${dialCode} ` : ''}{phoneNumber || 'Enter phone number'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-light uppercase tracking-wider">Captured Location:</span>
                      <span className="font-medium text-black flex items-center gap-1">
                        {geolocation ? (
                          <>
                            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-ping mr-1" />
                            {geolocation.latitude?.toFixed(4)}, {geolocation.longitude?.toFixed(4)}
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse mr-1" />
                            Detecting approximate coordinates...
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <PaymentOption method={method} setMethod={setMethod} type="razorpay" logo={assets.razorpay_logo} />
                  <PaymentOption method={method} setMethod={setMethod} type="cod" />
                </div>
              </div>

              {/* Mobile-only checkout buttons container */}
              <div className="xl:hidden bg-white border border-gray-200 shadow-sm p-6 space-y-4">
                <button type="submit" disabled={isLoading || !agreeToTerms}
                  className={`w-full py-4 font-light tracking-wide transition-all duration-300 uppercase
                    ${!agreeToTerms ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}
                    disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span className="font-light">Processing...</span>
                    </div>
                  ) : 'Place Order'}
                </button>
                <button type="button" onClick={() => navigate('/cart')}
                  className="w-full py-4 border border-gray-300 text-black font-light tracking-wide hover:border-black hover:bg-gray-50 transition-all duration-300 uppercase">
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /><span>Back to Cart</span>
                  </div>
                </button>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-3 font-light">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="uppercase tracking-wider">Secure Checkout</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed text-center font-light">
                    Your information is protected with industry-standard encryption
                  </p>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="hidden xl:block w-full xl:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 shadow-sm sticky top-6">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Summary</span>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Dynamic Product Item List */}
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                    {orderItems.map((item, idx) => (
                      <div key={`${item.productId}-${item.size}-${idx}`} className="flex items-center gap-5 py-3.5 border-b border-gray-100 last:border-b-0">
                        <div className="relative w-14 h-18 bg-gray-50 border border-gray-100 flex-shrink-0 overflow-visible">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-sm" />
                        </div>
                        {/* Product details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-sm font-light text-gray-900 leading-relaxed pr-2" title={item.name}>
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="inline-block text-[9px] text-gray-400 uppercase tracking-[0.12em] bg-gray-50 px-2 py-0.5 border border-gray-100 rounded-sm">
                              Size: {item.size}
                            </span>
                            <span className="text-[10px] text-gray-400 font-light">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        {/* Product total price */}
                        <div className="text-right flex-shrink-0 pl-2">
                          <span className="text-xs sm:text-sm font-medium text-black tracking-wider">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Details */}
                  <div className="border-t border-gray-100 pt-6">
                    <CartTotal overrideShipping={shippingFee} />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <button type="submit" disabled={isLoading || !agreeToTerms}
                      className={`w-full py-4 font-light tracking-wide transition-all duration-300 uppercase
                        ${!agreeToTerms ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}>
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                          <span className="font-light">Processing...</span>
                        </div>
                      ) : 'Place Order'}
                    </button>
                    <button type="button" onClick={() => navigate('/cart')}
                      className="w-full py-4 border border-gray-300 text-black font-light tracking-wide hover:border-black hover:bg-gray-50 transition-all duration-300 uppercase">
                      <div className="flex items-center justify-center gap-2">
                        <ArrowLeft size={16} /><span>Back to Cart</span>
                      </div>
                    </button>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-3 font-light">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="uppercase tracking-wider">Secure Checkout</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed text-center font-light">
                      Your information is protected with industry-standard encryption
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>
      </section>
    </div>
  );
};

const PaymentOption = ({ method, setMethod, type, logo }) => (
  <div onClick={() => setMethod(type)}
    className={`flex items-center gap-4 p-4 border cursor-pointer transition-all duration-300 hover:shadow-sm
      ${method === type ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
    <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${method === type ? 'border-black' : 'border-gray-300'}`}>
      {method === type && <div className="w-2.5 h-2.5 bg-black" />}
    </div>
    {logo ? (
      <div className="flex items-center gap-3">
        <img className="h-6 object-contain" src={logo} alt={`${type} payment`} />
        <div className="flex flex-col">
          <span className="font-medium text-black capitalize tracking-wide">{type}</span>
          <span className="text-xs text-gray-500 font-light">Credit/Debit Cards, UPI, Net Banking, Wallets</span>
        </div>
      </div>
    ) : (
      <div className="flex items-center gap-3">
        <div className="bg-white p-2 border border-gray-200"><CreditCard size={18} className="text-gray-600" /></div>
        <div className="flex flex-col">
          <span className="font-medium text-black tracking-wide">Cash on Delivery</span>
          <span className="text-xs text-gray-500 font-light">Pay when you receive</span>
        </div>
      </div>
    )}
  </div>
);

export default PlaceOrder;