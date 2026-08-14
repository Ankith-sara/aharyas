'use client';

import { useEffect, useRef, useState } from 'react';
import { useProducts } from '../context/ProductContext';
import Title from './Title';
import ProductItem from './ProductItem';
import { ChevronRight, ChevronLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

const COMPANIES = [
  {
    id: 'vasudhaa-vastrram',
    name: 'vasudhaa vastrram',
    displayName: 'Vasudhaa Vastrram',
    description: 'Authentic traditional wear and sustainable organic fabrics.',
    accent: '#8B5E3C',
    accentLight: '#eee2d4ff',
  },
  {
    id: 'anemone-vinkel',
    name: 'anemone vinkel',
    displayName: 'Anemone Vinkel',
    description: 'Modern silhouettes crafted with timeless structural tailoring.',
    accent: '#2C4A3E',
    accentLight: '#cde7dfff',
  },
];

function SkeletonGrid() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex-shrink-0 w-[160px] sm:w-[185px] md:w-[200px] lg:w-[260px] animate-pulse">
          <div className="shimmer-gradient aspect-[3/4] w-full mb-3 rounded-none border border-zinc-100 bg-gray-100" />
          <div className="h-2 w-1/3 mb-2 bg-gray-100" />
          <div className="h-3.5 w-5/6 mb-1.5 bg-gray-100" />
          <div className="h-3 w-1/4 bg-gray-100" />
        </div>
      ))}
    </>
  );
}

function EmptyProducts() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center w-full bg-white/40 border border-zinc-100/30 my-1">
      <div className="relative mb-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center relative">
          <Building2 size={16} className="text-zinc-400 stroke-[1.25]" />
          <div className="absolute inset-0 rounded-full border border-transparent border-t-zinc-400 animate-spin [animation-duration:8s]" />
        </div>
      </div>

      <h4 className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-950 mb-1.5">
        No Products Found
      </h4>
      <p className="text-xs text-zinc-400 font-light max-w-xs leading-relaxed">
        Artisan pieces from this brand are currently sold out. Check back soon.
      </p>
    </div>
  );
}

function CompanySection({
  company,
  companyProducts,
  sectionIndex,
  visible,
  isLoading,
}: {
  company: typeof COMPANIES[0];
  companyProducts: any[];
  sectionIndex: number;
  visible: boolean;
  isLoading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
      const totalScrollable = scrollWidth - clientWidth;
      if (totalScrollable > 0) setScrollProgress(scrollLeft / totalScrollable);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      const timer = setTimeout(checkScroll, 500);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [companyProducts]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -420 : 420, behavior: 'smooth' });
    }
  };

  const isEven = sectionIndex % 2 === 0;

  return (
    <article
      aria-label={`${company.displayName} runway collection`}
      className="relative px-4 sm:px-6 md:px-10 lg:px-20 py-8 sm:py-10 overflow-hidden border-b border-gray-100 last:border-b-0 bg-white"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${sectionIndex * 120}ms, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${sectionIndex * 120}ms`,
      }}
    >
      {/* Accent radial background */}
      <div
        className="absolute inset-0 opacity-45 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${isEven ? '20%' : '80%'} 50%, ${company.accentLight} 0%, rgba(255,255,255,0) 70%)`,
        }}
      />

      {/* Watermark */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <h2
          className="text-[10vw] font-black uppercase tracking-tighter leading-none whitespace-nowrap opacity-[0.05] select-none"
          style={{ color: company.accent }}
        >
          {company.displayName}
        </h2>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 relative z-10 mb-4 sm:mb-5">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isEven ? '' : 'md:flex-row-reverse'}`}>
          <div className={`max-w-md space-y-1 ${isEven ? 'text-left' : 'text-left md:text-right'}`}>
            <h3 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">
              {company.displayName}
            </h3>
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              {company.description}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href={`/shop/collection?company=${encodeURIComponent(company.displayName)}`}
              className="group inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] py-1.5 px-4"
              style={{ color: company.accent }}
            >
              Explore
              <ChevronRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll strip */}
      <div className="relative z-10 group w-full">
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="hidden md:flex absolute left-4 top-[40%] -translate-y-1/2 z-30 p-2.5 bg-white/95 text-black hover:bg-black hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="hidden md:flex absolute right-4 top-[40%] -translate-y-1/2 z-30 p-2.5 bg-white/95 text-black hover:bg-black hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide py-3 px-4 sm:px-8 md:px-12 lg:px-16 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {isLoading ? (
            <SkeletonGrid />
          ) : companyProducts.length === 0 ? (
            <EmptyProducts />
          ) : (
            companyProducts.map((item, idx) => (
              <div
                key={item._id ?? idx}
                className="snap-start flex-shrink-0 w-[160px] sm:w-[185px] md:w-[200px] lg:w-[260px]"
              >
                <ProductItem
                  id={item._id}
                  image={item.images}
                  name={item.name}
                  price={item.price}
                  discount={item.discount || 0}
                  company={item.company}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scroll progress bar */}
      {!isLoading && companyProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-20 mt-6 relative z-10 flex justify-end">
          <div className="w-24 h-[1.5px] bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-transform duration-75"
              style={{ width: '35%', transform: `translateX(${scrollProgress * 185}%)` }}
            />
          </div>
        </div>
      )}
    </article>
  );
}

export default function TrustedPartners() {
  const { products, isLoading } = useProducts();
  const [productMap, setProductMap] = useState<Record<string, any[]>>({});
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.05 }
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!products?.length) { setProductMap({}); return; }
    const map: Record<string, any[]> = {};
    COMPANIES.forEach((c) => {
      map[c.id] = products
        .filter((p) => (p.company ?? '').toLowerCase() === c.name)
        .slice(0, 10);
    });
    setProductMap(map);
  }, [products]);

  return (
    <section ref={sectionRef} className="py-14 sm:py-16 bg-white overflow-hidden w-full relative">
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-20 text-center mb-6 sm:mb-10">
          <Title text1="OUR" text2="TRUSTED PARTNERS" />
          <p className="text-[10px] sm:text-[11px] text-gray-400 tracking-[0.25em] uppercase mt-2.5 font-light">
            Curated collections from our featured brand partners
          </p>
        </div>

        <div className="space-y-4">
          {COMPANIES.map((company, index) => (
            <CompanySection
              key={company.id}
              company={company}
              companyProducts={productMap[company.id] ?? []}
              sectionIndex={index}
              visible={visible}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
