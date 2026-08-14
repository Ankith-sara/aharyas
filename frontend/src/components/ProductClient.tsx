'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Minus, Plus, Heart, Share2, Ruler, X, ZoomIn, ZoomOut,
  Truck, MapPin, Users,
} from 'lucide-react';
import RelatedProducts from './RelatedProducts';
import RecentlyViewed from './RecentlyViewed';
import SizeChartModal from './SizeChartModal';
import { WASH_CARE_EXCLUDED, NO_ARTISAN_STORY_CATEGORIES } from '../assets/categoryData';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/api';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/\s+/g, '-');

const FIXED_ARTISAN_STORIES: Record<string, any> = {
  'Kondapalli Bommalu': { craftsmanName: 'Chinnari', location: 'Kondapalli, Andhra Pradesh', craftsmanExperience: 'Chinnari is a skilled artisan who creates beautiful Kondapalli Toys, known for their vibrant colors and intricate handmade details.', originTechnique: 'These toys are crafted in Kondapalli, where generations of artisans have preserved this unique handcraft tradition.', communityImpact: 'Each purchase supports artisans like Chinnari and helps keep this traditional craft alive for future generations.' },
  'Paintings': { craftsmanName: 'Lavanya', location: 'Hyderabad, Telangana', craftsmanExperience: 'Lavanya creates beautiful hand-painted artworks on natural bamboo, blending creativity with traditional craftsmanship.', originTechnique: 'Each piece is carefully painted on bamboo, turning a simple natural material into a unique work of art.', communityImpact: 'Your purchase supports local artisans and helps keep traditional bamboo painting craft alive.' },
  'Cheriyal Masks': { craftsmanName: 'Manga', location: 'Cheriyal, Telangana', craftsmanExperience: 'Manga is a skilled folk artist known for creating vibrant Cheriyal Masks and Cheriyal Scroll Painting, a centuries-old storytelling art form.', originTechnique: 'Using natural colors and traditional techniques, his work reflects the rich cultural heritage of Cheriyal.', communityImpact: 'Every purchase helps preserve this rare folk art and supports artisans keeping these traditions alive.' },
  'Combs': { craftsmanName: 'Tejaswini', location: 'Hyderabad, Telangana', craftsmanExperience: 'Tejaswini is a passionate artisan who transitioned from a corporate career to create sustainable bamboo products.', originTechnique: 'Her products are thoughtfully handcrafted using eco-friendly materials, promoting a natural and sustainable lifestyle.', communityImpact: "Each purchase supports Tejaswini's mission to reduce plastic usage while empowering artisan-led, sustainable livelihoods." },
  'Cups': { craftsmanName: 'Tejaswini', location: 'Hyderabad, Telangana', craftsmanExperience: 'Tejaswini is a passionate artisan who transitioned from a corporate career to create sustainable bamboo products.', originTechnique: 'Her products are thoughtfully handcrafted using eco-friendly materials, promoting a natural and sustainable lifestyle.', communityImpact: "Each purchase supports Tejaswini's mission to reduce plastic usage while empowering artisan-led, sustainable livelihoods." },
  'Pens': { craftsmanName: 'Tejaswini', location: 'Hyderabad, Telangana', craftsmanExperience: 'Tejaswini is a passionate artisan who transitioned from a corporate career to create sustainable bamboo products.', originTechnique: 'Her products are thoughtfully handcrafted using eco-friendly materials, promoting a natural and sustainable lifestyle.', communityImpact: "Each purchase supports Tejaswini's mission to reduce plastic usage while empowering artisan-led, sustainable livelihoods." },
  'Thermal Flask': { craftsmanName: 'Tejaswini', location: 'Hyderabad, Telangana', craftsmanExperience: 'Tejaswini is a passionate artisan who transitioned from a corporate career to create sustainable bamboo products.', originTechnique: 'Her products are thoughtfully handcrafted using eco-friendly materials, promoting a natural and sustainable lifestyle.', communityImpact: "Each purchase supports Tejaswini's mission to reduce plastic usage while empowering artisan-led, sustainable livelihoods." },
};

const DEFAULT_ARTISAN_STORY = {
  craftsmanName: 'Rajesh Kumar',
  location: 'Varanasi, Uttar Pradesh',
  craftsmanExperience: 'With over 25 years of experience, Rajesh Kumar leads a team of skilled artisans in the historic textile region of Varanasi.',
  originTechnique: 'This piece originates from the vibrant looms of Uttar Pradesh, where time-honored weaving traditions meet contemporary design.',
  communityImpact: "By choosing this piece, you're directly supporting a community of 12 artisan families.",
};

const resolveArtisanStory = (category: string, subCategory: string, savedStory?: any) => {
  if (NO_ARTISAN_STORY_CATEGORIES.has(category)) return null;
  if (FIXED_ARTISAN_STORIES[subCategory]) return FIXED_ARTISAN_STORIES[subCategory];
  if (savedStory) {
    return {
      craftsmanName: savedStory.craftsmanName || DEFAULT_ARTISAN_STORY.craftsmanName,
      location: savedStory.location || DEFAULT_ARTISAN_STORY.location,
      craftsmanExperience: savedStory.craftsmanExperience || DEFAULT_ARTISAN_STORY.craftsmanExperience,
      originTechnique: savedStory.originTechnique || DEFAULT_ARTISAN_STORY.originTechnique,
      communityImpact: savedStory.communityImpact || DEFAULT_ARTISAN_STORY.communityImpact,
    };
  }
  return DEFAULT_ARTISAN_STORY;
};

const cdnOpt = (url: string, w = 800) => {
  if (!url) return url;
  if (url.includes('ik.imagekit.io')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=w-${w}`;
  }
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${w},f_auto/`);
  }
  return url;
};

const ProductSkeleton = () => (
  <div className="min-h-screen bg-white text-black mt-16 sm:mt-20">
    <section className="py-6 sm:py-10 lg:py-16 px-4 sm:px-8 lg:px-20 animate-pulse">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-16 items-start">
        <div className="space-y-3">
          <div className="bg-gray-200 aspect-[3/4] w-full border border-zinc-100" style={{ height: 'clamp(420px, 72vh, 780px)' }} />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 w-[68px] h-[84px]" />
            ))}
          </div>
        </div>
        <div className="p-5 sm:p-7 space-y-6">
          <div className="space-y-3">
            <div className="bg-gray-200 h-3.5 w-1/4" />
            <div className="bg-gray-200 h-8 w-5/6" />
            <div className="bg-gray-200 h-6 w-1/3" />
          </div>
          <div className="border-t border-b border-zinc-100 py-6 space-y-4">
            <div className="bg-gray-200 h-4 w-1/2" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-200 w-12 h-11" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

const AccordionSection = ({ id, label, expanded, onToggle, children }: any) => (
  <div className="border-b border-gray-200">
    <button
      onClick={() => onToggle(id)}
      className="w-full py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors px-0"
      aria-expanded={expanded}
    >
      <span className="text-xs font-medium tracking-[0.15em] uppercase text-black">{label}</span>
      <ChevronDown
        size={14}
        strokeWidth={1.5}
        className={`text-gray-400 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
      />
    </button>
    <div
      className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
      style={{ maxHeight: expanded ? '2500px' : '0px' }}
    >
      <div className="pb-5 text-gray-500 font-light leading-relaxed text-sm">
        <div className="w-8 h-px bg-black mb-4" />
        {children}
      </div>
    </div>
  </div>
);

interface ProductClientProps {
  slug: string;
}

export default function ProductClient({ slug }: ProductClientProps) {
  const router = useRouter();
  const { products, currency, addProductToRecentlyViewed, getProductUrl } = useProducts();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { token } = useAuth();
  
  const [productData, setProductData] = useState<any>(null);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('description');
  const [sizeError, setSizeError] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [thumbsReady, setThumbsReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const toggleSection = (s: string) => setExpandedSection(prev => prev === s ? null : s);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs((touchStartY.current || 0) - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 50 && dy < 40) dx > 0 ? handleNext() : handlePrev();
    touchStartX.current = null;
  };

  const handleNext = useCallback(() => {
    if (!productData) return;
    const next = (currentIndex + 1) % productData.images.length;
    setCurrentIndex(next); setImgLoaded(false);
    if (isModalOpen) setModalImage(productData.images[next]);
  }, [productData, currentIndex, isModalOpen]);

  const handlePrev = useCallback(() => {
    if (!productData) return;
    const prev = currentIndex === 0 ? productData.images.length - 1 : currentIndex - 1;
    setCurrentIndex(prev); setImgLoaded(false);
    if (isModalOpen) setModalImage(productData.images[prev]);
  }, [productData, currentIndex, isModalOpen]);

  const selectThumb = (i: number) => {
    setCurrentIndex(i); setImgLoaded(false);
    thumbsRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const openModal = (img: string) => { setModalImage(img); setModalOpen(true); setZoomLevel(1); document.body.style.overflow = 'hidden'; };
  const closeModal = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    setModalOpen(false); setModalImage(''); setZoomLevel(1); document.body.style.overflow = 'unset';
  }, []);

  const handleAddToCart = () => {
    if (productData.sizes?.length > 0 && !size) {
      setSizeError(true);
      document.getElementById('size-selection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSizeError(false);
    addToCart(productData._id, productData.sizes?.length > 0 ? size : '', quantity);
    setIsAddedToCart(true); setQuantity(1);
  };

  const handleWishlistToggle = async () => {
    if (!token) { router.push('/login'); return; }
    if (!productData?._id) return;
    const wasAdded = await toggleWishlist(productData._id);
    if (wasAdded !== undefined) setIsWishlisted(wasAdded);
  };

  const handleShare = () => {
    const shareData = { title: productData.name, url: window.location.href };
    if (navigator.share) { navigator.share(shareData).catch(() => { }); }
    else { navigator.clipboard.writeText(shareData.url); setShareToast(true); setTimeout(() => setShareToast(false), 2500); }
  };

  const handleQuantityChange = (action: 'increase' | 'decrease') => {
    if (action === 'increase') setQuantity(q => q + 1);
    else if (action === 'decrease' && quantity > 1) setQuantity(q => q - 1);
  };

  useEffect(() => {
    if (!slug) return;

    let parsedId: string | undefined = undefined;
    let parsedSlug: string | undefined = undefined;

    if (/^[0-9a-fA-F]{24}$/.test(slug)) {
      parsedId = slug;
    } else {
      const parts = slug.split('-');
      const potentialId = parts[parts.length - 1];
      if (potentialId && /^[0-9a-fA-F]{24}$/.test(potentialId)) {
        parsedId = potentialId;
        parsedSlug = slug.substring(0, slug.length - potentialId.length - 1);
      } else {
        parsedSlug = slug;
      }
    }

    const applyProduct = (product: any) => {
      setProductData(product);
      addProductToRecentlyViewed(product);
      setIsWishlisted(isInWishlist(product._id));
    };

    const cached = products?.find((item) =>
      (parsedId && item._id === parsedId) ||
      (parsedSlug && item.slug === parsedSlug) ||
      item.slug === slug ||
      item._id === slug
    );

    if (cached?.description?.trim()) { applyProduct(cached); return; }

    api.post('/api/v1/product/single', {
      slug: parsedId ? undefined : (parsedSlug || slug),
      productId: parsedId
    })
      .then(({ data }) => { if (data.success && data.product) applyProduct(data.product); else if (cached) applyProduct(cached); })
      .catch(() => { if (cached) applyProduct(cached); });
  }, [slug, products, addProductToRecentlyViewed, isInWishlist]);

  useEffect(() => { setIsAddedToCart(false); setSize(''); setQuantity(1); setCurrentIndex(0); setSizeError(false); setImgLoaded(false); }, [slug]);
  useEffect(() => { setIsAddedToCart(false); setSizeError(false); }, [size]);
  useEffect(() => { if (productData?._id) setIsWishlisted(isInWishlist(productData._id)); }, [productData?._id, isInWishlist]);
  useEffect(() => { const t = setTimeout(() => setThumbsReady(true), 150); return () => clearTimeout(t); }, [productData]);

  if (!productData) return <ProductSkeleton />;

  const artisanStory = resolveArtisanStory(productData.category, productData.subCategory, productData.artisanStory);
  const hasMultipleImages = productData.images?.length > 1;
  const shouldShowWashCare = productData?.subCategory && !WASH_CARE_EXCLUDED.has(productData.subCategory);
  const originalPrice = productData.price;
  const hasDiscount = productData.discount > 0;
  const discountedPrice = hasDiscount ? Math.round(originalPrice * (1 - productData.discount / 100)) : originalPrice;
  const savedAmount = originalPrice - discountedPrice;
  const needsSize = productData.sizes?.length > 0;

  const sortedSizes = needsSize
    ? [...productData.sizes].sort((a: string, b: string) => {
        const order: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7 };
        const aNum = parseInt(a), bNum = parseInt(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return (order[a.toUpperCase()] || 999) - (order[b.toUpperCase()] || 999);
      })
    : [];

  return (
    <div className="min-h-screen bg-white text-black mt-16">
      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-[10px] font-light tracking-[0.25em] uppercase px-6 py-3 shadow-xl">
          Link copied to clipboard
        </div>
      )}

      <section className="py-6 sm:py-10 lg:py-16 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-light tracking-[0.2em] uppercase text-gray-400">
              <li>
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
              </li>
              <span className="opacity-40">/</span>
              <li>
                <Link href="/shop/collection" className="hover:text-black transition-colors">Shop</Link>
              </li>
              <span className="opacity-40">/</span>
              <li>
                <Link href={`/shop/${slugify(productData.category)}`} className="hover:text-black transition-colors">
                  {productData.category}
                </Link>
              </li>
              {productData.subCategory && (
                <>
                  <span className="opacity-40">/</span>
                  <li>
                    <span className="text-gray-900 font-normal select-none">{productData.subCategory}</span>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-16 items-start">
            <div className="space-y-3">
              <div
                className="relative group bg-gray-50 overflow-hidden cursor-zoom-in"
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
                onClick={() => openModal(productData.images[currentIndex])}
              >
                <img
                  key={currentIndex}
                  src={cdnOpt(productData.images[currentIndex], 900)}
                  alt={productData.name}
                  onLoad={() => setImgLoaded(true)}
                  draggable="false"
                  className={`w-full object-contain select-none transition-all duration-500 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'}`}
                  style={{ height: 'clamp(420px, 72vh, 780px)' }}
                />

                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 text-[9px] font-light tracking-[0.18em] uppercase flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <ZoomIn size={11} strokeWidth={1.5} /> View
                </div>

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                      aria-label="Previous"
                      className="hidden sm:flex absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <ChevronLeft size={16} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleNext(); }}
                      aria-label="Next"
                      className="hidden sm:flex absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                  </>
                )}

                {hasMultipleImages && (
                  <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-sm text-[10px] font-light tracking-[0.15em] px-4 py-1.5">
                    {currentIndex + 1} / {productData.images.length}
                  </div>
                )}
              </div>

              {hasMultipleImages && (
                <div ref={thumbsRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {productData.images.map((img: string, i: number) => (
                    <div
                      key={i}
                      onClick={() => selectThumb(i)}
                      className={`flex-shrink-0 w-[68px] h-[84px] cursor-pointer overflow-hidden bg-gray-50 transition-all duration-300 ${currentIndex === i ? 'border-[1.5px] border-black' : 'border border-transparent hover:border-gray-300'}`}
                      style={{ opacity: thumbsReady ? (currentIndex === i ? 1 : 0.5) : 0 }}
                    >
                      <img src={cdnOpt(img, 200)} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="p-5 sm:p-7 border-b border-gray-200">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <h1 className="text-xl sm:text-2xl font-light tracking-wide text-black leading-snug flex-1">
                    {productData.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleWishlistToggle}
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      className={`w-10 h-10 flex items-center justify-center border transition-all ${isWishlisted ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:border-black'}`}
                    >
                      <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={handleShare}
                      aria-label="Share product"
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white text-black hover:border-black transition-all"
                    >
                      <Share2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  {hasDiscount ? (
                    <div>
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-medium text-black">{currency}{discountedPrice.toLocaleString('en-IN')}</span>
                        <span className="text-base text-gray-400 line-through font-light">{currency}{originalPrice.toLocaleString('en-IN')}</span>
                        <span className="bg-red-500 text-white text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-0.5">{productData.discount}% OFF</span>
                      </div>
                      <p className="text-xs text-green-700 font-medium mt-1">You save {currency}{savedAmount.toLocaleString('en-IN')}</p>
                    </div>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-medium text-black">{currency}{originalPrice.toLocaleString('en-IN')}</span>
                  )}
                  <p className="text-[10px] text-gray-400 font-light tracking-[0.12em] uppercase mt-1.5">Prices include GST</p>
                </div>

                {sortedSizes.length > 0 && (
                  <div className="mb-6" id="size-selection">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-medium tracking-[0.2em] uppercase transition-colors ${sizeError ? 'text-red-500' : 'text-black'}`}>
                        {sizeError ? 'Please select a size' : 'Size'}
                      </span>
                      <button
                        onClick={() => setShowSizeChart(true)}
                        className="text-[10px] text-gray-400 tracking-[0.15em] uppercase flex items-center gap-1 hover:text-black transition-colors"
                      >
                        <Ruler size={12} strokeWidth={1.5} /> Size guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sortedSizes.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setSize(size === s ? '' : s)}
                          className={`min-w-[46px] h-11 px-3 text-xs font-light tracking-wide transition-all ${size === s
                            ? 'bg-black text-white border border-black'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-black'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-[10px] font-light tracking-[0.2em] uppercase text-gray-400 mb-3">Quantity</p>
                  <div className="flex items-center border border-gray-300 w-fit">
                    <button
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="w-11 h-11 flex items-center justify-center border-r border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={14} strokeWidth={1.5} className={quantity <= 1 ? 'text-gray-300' : 'text-black'} />
                    </button>
                    <input
                      type="number" value={quantity} min="1" max="99"
                      aria-label="Quantity"
                      onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 99) setQuantity(v); }}
                      className="w-14 h-11 text-center font-light text-sm bg-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleQuantityChange('increase')}
                      aria-label="Increase quantity"
                      className="w-11 h-11 flex items-center justify-center border-l border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {!isAddedToCart ? (
                    <button
                      onClick={handleAddToCart}
                      disabled={needsSize && !size}
                      className={`w-full h-13 py-4 text-[11px] font-light tracking-[0.28em] uppercase transition-all ${needsSize && !size
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-900'
                        }`}
                    >
                      {needsSize && !size ? 'Select Size' : 'Add to Cart'}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/cart')}
                      className="w-full py-4 text-[11px] font-light tracking-[0.28em] uppercase bg-white text-black border border-black hover:bg-black hover:text-white transition-all"
                    >
                      View Cart
                    </button>
                  )}
                </div>
              </div>

              <div>
                <AccordionSection id="description" label="Description" expanded={expandedSection === 'description'} onToggle={toggleSection}>
                  <p className="whitespace-pre-line">{productData.description}</p>
                </AccordionSection>

                {artisanStory && (
                  <AccordionSection id="artisan" label="Artisan Story" expanded={expandedSection === 'artisan'} onToggle={toggleSection}>
                    <div className="border border-gray-100 bg-gray-50 p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-black text-white text-sm font-light flex items-center justify-center flex-shrink-0">
                          {artisanStory.craftsmanName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">{artisanStory.craftsmanName}</p>
                          {artisanStory.location && (
                            <p className="text-[10px] text-gray-400 font-light flex items-center gap-1 mt-0.5">
                              <MapPin size={9} strokeWidth={1.5} />{artisanStory.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed">{artisanStory.craftsmanExperience}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="border-l-2 border-gray-200 pl-4">
                        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-black mb-2">Craft & Origin</p>
                        <p>{artisanStory.originTechnique}</p>
                      </div>
                      <div className="border-l-2 border-gray-200 pl-4">
                        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-black mb-2 flex items-center gap-1.5">
                          <Users size={11} strokeWidth={1.5} className="text-gray-400" /> Impact
                        </p>
                        <p className="italic">{artisanStory.communityImpact}</p>
                      </div>
                    </div>
                  </AccordionSection>
                )}

                {shouldShowWashCare && (
                  <AccordionSection id="washcare" label="Wash Care" expanded={expandedSection === 'washcare'} onToggle={toggleSection}>
                    <ul className="space-y-2.5">
                      {['Dry Clean or Hand Wash with Mild Detergent', 'Do not Machine Wash', 'Do not soak', 'Wash separately', 'Gently Dry Inside Out in shade'].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-2 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />{tip}
                        </li>
                      ))}
                    </ul>
                  </AccordionSection>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8">
        <RelatedProducts category={productData.category} subCategory={productData.subCategory} currentProductId={productData._id} />
      </section>
      <section className="px-4 sm:px-8 mb-16 sm:mb-24">
        <RecentlyViewed />
      </section>

      <SizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        productName={productData.name}
        category={productData.category}
        subCategory={productData.subCategory}
      />
    </div>
  );
}
