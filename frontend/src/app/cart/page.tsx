'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Title from '../../components/Title';
import CartTotal from '../../components/CartTotal';
import RecentlyViewed from '../../components/RecentlyViewed';
import { Trash2, ShoppingBag, Package, X, Plus, Minus } from 'lucide-react';

export default function CartPage() {
  const { products, currency, getProductUrl } = useProducts();
  const { cartItems, updateQuantity } = useCart();
  const { token } = useAuth();
  const router = useRouter();

  const [cartData, setCartData] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; size: string } | null>(null);

  useEffect(() => {
    const tempData: any[] = [];
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          tempData.push({ _id: items, size: item, quantity: cartItems[items][item] });
        }
      }
    }
    setCartData(tempData);
  }, [cartItems, products]);

  useEffect(() => {
    document.body.style.overflow = showDeleteModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDeleteModal]);

  const handleDeleteClick = (id: string, size: string) => {
    setItemToDelete({ id, size });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      updateQuantity(itemToDelete.id, itemToDelete.size, 0);
      setItemToDelete(null);
    }
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setItemToDelete(null);
    setShowDeleteModal(false);
  };

  const isCartEmpty = cartData.length === 0;

  return (
    <div className="min-h-screen bg-white text-black mt-16 sm:mt-20">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-medium">Remove item</span>
              <button onClick={cancelDelete} className="p-1 text-gray-400 hover:text-black transition-colors" aria-label="Close modal">
                <X size={16} />
              </button>
            </div>
            <h3 className="text-base font-light text-black mb-2">Remove from cart?</h3>
            <p className="text-xs text-gray-500 font-light mb-6 leading-relaxed">
              Are you sure you want to remove this item? You can always add it back later.
            </p>
            <div className="flex gap-3">
              <button onClick={cancelDelete} className="flex-1 py-3 border border-gray-200 text-gray-700 text-xs uppercase tracking-[0.15em] font-medium hover:border-black transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-black text-white text-xs uppercase tracking-[0.15em] font-medium hover:bg-gray-900 transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="py-6 sm:py-10 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto">
        <div className="text-2xl sm:text-3xl mb-8">
          <Title text1="YOUR" text2="CART" />
        </div>

        {isCartEmpty ? (
          <div className="py-16 sm:py-24 text-center border-t border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <ShoppingBag size={24} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-light tracking-wide text-black mb-2">Your cart is empty</h2>
            <p className="text-xs text-gray-500 font-light max-w-sm mx-auto mb-8 leading-relaxed">
              Looks like you haven&apos;t added any artisanal creations to your cart yet.
            </p>
            <Link
              href="/shop/collection"
              className="inline-block px-8 py-3.5 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
            {/* Cart Items List */}
            <div className="border-t border-gray-200 divide-y divide-gray-200">
              {cartData.map((item, index) => {
                const productData = products.find((product) => product._id === item._id);
                if (!productData) return null;

                const hasDiscount = productData.discount > 0;
                const unitPrice = hasDiscount
                  ? Math.round(productData.price * (1 - productData.discount / 100))
                  : productData.price;
                const itemTotal = unitPrice * item.quantity;

                return (
                  <div key={index} className="py-6 flex gap-4 sm:gap-6 items-start group">
                    {/* Thumbnail */}
                    <Link href={getProductUrl(productData)} className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 bg-gray-50 overflow-hidden relative border border-gray-100">
                      <Image
                        src={productData.images[0]}
                        alt={productData.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                      <div>
                        <Link
                          href={getProductUrl(productData)}
                          className="text-sm sm:text-base font-light text-black tracking-wide leading-snug line-clamp-2 hover:underline mb-1"
                        >
                          {productData.name}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-light">
                          {item.size && (
                            <span className="px-2 py-0.5 border border-gray-200 text-[10px] uppercase tracking-wider text-black">
                              Size: {item.size}
                            </span>
                          )}
                          <span className="text-gray-400">
                            {currency}{unitPrice.toLocaleString('en-IN')} each
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex items-center justify-between mt-3 pt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 bg-white">
                          <button
                            onClick={() => {
                              if (item.quantity === 1) {
                                handleDeleteClick(item._id, item.size);
                              } else {
                                updateQuantity(item._id, item.size, item.quantity - 1);
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-light text-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Total price & Delete button */}
                        <div className="flex items-center gap-4">
                          <span className="text-sm sm:text-base font-medium text-black">
                            {currency}{itemTotal.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => handleDeleteClick(item._id, item.size)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary Sidebar */}
            <div className="lg:sticky lg:top-28 space-y-6">
              <CartTotal />
              <button
                onClick={() => router.push('/place-order')}
                className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.25em] font-medium hover:bg-gray-900 transition-colors shadow-sm active:scale-[0.99]"
              >
                Proceed to Checkout
              </button>

              <div className="border border-gray-100 p-4 space-y-3 bg-gray-50/50">
                <div className="flex items-start gap-3">
                  <Package size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-black font-semibold">Free Delivery</p>
                    <p className="text-xs text-gray-500 font-light">On orders above ₹999 across India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 sm:mt-24">
          <RecentlyViewed />
        </div>
      </div>
    </div>
  );
}
