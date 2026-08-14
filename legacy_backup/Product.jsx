import { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Minus, Plus, Heart, Share2, Ruler, X, ZoomIn, ZoomOut,
  Truck, MapPin, Users,
} from 'lucide-react';
import RelatedProducts from '../components/RelatedProducts';
import RecentlyViewed from '../components/RecentlyViewed';
import SizeChartModal from '../components/SizeChartModal';
import { WASH_CARE_EXCLUDED, NO_ARTISAN_STORY_CATEGORIES } from '../assets/categoryData';
import usePageMeta, { buildProductSchema } from '../components/usePageMeta';
import { useProducts } from '../context/ProductContext';
import { slugify } from '../utils/seo';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/api';

/* Artisan data */
const FIXED_ARTISAN_STORIES = {
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

const resolveArtisanStory = (category, subCategory, savedStory) => {
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

const cdnOpt = (url, w = 800) => {
  if (!url) return url;
  if (url.includes('ik.imagekit.io')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=w-${w}`;
  }
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${w},f_auto/`);
  }
  if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${w}&output=webp&q=85`;
  }
  return url;
};

/* Skeleton */
const ProductSkeleton = () => (
  <div className="min-h-screen bg-white text-black mt-16 sm:mt-20">
    <section className="py-6 sm:py-10 lg:py-16 px-4 sm:px-8 lg:px-20 animate-pulse">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-16 items-start">
        {/* Left - Image */}
        <div className="space-y-3">
          <div className="shimmer-gradient aspect-[3/4] w-full border border-zinc-100" style={{ height: 'clamp(420px, 72vh, 780px)' }} />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shimmer-gradient w-[68px] h-[84px] border border-zinc-100" />
            ))}
          </div>
        </div>
        {/* Right - details */}
        <div className="p-5 sm:p-7 space-y-6">
          <div className="space-y-3">
            <div className="shimmer-gradient h-3.5 w-1/4" />
            <div className="shimmer-gradient h-8 w-5/6" />
            <div className="shimmer-gradient h-6 w-1/3" />
          </div>

          <div className="border-t border-b border-zinc-100 py-6 space-y-4">
            <div className="shimmer-gradient h-4 w-1/2" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer-gradient w-12 h-11" />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="shimmer-gradient h-13 w-full" />
            <div className="shimmer-gradient h-4.5 w-2/3" />
          </div>
        </div>
      </div>
    </section>
  </div>
);

/* Accordion */
const AccordionSection = ({ id, label, expanded, onToggle, children }) => (
  <div className="border-b border-gray-200">
    <button
      onClick={() => onToggle(id)}
      className="w-full py-4 flex justify-between items-center text-left hover:bg-gray-50 active:bg-gray-100 transition-colors px-0"
      aria-expanded={expanded}
    >
      <span className="text-xs font-medium tracking-[0.15em] uppercase text-black">{label}</span>
      <ChevronDown
        size={14}
        strokeWidth={1.5}
        className="text-gray-400 flex-shrink-0 transition-transform duration-300"
        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
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

/* Description formatter helper */
const renderBetterDescription = (text) => {
  if (!text) return <p>No description available.</p>;

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(text);

  if (hasHtml) {
    const formattedHtml = text
      .replace(/<li>/g, '<li style="list-style-type: disc; margin-left: 1.25rem; margin-top: 0.25rem; margin-bottom: 0.25rem;">')
      .replace(/<u>/g, '<u style="text-decoration: underline;">')
      .replace(/<b>/g, '<b style="font-weight: 700; color: #000;">')
      .replace(/<strong>/g, '<strong style="font-weight: 700; color: #000;">')
      .replace(/<h3>/g, '<h3 style="font-size: 0.875rem; font-weight: 600; color: #000; margin-top: 0.75rem; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em;">');
    
    return (
      <div 
        className="text-gray-500 font-light text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
      />
    );
  }

  const blocks = text.split(/\r?\n/);

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const isHeader = (trimmed.endsWith(':') && trimmed.length < 35) ||
          (trimmed.includes(':') && trimmed.indexOf(':') < 20 && trimmed.split(':')[0].trim().toUpperCase() === trimmed.split(':')[0].trim());

        if (isHeader) {
          const parts = trimmed.split(':');
          const headerText = parts[0].trim();
          const remainingText = parts.slice(1).join(':').trim();

          return (
            <div key={idx} className="mt-2 first:mt-0">
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-black mb-0.5 mt-4">
                {headerText}
              </p>
              {remainingText && (
                <p className="text-gray-500 font-light text-sm leading-normal">
                  {remainingText}
                </p>
              )}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-gray-500 font-light text-sm leading-normal whitespace-pre-line">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

/* Main Component */
const Product = () => {
  const { slug } = useParams();
  const { products, currency, addProductToRecentlyViewed, getProductUrl } = useProducts();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { token, navigate } = useAuth();
  const [productData, setProductData] = useState(null);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [expandedSection, setExpandedSection] = useState('description');
  const [sizeError, setSizeError] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [thumbsReady, setThumbsReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const thumbsRef = useRef(null);

  const toggleSection = (s) => setExpandedSection(prev => prev === s ? null : s);

  const onTouchStart = (e) => { touchStartX.current = e.targetTouches[0].clientX; touchStartY.current = e.targetTouches[0].clientY; };
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
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

  const selectThumb = (i) => {
    setCurrentIndex(i); setImgLoaded(false);
    thumbsRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const openModal = (img) => { setModalImage(img); setModalOpen(true); setZoomLevel(1); document.body.style.overflow = 'hidden'; };
  const closeModal = useCallback((e) => {
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
    if (!token) { navigate('/login'); return; }
    if (!productData?._id) return;
    const wasAdded = await toggleWishlist(productData._id);
    if (wasAdded !== undefined) setIsWishlisted(wasAdded);
  };

  const handleShare = () => {
    const shareData = { title: productData.name, url: window.location.href };
    if (navigator.share) { navigator.share(shareData).catch(() => { }); }
    else { navigator.clipboard.writeText(shareData.url); setShareToast(true); setTimeout(() => setShareToast(false), 2500); }
  };

  const handleQuantityChange = (action) => {
    if (action === 'increase') setQuantity(q => q + 1);
    else if (action === 'decrease' && quantity > 1) setQuantity(q => q - 1);
  };

  useEffect(() => {
    if (!slug) return;

    let parsedId = undefined;
    let parsedSlug = undefined;

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

    const applyProduct = (product) => {
      setProductData(product);
      addProductToRecentlyViewed(product);
      setIsWishlisted(isInWishlist(product._id));
    };

    const cached = products?.find(item =>
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

  useEffect(() => {
    const onKey = (e) => {
      if (showSizeChart && e.key === 'Escape') { setShowSizeChart(false); return; }
      if (!isModalOpen) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
  }, [isModalOpen, showSizeChart, handlePrev, handleNext, closeModal]);

  usePageMeta({
    title: productData?.name,
    description: productData?.description,
    canonical: productData ? `https://aharyas.com${getProductUrl(productData)}` : undefined,
    schema: productData ? buildProductSchema(productData) : undefined,
    breadcrumbs: productData ? [
      { name: 'Home', url: 'https://aharyas.com/' },
      { name: 'Shop', url: 'https://aharyas.com/shop/collection' },
      { name: productData.name },
    ] : undefined,
    ogImage: productData?.images?.[0],
    ogType: 'product',
  });

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
    ? [...productData.sizes].sort((a, b) => {
      const order = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7 };
      const aNum = parseInt(a), bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return (order[a.toUpperCase()] || 999) - (order[b.toUpperCase()] || 999);
    })
    : [];

  return (
    <div className="min-h-screen bg-white text-black mt-16">
      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-[10px] font-light tracking-[0.25em] uppercase px-6 py-3 shadow-xl animate-[fadeUp_0.3s_ease]">
          Link copied to clipboard
        </div>
      )}

      <section className="py-6 sm:py-10 lg:py-16 px-4 sm:px-8 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-light tracking-[0.2em] uppercase text-gray-400">
              <li>
                <Link to="/" className="hover:text-black transition-colors">Home</Link>
              </li>
              <span className="opacity-40">/</span>
              <li>
                <Link to="/shop/collection" className="hover:text-black transition-colors">Shop</Link>
              </li>
              <span className="opacity-40">/</span>
              <li>
                <Link to={`/shop/${slugify(productData.category)}`} className="hover:text-black transition-colors">
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
              {/* Main image */}
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

                {/* Zoom hint */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 text-[9px] font-light tracking-[0.18em] uppercase flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <ZoomIn size={11} strokeWidth={1.5} /> View
                </div>

                {/* Desktop nav arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                      aria-label="Previous"
                      className="hidden sm:flex absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-sm"
                    >
                      <ChevronLeft size={16} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleNext(); }}
                      aria-label="Next"
                      className="hidden sm:flex absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-sm"
                    >
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                  </>
                )}

                {/* Mobile counter */}
                {hasMultipleImages && (
                  <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-sm text-[10px] font-light tracking-[0.15em] px-4 py-1.5">
                    {currentIndex + 1} / {productData.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {hasMultipleImages && (
                <div ref={thumbsRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {productData.images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => selectThumb(i)}
                      className={`flex-shrink-0 w-[68px] h-[84px] cursor-pointer overflow-hidden bg-gray-50 transition-all duration-300 ${currentIndex === i ? 'border-[1.5px] border-black' : 'border border-transparent hover:border-gray-300'}`}
                      style={{
                        opacity: thumbsReady ? (currentIndex === i ? 1 : 0.5) : 0,
                        transform: thumbsReady ? 'none' : 'translateY(6px)',
                        transition: `opacity 0.35s ease ${i * 45}ms, transform 0.35s ease ${i * 45}ms, border-color 0.2s`,
                      }}
                    >
                      <img src={cdnOpt(img, 200)} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="p-5 sm:p-7 border-b border-gray-200">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <h1 className="text-xl sm:text-2xl font-light tracking-wide text-black leading-snug flex-1">
                    {productData.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleWishlistToggle}
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      className={`w-10 h-10 flex items-center justify-center border transition-all duration-300 ${isWishlisted ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:border-black'}`}
                    >
                      <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={handleShare}
                      aria-label="Share product"
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white text-black hover:border-black transition-all duration-300"
                    >
                      <Share2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Price */}
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

                {/* Sizes */}
                {sortedSizes.length > 0 && (
                  <div className="mb-6" id="size-selection">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-medium tracking-[0.2em] uppercase transition-colors duration-200 ${sizeError ? 'text-red-500' : 'text-black'}`}>
                        {sizeError ? 'Please select a size' : "Size"}
                      </span>
                      <button
                        onClick={() => setShowSizeChart(true)}
                        className="text-[10px] text-gray-400 tracking-[0.15em] uppercase flex items-center gap-1 hover:text-black transition-colors active:scale-95"
                      >
                        <Ruler size={12} strokeWidth={1.5} /> Size guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sortedSizes.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setSize(size === s ? '' : s)}
                          className={`min-w-[46px] h-11 px-3 text-xs font-light tracking-wide transition-all duration-200 ${size === s
                            ? 'bg-black text-white border border-black'
                            : sizeError
                              ? 'bg-white text-gray-700 border border-red-200 hover:border-black'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-black'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <p className="text-[10px] font-light tracking-[0.2em] uppercase text-gray-400 mb-3">Quantity</p>
                  <div className="flex items-center border border-gray-300 w-fit">
                    <button
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="w-11 h-11 flex items-center justify-center border-r border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors"
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
                      className="w-11 h-11 flex items-center justify-center border-l border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <Plus size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  {!isAddedToCart ? (
                    <button
                      onClick={handleAddToCart}
                      disabled={needsSize && !size}
                      className={`w-full h-13 py-4 text-[11px] font-light tracking-[0.28em] uppercase transition-all duration-300 ${needsSize && !size
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-900 active:bg-gray-950'
                        }`}
                    >
                      {needsSize && !size ? 'Select Size' : 'Add to Cart'}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/cart')}
                      className="w-full py-4 text-[11px] font-light tracking-[0.28em] uppercase bg-white text-black border border-black hover:bg-black hover:text-white active:bg-gray-900 transition-all duration-300"
                    >
                      View Cart
                    </button>
                  )}
                </div>
              </div>

              {/* Accordions */}
              <div>
                <AccordionSection id="description" label="Description" expanded={expandedSection === 'description'} onToggle={toggleSection}>
                  {renderBetterDescription(productData.description)}
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
                            <p className="text-[10px] text-gray-400 font-light flex items-center gap-1 mt-0.5 tracking-wide">
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
                      {['Dry Clean or Hand Wash with Mild Detergent', 'Do not Machine Wash', 'Do not soak', 'Wash separately', 'Gently Dry Inside Out in shade', 'Slight irregularities are a nature of handcrafted products'].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-2 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />{tip}
                        </li>
                      ))}
                    </ul>
                  </AccordionSection>
                )}

                <AccordionSection id="delivery" label="Delivery Timeline" expanded={expandedSection === 'delivery'} onToggle={toggleSection}>
                  <div className="space-y-4">
                    {[
                      { label: 'Standard delivery', detail: '3–5 business days · Free over ₹999' },
                      { label: 'Express delivery', detail: '1–2 business days · Additional charges apply' },
                    ].map(({ label, detail }) => (
                      <div key={label} className="flex items-start gap-3">
                        <Truck size={13} strokeWidth={1.5} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-black mb-1">{label}</p>
                          <p>{detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection id="manufacturing" label="Manufacturing Details" expanded={expandedSection === 'manufacturing'} onToggle={toggleSection}>
                  <ul className="space-y-2.5">
                    {['Handcrafted by skilled artisans', 'Made in certified workshops', 'Ethically sourced materials', 'Quality checked at multiple stages'].map((line, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-2 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />{line}
                      </li>
                    ))}
                  </ul>
                </AccordionSection>

                <AccordionSection id="returns" label="Returns & Exchanges" expanded={expandedSection === 'returns'} onToggle={toggleSection}>
                  <p className="mb-3">Easy return and exchange within <span className="font-medium text-black">7 days</span> of delivery.</p>
                  <ul className="space-y-2.5">
                    {['Items must be unused, unwashed and in original packaging', 'Refunds processed within 5–7 business days after receipt', 'One free exchange per order on size or style'].map((line, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-2 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />{line}
                      </li>
                    ))}
                  </ul>
                </AccordionSection>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Related / Recently Viewed */}
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

      {/* Lightbox */}
      {isModalOpen && ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-white flex items-center justify-center z-50"
          onClick={closeModal} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        >
          <div className="relative w-full h-full flex items-center justify-center p-6 sm:p-12" onClick={(e) => e.stopPropagation()}>
            <img
              src={cdnOpt(modalImage, 1400)} alt="Product detail" draggable="false"
              className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>

          {/* Close */}
          <button onClick={closeModal} aria-label="Close"
            className="absolute top-4 right-4 w-11 h-11 bg-white border border-gray-200 flex items-center justify-center hover:border-black transition-colors shadow-sm">
            <X size={16} strokeWidth={1.5} />
          </button>

          {/* Prev / Next */}
          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} aria-label="Previous"
            className="hidden sm:flex absolute top-1/2 left-5 -translate-y-1/2 w-11 h-11 bg-white border border-gray-200 items-center justify-center hover:border-black transition-colors shadow-sm">
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleNext(); }} aria-label="Next"
            className="hidden sm:flex absolute top-1/2 right-5 -translate-y-1/2 w-11 h-11 bg-white border border-gray-200 items-center justify-center hover:border-black transition-colors shadow-sm">
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>

          {/* Zoom */}
          <div className="hidden sm:flex absolute bottom-5 right-5 gap-2">
            <button onClick={(e) => { e.stopPropagation(); if (zoomLevel < 2) setZoomLevel(z => +(z + 0.25).toFixed(2)); }}
              className="w-11 h-11 bg-white border border-gray-200 flex items-center justify-center hover:border-black transition-colors shadow-sm" aria-label="Zoom in">
              <ZoomIn size={16} strokeWidth={1.5} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (zoomLevel > 0.5) setZoomLevel(z => +(z - 0.25).toFixed(2)); }}
              className="w-11 h-11 bg-white border border-gray-200 flex items-center justify-center hover:border-black transition-colors shadow-sm" aria-label="Zoom out">
              <ZoomOut size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white border border-gray-200 px-5 py-2 text-xs font-light tracking-[0.15em] shadow-sm">
            {currentIndex + 1} / {productData.images.length}
          </div>

          {hasMultipleImages && (
            <div className="sm:hidden absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 border border-gray-200 px-4 py-2 text-[10px] tracking-widest uppercase font-light flex items-center gap-1">
              <ChevronLeft size={10} /> Swipe <ChevronRight size={10} />
            </div>
          )}
        </div>,
        document.body
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-gradient {
          background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Product;