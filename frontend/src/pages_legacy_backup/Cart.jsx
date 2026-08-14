import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { Trash2, ShoppingBag, Package, X, Plus, Minus } from 'lucide-react';
import RecentlyViewed from '../components/RecentlyViewed';
import { Link } from 'react-router-dom';
import usePageMeta from '../components/usePageMeta';

const Cart = () => {
  const { products, currency, getProductUrl } = useProducts();
  const { cartItems, updateQuantity } = useCart();
  const { navigate, token } = useAuth();
  const [cartData, setCartData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const tempData = [];
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          tempData.push({ _id: items, size: item, quantity: cartItems[items][item] });
        }
      }
    }
    setCartData(tempData);
  }, [cartItems, products]);

  /* Body scroll lock while modal is open */
  useEffect(() => {
    document.body.style.overflow = showDeleteModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showDeleteModal]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cancelDelete(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  usePageMeta({ 
    title: 'Shopping Cart', description: 'Review your cart and proceed to checkout.' 
  });

  const handleDeleteClick = (id, size) => { setItemToDelete({ id, size }); setShowDeleteModal(true); };

  const confirmDelete = () => {
    if (itemToDelete) updateQuantity(itemToDelete.id, itemToDelete.size, 0);
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => { setShowDeleteModal(false); setItemToDelete(null); };

  const handleQuantityChange = (id, size, newQuantity) => {
    if (newQuantity > 0) updateQuantity(id, size, newQuantity);
  };

  const handleCheckout = () => {
    if (!cartData.length) return;
    if (!token) {
      navigate('/login', { state: { from: { pathname: '/place-order' } } });
      return;
    }
    navigate('/place-order');
  };

  return (
    <div className="min-h-screen bg-white text-black mt-16">
      {showDeleteModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 animate-fadeIn"
            onClick={cancelDelete}
          />
          <div className="relative z-10 bg-white w-full sm:max-w-sm shadow-2xl sm:rounded-sm animate-slideUp flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-black">Remove Item</h3>
              <button
                onClick={cancelDelete}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-200 transition-colors rounded-sm flex-shrink-0"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 px-5 py-5">
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Are you sure you want to remove this item from your cart?
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center justify-end gap-2.5 px-5 py-4 border-t border-gray-200 bg-white">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2.5 sm:py-3 border border-gray-300 text-black font-light tracking-wide hover:bg-gray-50 active:bg-gray-100 transition-all duration-300 uppercase text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 sm:py-3 bg-white text-black border border-gray-300 font-light tracking-wide hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-all duration-300 uppercase text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Page Header */}
      <section className="py-6 sm:py-10 px-4 sm:px-6 lg:px-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl sm:text-3xl mb-2">
            <Title text1="SHOPPING" text2="CART" />
          </div>
          {cartData.length > 0 && (
            <p className="text-xs text-gray-500 font-light">
              {cartData.length} item{cartData.length !== 1 ? 's' : ''} in your cart
            </p>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-20 pb-16">
        <div className="max-w-7xl mx-auto">

          {cartData.length === 0 ? (
            <div className="border border-gray-200">
              <div className="h-px bg-black" />
              <div className="grid md:grid-cols-2 min-h-[420px]">
                {/* Left — text */}
                <div className="flex flex-col justify-between p-8 sm:p-12 border-r border-gray-200">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-light tracking-wide text-black leading-snug mb-4">
                      Your cart<br />
                      <span className="font-semibold">awaits.</span>
                    </h2>
                    <p className="text-sm text-gray-500 font-light leading-relaxed max-w-xs">
                      Each piece in our collection is handcrafted by skilled artisans across India. Begin your journey.
                    </p>
                  </div>
                  <div className="pt-8">
                    <button
                      onClick={() => navigate('/shop/collection')}
                      className="inline-flex items-center gap-3 px-8 py-3.5 bg-black text-white text-xs tracking-[0.2em] uppercase font-light hover:bg-gray-900 transition-colors"
                    >
                      Browse Collection
                    </button>
                  </div>
                </div>

                {/* Right — decorative */}
                <div className="hidden md:flex items-center justify-center bg-gray-50 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)'}} />
                  <div className="relative z-10 text-center px-8">
                    <ShoppingBag size={48} strokeWidth={0.8} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-xs tracking-[0.25em] text-gray-400 uppercase">Nothing here yet</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8">
              <div className="space-y-3">
                <div className="hidden md:flex items-center gap-3 px-5 py-3.5 bg-gray-50 border border-gray-200">
                  <Package size={14} className="text-gray-400" />
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-light">
                    {cartData.length} Item{cartData.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {cartData.map((item, index) => {
                  const productData = products.find(p => p._id === item._id);
                  if (!productData) return (
                    <div key={index} className="p-4 border-l-4 border-red-400 bg-red-50">
                      <p className="text-sm font-medium text-red-800">Product unavailable</p>
                    </div>
                  );

                  const discountedPrice = Math.round(productData.price * (1 - (productData.discount || 0) / 100));
                  const subtotal = (discountedPrice * item.quantity).toFixed(2);

                  return (
                    <div key={index} className="bg-white border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <Link to={getProductUrl(productData)} className="flex-shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden">
                              <img
                                src={productData.images[0]}
                                alt={productData.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <Link to={getProductUrl(productData)} className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm sm:text-base lg:text-md text-black tracking-wide group-hover:text-gray-700 transition-colors">
                                  {productData.name}
                                </h3>
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(item._id, item.size)}
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-sm"
                                aria-label="Remove item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              {item.size !== 'N/A' && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Size</span>
                                  <span className="text-[10px] font-medium border border-gray-200 px-1.5 py-0.5">{item.size}</span>
                                </div>
                              )}
                              {productData.discount > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-semibold text-red-600">{currency}{discountedPrice}</span>
                                  <span className="text-[10px] text-gray-400 line-through">{currency}{productData.price}</span>
                                  <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1 py-0.5">{productData.discount}% OFF</span>
                                </div>
                              ) : (
                                <span className="text-xs font-medium">{currency}{productData.price}</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center border border-gray-300">
                                <button
                                  onClick={() => handleQuantityChange(item._id, item.size, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors border-r border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                  aria-label="Decrease"
                                >
                                  <Minus size={11} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item._id, item.size, parseInt(e.target.value) || 1)}
                                  className="w-10 h-8 text-center text-xs font-medium focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() => handleQuantityChange(item._id, item.size, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors border-l border-gray-300"
                                  aria-label="Increase"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>

                              <div className="text-right">
                                <span className="block text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">Subtotal</span>
                                <span className="text-sm font-semibold">{currency}{subtotal}</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary sidebar */}
              <div className="lg:sticky lg:top-24 h-fit">
                <div className="bg-white border border-gray-200 shadow-sm">
                  <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-medium tracking-wider uppercase">Order Summary</h3>
                  </div>
                  <div className="p-4 sm:p-5 space-y-5">
                    <CartTotal hideShipping />
                    <div className="space-y-2.5">
                      <button
                        onClick={handleCheckout}
                        disabled={cartData.length === 0}
                        className="w-full py-3.5 bg-black text-white font-light tracking-[0.15em] text-xs sm:text-sm hover:bg-gray-800 active:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        PROCEED TO CHECKOUT
                      </button>
                      <button
                        onClick={() => navigate('/shop/collection')}
                        className="w-full py-3.5 border border-gray-300 text-black font-light tracking-wide hover:border-black hover:bg-gray-50 transition-all text-xs sm:text-sm"
                      >
                        CONTINUE SHOPPING
                      </button>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
                      
                      <span className="uppercase tracking-wider text-[10px] text-gray-400">Secure Checkout</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </section>

      {/* Recently Viewed */}
      {cartData.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-20 pb-16">
          <div className="max-w-7xl mx-auto">
            <RecentlyViewed />
          </div>
        </section>
      )}

    </div>
  );
};

export default Cart;