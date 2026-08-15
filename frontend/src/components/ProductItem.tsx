'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { Heart } from 'lucide-react';

export const ProductItemSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[3/4] bg-gray-200 w-full mb-2" />
    <div className="space-y-2 p-1">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-5 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

const detectCDN = (url = '') => {
  if (url.includes('ik.imagekit.io')) return 'imagekit';
  if (url.includes('res.cloudinary.com')) return 'cloudinary';
  return 'direct';
};

const optimizeUrl = (url: string, width = 800) => {
  if (!url) return url;
  const cdn = detectCDN(url);
  if (cdn === 'imagekit') {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}tr=w-${width},q-90,f-auto`;
  }
  if (cdn === 'cloudinary') {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }
  return url;
};

const buildSrcSet = (url?: string) => {
  if (!url) return undefined;
  const cdn = detectCDN(url);
  const widths = [400, 600, 800, 1200];
  if (cdn === 'imagekit') {
    const sep = url.includes('?') ? '&' : '?';
    return widths.map((w) => `${url}${sep}tr=w-${w},q-80,f-auto ${w}w`).join(', ');
  }
  if (cdn === 'cloudinary') {
    return widths
      .map((w) => {
        const optimized = url.replace('/upload/', `/upload/w_${w},q_auto,f_auto/`);
        return `${optimized} ${w}w`;
      })
      .join(', ');
  }
  return undefined;
};

interface ProductItemProps {
  id: string;
  slug?: string;
  image: string[];
  name: string;
  price: number;
  company?: string;
  discount?: number;
}

export default function ProductItem({ id, slug, image, name, price, company, discount = 0 }: ProductItemProps) {
  const { currency, formatPrice, getProductUrl } = useProducts();
  const { toggleWishlist, isInWishlist } = useCart();

  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const imagesList = (Array.isArray(image) ? image.filter(Boolean) : (image ? [image] : [])).slice(0, 2);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container.clientWidth) return;
    const newIdx = Math.round(container.scrollLeft / container.clientWidth);
    if (newIdx !== activeIdx) {
      setActiveIdx(newIdx);
    }
  };

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches && imagesList.length > 1 && scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches && imagesList.length > 1 && scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistLoading(true);
    try {
      await toggleWishlist(id);
    } finally {
      setWishlistLoading(false);
    }
  };

  const allowedCompanies = ['Anemone Vinkel', 'Jute Smart'];
  const showCompany = company && allowedCompanies.includes(company);

  const isWishlisted = isInWishlist(id);
  const hasDiscount = discount > 0;
  const salePrice = hasDiscount ? Math.round(price * (1 - discount / 100)) : null;
  const displayPrice = hasDiscount ? salePrice : price;

  return (
    <Link className="group cursor-pointer block h-full" href={getProductUrl({ _id: id, name, slug })}>
      <div
        className="relative h-full flex flex-col"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {imagesList.length > 0 && !imgError ? (
            <div ref={scrollRef} className="scrollable-images w-full h-full" onScroll={handleScroll}>
              {imagesList.map((imgUrl, index) => (
                <div key={index} className="product-image-wrapper">
                  <img
                    src={optimizeUrl(imgUrl, 800)}
                    srcSet={buildSrcSet(imgUrl)}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    alt={index === 0 ? name : `${name} — view ${index + 1}`}
                    width="600"
                    height="800"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={() => index === 0 && setImgError(true)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-xs tracking-wider">No image</span>
            </div>
          )}

          {/* Thin sliding line indicator — exactly 2 images, no arrows */}
          {imagesList.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10 z-10 pointer-events-none">
              <div
                className="h-full bg-black transition-all duration-300 ease-out"
                style={{
                  width: `${100 / imagesList.length}%`,
                  transform: `translateX(${activeIdx * 100}%)`,
                }}
              />
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider pointer-events-none">
              {discount}% OFF
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute -top-1 lg:top-1.5 right-1.5 z-10 p-1 rounded-full transition-all duration-300 ${
              isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Heart
              size={14}
              className={`transition-transform duration-300 sm:w-4 sm:h-4 ${
                isWishlisted ? 'fill-current scale-110' : 'hover:scale-110'
              }`}
            />
          </button>
        </div>

        {/* Product info */}
        <div className="pt-2 pb-1 px-0.5 flex-grow flex flex-col justify-between bg-white">
          {showCompany && (
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest mb-0.5 leading-none">
              {company}
            </p>
          )}
          <h3 className="text-[11px] sm:text-sm font-medium text-black leading-snug line-clamp-2 mb-1">{name}</h3>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-semibold text-black">
              {formatPrice ? formatPrice(displayPrice || price) : `${currency}${displayPrice}`}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                {formatPrice ? formatPrice(price) : `${currency}${price}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
