'use client';

import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import Title from '../../components/Title';
import { Heart, ShoppingCart, Trash2, X, Package, Plus, Minus } from 'lucide-react';

export default function WishlistPage() {
  const { products, currency, getProductUrl } = useProducts();
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();
  const router = useRouter();

  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter products that are in wishlist
  useEffect(() => {
    if (products && wishlistItems) {
      const filteredProducts = products.filter((product) =>
        wishlistItems.includes(product._id)
      );
      setWishlistProducts(filteredProducts);
      setLoading(false);
    }
  }, [products, wishlistItems]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showSizeModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSizeModal, showDeleteModal]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSizeModal) {
          closeSizeModal();
        }
        if (showDeleteModal) {
          cancelDelete();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSizeModal, showDeleteModal]);

  const handleDeleteClick = (productId: string) => {
    setItemToDelete(productId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await removeFromWishlist(itemToDelete);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Check if size is available
  const isSizeAvailable = (size: any) => {
    const sizeString = String(size).trim();
    return (
      sizeString !== 'N/A' &&
      sizeString.toLowerCase() !== 'out of stock' &&
      sizeString !== ''
    );
  };

  const hasSelectableSizes = (product: any) => {
    return product.sizes && product.sizes.some((size: any) => isSizeAvailable(size));
  };

  const openSizeModal = (product: any) => {
    if (!hasSelectableSizes(product)) {
      addToCart(product._id, 'N/A', 1);
      removeFromWishlist(product._id);
      return;
    }
    setSelectedProduct(product);
    setSelectedSize('');
    setQuantity(1);
    setShowSizeModal(true);
  };

  const closeSizeModal = () => {
    setShowSizeModal(false);
    setSelectedProduct(null);
    setSelectedSize('');
    setQuantity(1);
  };

  const handleAddToCartWithSize = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    addToCart(selectedProduct._id, selectedSize, quantity);
    await removeFromWishlist(selectedProduct._id);
    closeSizeModal();
  };

  // Sort sizes function
  const sortSizes = (sizes: any[]) => {
    return [...sizes].sort((a, b) => {
      const sizeOrder: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7 };

      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      const aOrder = sizeOrder[String(a).toUpperCase()] || 999;
      const bOrder = sizeOrder[String(b).toUpperCase()] || 999;
      return aOrder - bOrder;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black mt-16 px-4 sm:px-8 lg:px-20 py-10">
        <style
          dangerouslySetInnerHTML={{
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
          `,
          }}
        />
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="shimmer-gradient h-6 w-40 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="border border-zinc-100 p-2 bg-white">
                <div className="shimmer-gradient aspect-[3/4] w-full mb-3" />
                <div className="shimmer-gradient h-3.5 w-3/4 mb-2" />
                <div className="shimmer-gradient h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black mt-16">
      {/* Delete Confirmation Modal Portal */}
      {showDeleteModal && mounted && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white rounded-sm shadow-2xl max-w-sm sm:max-w-md w-full animate-slideUp">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-medium tracking-wide">Remove from Wishlist</h3>
              <button
                onClick={cancelDelete}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-600 font-light leading-relaxed">
                Are you sure you want to remove this item from your wishlist?
              </p>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2.5 sm:py-3 border border-gray-300 text-black font-light tracking-wide hover:bg-gray-50 active:bg-gray-100 transition-all duration-300 uppercase text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 sm:py-3 bg-white text-black border border-gray-300 font-light tracking-wide hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-all duration-300 uppercase text-sm cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Page Header */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
              <Title text1="MY" text2="WISHLIST" />
            </div>
            {wishlistProducts.length > 0 && (
              <p className="text-sm sm:text-base text-gray-500 font-light">
                {wishlistProducts.length} item{wishlistProducts.length !== 1 ? 's' : ''} saved for later
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Wishlist Content */}
      <section className="px-4 sm:px-6 lg:px-20 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          {wishlistProducts.length === 0 ? (
            <div className="border border-gray-200">
              <div className="h-px bg-black" />
              <div className="grid md:grid-cols-2 min-h-[420px]">
                {/* Left — decorative */}
                <div className="hidden md:flex items-center justify-center bg-gray-50 relative overflow-hidden border-r border-gray-200">
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 28px)',
                    }}
                  />
                  <div className="relative z-10 text-center px-8">
                    <Heart size={48} strokeWidth={0.8} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-xs tracking-[0.25em] text-gray-400 uppercase">Nothing saved yet</p>
                  </div>
                </div>

                {/* Right — text */}
                <div className="flex flex-col justify-between p-8 sm:p-12">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-light tracking-wide text-black leading-snug mb-4">
                      Save what<br />
                      <span className="font-semibold">you love.</span>
                    </h2>
                    <p className="text-sm text-gray-500 font-light leading-relaxed max-w-xs">
                      Tap the heart on any product to save it here. Come back whenever you&apos;re ready.
                    </p>
                  </div>
                  <div className="pt-8">
                    <button
                      onClick={() => router.push('/shop/collection')}
                      className="inline-flex items-center gap-3 px-8 py-3.5 bg-black text-white text-xs tracking-[0.2em] uppercase font-light hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      Explore Collection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-gray-200 shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items in Wishlist:
                      </span>
                      <span className="font-medium text-black tracking-wide">{wishlistProducts.length}</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {wishlistProducts.map((product) => (
                    <div
                      key={product._id}
                      className="p-4 sm:p-6 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-300"
                    >
                      <div className="flex gap-3 sm:gap-4 lg:gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <Link href={getProductUrl(product)}>
                            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 cursor-pointer overflow-hidden">
                              <img
                                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                                src={product.images?.[0]}
                                alt={product.name}
                              />
                            </div>
                          </Link>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="space-y-2 sm:space-y-3">
                            <Link href={getProductUrl(product)} className="group">
                              <h3 className="font-medium text-sm sm:text-base text-black tracking-wide group-hover:text-gray-700 transition-colors line-clamp-2">
                                {product.name}
                              </h3>
                            </Link>

                            <div className="space-y-2">
                              <div className="space-y-0.5">
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  PRICE
                                </span>
                                {product.discount > 0 ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-black text-sm sm:text-base">
                                      {currency}
                                      {Math.round(product.price * (1 - product.discount / 100)).toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-xs text-gray-400 line-through">
                                      {currency}
                                      {product.price.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5">
                                      {product.discount}% OFF
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-medium text-black text-sm sm:text-base">
                                    {currency}
                                    {product.price.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>

                              {product.sizes && product.sizes.length > 0 && (
                                <div className="space-y-0.5">
                                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    AVAILABLE SIZES
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {product.sizes
                                      .filter((size: any) => isSizeAvailable(size))
                                      .slice(0, 5)
                                      .map((size: any, index: number) => (
                                        <span
                                          key={index}
                                          className="text-xs bg-gray-100 px-2 py-0.5 text-gray-600 border border-gray-200"
                                        >
                                          {size}
                                        </span>
                                      ))}
                                    {product.sizes.filter((size: any) => isSizeAvailable(size)).length > 5 && (
                                      <span className="text-xs text-gray-500 px-1">
                                        +{product.sizes.filter((size: any) => isSizeAvailable(size)).length - 5}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                              <button
                                onClick={() => openSizeModal(product)}
                                className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-black text-white font-light tracking-wide hover:bg-gray-800 active:bg-gray-900 transition-all duration-300 uppercase text-xs sm:text-sm cursor-pointer"
                              >
                                <ShoppingCart size={14} />
                                ADD TO CART
                              </button>
                              <button
                                onClick={() => router.push(getProductUrl(product))}
                                className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-black font-light tracking-wide hover:border-black hover:bg-gray-50 active:bg-gray-100 transition-all duration-300 uppercase text-xs sm:text-sm cursor-pointer"
                              >
                                VIEW DETAILS
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleDeleteClick(product._id)}
                            className="p-2 sm:p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 border border-transparent hover:border-red-200 transition-all duration-300 cursor-pointer"
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Shopping */}
              <div className="text-center">
                <button
                  onClick={() => router.push('/shop/collection')}
                  className="px-6 sm:px-8 py-3 sm:py-4 border border-gray-300 text-black font-light tracking-wide hover:border-black hover:bg-gray-50 active:bg-gray-100 transition-all duration-300 uppercase text-sm sm:text-base cursor-pointer"
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Select Size Modal Portal */}
      {showSizeModal && selectedProduct && mounted && ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeSizeModal}
        >
          <div
            className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 tracking-wide">Select Size</h3>
              <button
                onClick={closeSizeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              {/* Product Info */}
              <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                <img
                  src={selectedProduct.images?.[0]}
                  alt={selectedProduct.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">
                    {selectedProduct.name}
                  </h4>
                  {selectedProduct.discount > 0 ? (
                    <div className="flex items-center gap-2">
                      <p className="text-base sm:text-lg font-semibold text-black">
                        {currency}
                        {Math.round(
                          selectedProduct.price * (1 - selectedProduct.discount / 100)
                        ).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-gray-400 line-through">
                        {currency}
                        {selectedProduct.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg font-medium text-black">
                      {currency}
                      {selectedProduct.price.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                  Choose Size *
                </label>
                <div className="flex flex-wrap gap-2">
                  {sortSizes(selectedProduct.sizes).map((size, index) => {
                    const isAvailable = isSizeAvailable(size);
                    return (
                      <button
                        key={index}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        className={`py-2 sm:py-2.5 px-3 sm:px-4 transition-all duration-300 font-light relative text-sm sm:text-base cursor-pointer ${
                          selectedSize === size
                            ? 'bg-black text-white shadow-md'
                            : isAvailable
                            ? 'bg-white text-gray-700 border border-gray-300 hover:border-black active:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {size}
                        {!isAvailable && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-full h-px bg-gray-400 rotate-[-25deg] transform origin-center"></span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                  Quantity
                </label>
                <div className="flex items-center border border-gray-300 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors border-r border-gray-300 cursor-pointer"
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} className={quantity <= 1 ? 'text-gray-300' : 'text-black'} />
                  </button>
                  <input
                    type="number"
                    className="w-14 sm:w-16 h-9 sm:h-10 text-center focus:outline-none bg-white font-medium text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={quantity}
                    min="1"
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value > 0) setQuantity(value);
                    }}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors border-l border-gray-300 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-white pt-2">
                <button
                  onClick={closeSizeModal}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 font-light tracking-wide hover:border-gray-400 active:bg-gray-50 transition-colors uppercase text-sm order-2 sm:order-1 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleAddToCartWithSize}
                  disabled={!selectedSize}
                  className={`w-full sm:flex-1 px-4 sm:px-6 py-3 font-light tracking-wide transition-colors uppercase text-sm order-1 sm:order-2 cursor-pointer ${
                    selectedSize
                      ? 'bg-black text-white hover:bg-gray-800 active:bg-gray-900'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ADD TO CART
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
