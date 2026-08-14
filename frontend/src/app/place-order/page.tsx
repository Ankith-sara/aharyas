'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Title from '../../components/Title';
import CartTotal from '../../components/CartTotal';
import { assets } from '../../assets/assets';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  CreditCard, Home, ArrowLeft,
  MapPin, Mail, User, Package, ChevronDown, Search, ShieldCheck
} from 'lucide-react';
import { api } from '../../context/api';
import { Country, State, City } from 'country-state-city';

const SearchableSelect = ({
  label, placeholder, options, value, onChange,
  disabled = false, required = false
}: any) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() =>
    options.filter((o: any) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  const selected = options.find((o: any) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
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
          className={`w-full px-4 py-3 border bg-white text-left flex items-center justify-between transition-colors font-light text-sm ${
            disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          } ${open ? 'border-black' : ''}`}
        >
          <span className={`flex items-center gap-2 ${selected ? 'text-black' : 'text-gray-400'}`}>
            {selected?.flagUrl && (
              <img src={selected.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
            )}
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-black shadow-xl max-h-60 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full text-xs py-1 focus:outline-none font-light"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-400 font-light text-center">No results found</div>
              ) : (
                filtered.map((o: any) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-light hover:bg-gray-50 flex items-center gap-2.5 transition-colors ${
                      o.value === value ? 'bg-gray-50 font-normal text-black' : 'text-gray-700'
                    }`}
                  >
                    {o.flagUrl && <img src={o.flagUrl} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />}
                    <span>{o.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PlaceOrderPage() {
  const router = useRouter();
  const { products, currency, backendUrl } = useProducts();
  const { cartItems, getCartAmount, setCartItems } = useCart();
  const { token, user } = useAuth();

  const [method, setMethod] = useState('cod');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: user?.email || '', street: '',
    city: '', state: '', zipcode: '', country: 'IN', phone: ''
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [loading, setLoading] = useState(false);

  const countryOptions = useMemo(() =>
    Country.getAllCountries().map(c => ({
      value: c.isoCode,
      label: c.name,
      flagUrl: `https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`
    })),
    []
  );

  const stateOptions = useMemo(() => {
    if (!formData.country) return [];
    return State.getStatesOfCountry(formData.country).map(s => ({
      value: s.isoCode,
      label: s.name
    }));
  }, [formData.country]);

  const cityOptions = useMemo(() => {
    if (!formData.country || !formData.state) return [];
    return City.getCitiesOfState(formData.country, formData.state).map(c => ({
      value: c.name,
      label: c.name
    }));
  }, [formData.country, formData.state]);

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(data => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast.error('Please login to place an order');
      router.push('/login');
      return;
    }

    try {
      const orderItems: any[] = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items)) as any;
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      if (orderItems.length === 0) {
        toast.error('Your cart is empty');
        return;
      }

      const orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + 50
      };

      setLoading(true);

      switch (method) {
        case 'cod': {
          const response = await api.post('/api/v1/order/place', orderData);
          if (response.data.success) {
            setCartItems({});
            toast.success('Order placed successfully!');
            router.push('/orders');
          } else {
            toast.error(response.data.message);
          }
          break;
        }

        case 'stripe': {
          const responseStripe = await api.post('/api/v1/order/stripe', orderData);
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(responseStripe.data.message);
          }
          break;
        }

        case 'razorpay': {
          const responseRazorpay = await api.post('/api/v1/order/razorpay', orderData);
          if (responseRazorpay.data.success) {
            const options = {
              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              amount: responseRazorpay.data.order.amount,
              currency: responseRazorpay.data.order.currency,
              name: 'Aharyas',
              description: 'Order Payment',
              order_id: responseRazorpay.data.order.id,
              handler: async (res: any) => {
                try {
                  const verifyRes = await api.post('/api/v1/order/verifyRazorpay', res);
                  if (verifyRes.data.success) {
                    setCartItems({});
                    toast.success('Payment successful!');
                    router.push('/orders');
                  } else {
                    toast.error(verifyRes.data.message);
                  }
                } catch (err: any) {
                  toast.error(err.message);
                }
              }
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
          } else {
            toast.error(responseRazorpay.data.message);
          }
          break;
        }

        default:
          break;
      }
    } catch (error: any) {
      toast.error(error.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="min-h-screen bg-white text-black mt-16 sm:mt-20 py-8 sm:py-12 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/cart" className="text-xs text-gray-500 hover:text-black uppercase tracking-widest flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">
        {/* Left Side: Delivery Information */}
        <div className="space-y-8">
          <div>
            <Title text1="DELIVERY" text2="INFORMATION" />
            <p className="text-xs text-gray-500 font-light mt-2">
              Please enter your shipping address details carefully to ensure timely delivery.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">First Name *</label>
                <input
                  type="text" required name="firstName" onChange={onChangeHandler} value={formData.firstName}
                  placeholder="First Name"
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black font-light text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Last Name *</label>
                <input
                  type="text" required name="lastName" onChange={onChangeHandler} value={formData.lastName}
                  placeholder="Last Name"
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black font-light text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Email Address *</label>
              <input
                type="email" required name="email" onChange={onChangeHandler} value={formData.email}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black font-light text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Street Address *</label>
              <input
                type="text" required name="street" onChange={onChangeHandler} value={formData.street}
                placeholder="House / Flat / Building No. and Street Name"
                className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black font-light text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SearchableSelect
                label="Country" required options={countryOptions} value={formData.country}
                onChange={(val: string) => setFormData(d => ({ ...d, country: val, state: '', city: '' }))}
              />
              <SearchableSelect
                label="State / Province" required options={stateOptions} value={formData.state}
                disabled={!formData.country}
                onChange={(val: string) => setFormData(d => ({ ...d, state: val, city: '' }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cityOptions.length > 0 ? (
                <SearchableSelect
                  label="City" required options={cityOptions} value={formData.city}
                  disabled={!formData.state}
                  onChange={(val: string) => setFormData(d => ({ ...d, city: val }))}
                />
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">City *</label>
                  <input
                    type="text" required name="city" onChange={onChangeHandler} value={formData.city}
                    placeholder="City Name"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black font-light text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pincode / Zipcode *</label>
                <input
                  type="text" required name="zipcode" onChange={onChangeHandler} value={formData.zipcode}
                  placeholder="6-digit Pincode"
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black font-light text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Phone Number *</label>
              <input
                type="tel" required name="phone" onChange={onChangeHandler} value={formData.phone}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black font-light text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Cart Summary & Payment Selection */}
        <div className="space-y-8">
          <CartTotal />

          <div>
            <div className="mb-4">
              <Title text1="PAYMENT" text2="METHOD" />
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setMethod('stripe')}
                className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                  method === 'stripe' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'stripe' ? 'border-black' : 'border-gray-300'}`}>
                  {method === 'stripe' && <div className="w-2 h-2 rounded-full bg-black" />}
                </div>
                <CreditCard size={18} className="text-gray-600" />
                <span className="text-xs uppercase tracking-wider font-medium text-black">Stripe / Credit Card</span>
              </div>

              <div
                onClick={() => setMethod('razorpay')}
                className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                  method === 'razorpay' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'razorpay' ? 'border-black' : 'border-gray-300'}`}>
                  {method === 'razorpay' && <div className="w-2 h-2 rounded-full bg-black" />}
                </div>
                <ShieldCheck size={18} className="text-gray-600" />
                <span className="text-xs uppercase tracking-wider font-medium text-black">Razorpay (UPI / NetBanking)</span>
              </div>

              <div
                onClick={() => setMethod('cod')}
                className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                  method === 'cod' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'cod' ? 'border-black' : 'border-gray-300'}`}>
                  {method === 'cod' && <div className="w-2 h-2 rounded-full bg-black" />}
                </div>
                <Package size={18} className="text-gray-600" />
                <span className="text-xs uppercase tracking-wider font-medium text-black">Cash on Delivery</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.25em] font-medium hover:bg-gray-900 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : 'PLACE ORDER'}
          </button>
        </div>
      </div>
    </form>
  );
}
