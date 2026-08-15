'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { Tag, X, Check, ChevronDown, Ticket } from 'lucide-react';

const COUPONS = [
  { code: 'FLAT500', discount: 500, minAmount: 4000, type: 'flat' as const },
  { code: 'FLAT1000', discount: 1000, minAmount: 7000, type: 'flat' as const },
];

interface CartTotalProps {
  overrideShipping?: number;
  hideShipping?: boolean;
}

const CartTotal: React.FC<CartTotalProps> = ({ overrideShipping, hideShipping = false }) => {
  const { currency, formatPrice } = useProducts();
  const { delivery_fee, getCartAmount, getAppliedCoupon, applyCoupon, clearCoupon } = useCart();

  const appliedCoupon = getAppliedCoupon ? getAppliedCoupon() : null;

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [invalidatedMsg, setInvalidatedMsg] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subtotal = getCartAmount ? getCartAmount() : 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-remove coupon if cart drops below minimum
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.minAmount && subtotal < appliedCoupon.minAmount) {
      if (clearCoupon) clearCoupon();
      setInvalidatedMsg(
        `Coupon removed — cart total dropped below ${currency}${appliedCoupon.minAmount} minimum.`
      );
    } else {
      setInvalidatedMsg('');
    }
  }, [subtotal, appliedCoupon, clearCoupon, currency]);

  // Coupons eligible given current subtotal
  const eligibleCoupons = COUPONS.filter(c => subtotal >= c.minAmount);
  const ineligibleCoupons = COUPONS.filter(c => subtotal < c.minAmount);

  const applyCode = (code: string) => {
    setCouponError('');
    setInvalidatedMsg('');
    const matched = COUPONS.find(c => c.code === code);
    if (!matched) return;
    if (subtotal < matched.minAmount) {
      setCouponError(`This coupon requires a minimum order of ${currency}${matched.minAmount}.`);
      return;
    }
    if (applyCoupon) applyCoupon(matched);
    setCouponInput('');
    setShowDropdown(false);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    setInvalidatedMsg('');
    const inputCode = couponInput.trim().toUpperCase();
    if (!inputCode) { setCouponError('Please enter a coupon code'); return; }
    applyCode(inputCode);
    if (!COUPONS.find(c => c.code === inputCode)) {
      setCouponError('Invalid coupon code. Please check and try again.');
    }
  };

  const handleRemoveCoupon = () => {
    if (clearCoupon) clearCoupon();
    setCouponInput('');
    setCouponError('');
    setInvalidatedMsg('');
  };

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const shippingFee = hideShipping || subtotal === 0
    ? 0
    : (overrideShipping ?? delivery_fee);
  const total = subtotal === 0 ? 0 : subtotal + shippingFee - couponDiscount;

  return (
    <div className="w-full">
      {/* Coupon accordion */}
      <div className={`mb-5 border border-gray-200 relative ${showDropdown ? 'z-50' : 'z-0'}`}>
        <button
          type="button"
          onClick={() => { setCouponOpen(o => !o); setCouponError(''); setInvalidatedMsg(''); }}
          className="w-full px-3 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag size={12} className="text-gray-500 flex-shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
              {appliedCoupon ? (
                <span className="text-green-700">Coupon Applied: {appliedCoupon.code}</span>
              ) : 'Have a Coupon?'}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${couponOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Collapsible body */}
        <div className={`transition-all duration-300 ${couponOpen ? 'max-h-[32rem] overflow-visible' : 'max-h-0 overflow-hidden'}`}>
          <div className="p-3 border-t border-gray-100">
            {appliedCoupon ? (
              /* Applied state */
              <div className="flex items-center justify-between gap-2 p-2.5 border border-green-300 bg-green-50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-xs text-green-800 uppercase tracking-wide">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-600 text-white uppercase tracking-wider font-light">
                        Applied
                      </span>
                    </div>
                    <p className="text-[10px] text-green-700 font-light mt-0.5">
                      You saved {currency}{appliedCoupon.discount.toLocaleString('en-IN')}!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="p-1 text-green-600 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label="Remove coupon"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              /* Input + dropdown */
              <div className="space-y-3" ref={dropdownRef}>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError('');
                        setInvalidatedMsg('');
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { handleApplyCoupon(); setShowDropdown(false); }
                        if (e.key === 'Escape') setShowDropdown(false);
                      }}
                      placeholder="Enter or pick a coupon"
                      className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors text-xs uppercase tracking-wide font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => { handleApplyCoupon(); setShowDropdown(false); }}
                      className="px-4 py-2.5 bg-black text-white text-[10px] font-light uppercase tracking-wider hover:bg-gray-800 transition-all whitespace-nowrap flex-shrink-0"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 shadow-lg">
                      {/* Eligible coupons */}
                      {eligibleCoupons.length > 0 && (
                        <div>
                          <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
                            Available
                          </p>
                          {eligibleCoupons.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => applyCode(c.code)}
                              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 border border-dashed border-gray-300 group-hover:border-black flex items-center justify-center flex-shrink-0 transition-colors">
                                  <Ticket size={11} className="text-gray-400 group-hover:text-black transition-colors" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-black uppercase tracking-wide">{c.code}</p>
                                  <p className="text-[10px] text-gray-500 font-light">Save {currency}{c.discount.toLocaleString('en-IN')} on orders above {currency}{c.minAmount.toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                              <span className="text-[9px] text-black border border-black px-2 py-0.5 uppercase tracking-wider flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                                Apply
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Ineligible coupons */}
                      {ineligibleCoupons.length > 0 && (
                        <div className={eligibleCoupons.length > 0 ? 'border-t border-gray-100' : ''}>
                          <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
                            Add more to unlock
                          </p>
                          {ineligibleCoupons.map(c => (
                            <div
                              key={c.code}
                              className="flex items-center justify-between gap-3 px-3 py-2.5 opacity-50"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                                  <Ticket size={11} className="text-gray-300" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.code}</p>
                                  <p className="text-[10px] text-gray-400 font-light">
                                    Add {currency}{(c.minAmount - subtotal).toLocaleString('en-IN')} more to unlock
                                  </p>
                                </div>
                              </div>
                              <span className="text-[9px] text-gray-400 border border-gray-300 px-2 py-0.5 uppercase tracking-wider flex-shrink-0">
                                Locked
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {eligibleCoupons.length === 0 && ineligibleCoupons.length === 0 && (
                        <p className="px-3 py-3 text-[10px] text-gray-400 font-light">No coupons available.</p>
                      )}
                    </div>
                  )}
                </div>

                {couponError && (
                  <p className="text-[10px] text-red-500 font-light flex items-start gap-1">
                    <X size={10} className="flex-shrink-0 mt-0.5" /> {couponError}
                  </p>
                )}
                {invalidatedMsg && (
                  <p className="text-[10px] text-orange-500 font-light flex items-start gap-1">
                    <X size={10} className="flex-shrink-0 mt-0.5" /> {invalidatedMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-light">Subtotal</span>
          <span className="text-gray-800">{formatPrice ? formatPrice(subtotal) : `${currency}${subtotal}`}</span>
        </div>

        {!hideShipping && (
          <>
            <hr className="border-gray-100" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-light">Shipping Fee</span>
              <span className="text-gray-800">{formatPrice ? formatPrice(shippingFee) : `${currency}${shippingFee}`}</span>
            </div>
          </>
        )}

        {hideShipping && subtotal > 0 && (
          <>
            <hr className="border-gray-100" />
            <p className="text-[10px] text-gray-400 font-light">
              Shipping calculated at checkout
            </p>
          </>
        )}

        {appliedCoupon && (
          <>
            <hr className="border-gray-100" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600 font-light">Discount ({appliedCoupon.code})</span>
              <span className="text-green-600">-{formatPrice ? formatPrice(couponDiscount) : `${currency}${couponDiscount}`}</span>
            </div>
          </>
        )}

        <hr className="border-gray-200" />

        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold uppercase tracking-wide">
            {hideShipping ? 'Subtotal' : 'Total'}
          </span>
          <span className="text-base font-semibold">{formatPrice ? formatPrice(total) : `${currency}${total}`}</span>
        </div>

        {appliedCoupon && (
          <p className="text-[10px] text-green-600 font-medium text-right">
            You&apos;re saving {formatPrice ? formatPrice(couponDiscount) : `${currency}${couponDiscount}`} on this order!
          </p>
        )}
      </div>
    </div>
  );
};

export default CartTotal;
