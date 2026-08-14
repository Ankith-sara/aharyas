'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useProducts } from '../context/ProductContext';
import Title from './Title';
import ProductItem from './ProductItem';
import Link from 'next/link';
import type { Product } from '@aharyas/types';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

const ALL_CATEGORIES = [
  { id: 'women', name: 'Women', subcategories: ['Dresses', 'Sarees', 'Tops', 'Women Shirts', 'Women Co-ord Sets'] },
  { id: 'men', name: 'Men', subcategories: ['Men Shirts', 'Kurtas', 'Men Co-ord Sets'] },
  { id: 'bags', name: 'Bags & Purses', subcategories: ['Handbags', 'Zardozi Purses'] },
];

const STRIP_TOTAL = 10;
const PER_SUBCAT_CAP = 3;

function matchesCategory(item: any, subcategories: string[]) {
  const subCat = item.subCategory ?? '';
  return subcategories.some((s) => s === subCat);
}

function getUpdateTime(p: any) {
  if (p.updatedAt) return new Date(p.updatedAt).getTime();
  if (p.createdAt) return new Date(p.createdAt).getTime();
  if (p.date) return typeof p.date === 'number' ? p.date : new Date(p.date).getTime();
  return 0;
}

function getBalancedProducts(products: any[], subcategories: string[], total = STRIP_TOTAL, perSubCatCap = PER_SUBCAT_CAP) {
  const buckets: Record<string, any[]> = {};
  subcategories.forEach((s) => { buckets[s] = []; });

  products.forEach((p) => {
    const sub = p.subCategory ?? '';
    if (buckets[sub]) buckets[sub].push(p);
  });

  Object.keys(buckets).forEach((s) => {
    buckets[s].sort((a, b) => getUpdateTime(b) - getUpdateTime(a));
  });

  const activeSubs = subcategories.filter((s) => buckets[s].length > 0);
  if (!activeSubs.length) return [];

  const taken: Record<string, number> = {};
  activeSubs.forEach((s) => { taken[s] = 0; });

  const result: any[] = [];

  let pass1Cap = perSubCatCap;
  let added = true;
  while (result.length < total && added) {
    added = false;
    for (const sub of activeSubs) {
      if (result.length >= total) break;
      const idx = taken[sub];
      if (idx < buckets[sub].length && idx < pass1Cap) {
        result.push(buckets[sub][idx]);
        taken[sub]++;
        added = true;
      }
    }
    if (!added && result.length < total) {
      pass1Cap++;
      added = activeSubs.some((s) => taken[s] < buckets[s].length);
    }
  }

  return result;
}

function SkeletonGrid() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex-shrink-0 w-[165px] sm:w-[190px] md:w-[220px] lg:w-[270px] animate-pulse">
          <div className="shimmer-gradient aspect-[3/4] w-full mb-3 border border-zinc-100 bg-gray-100" />
          <div className="h-2 w-1/3 mb-2 bg-gray-100" />
          <div className="h-3.5 w-5/6 mb-1.5 bg-gray-100" />
          <div className="h-3 w-1/4 bg-gray-100" />
        </div>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center w-full bg-white border border-zinc-100/50 my-2">
      <div className="relative mb-5 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border border-zinc-200 flex items-center justify-center relative">
          <ShoppingBag size={18} className="text-zinc-400 stroke-[1.25]" />
          <div className="absolute inset-0 rounded-full border border-transparent border-t-zinc-400 animate-spin [animation-duration:8s]" />
        </div>
      </div>
      <h4 className="text-[11px] font-semibold tracking-[0.3em] uppercase text-zinc-950 mb-2">
        No Products Available
      </h4>
      <p className="text-xs text-zinc-400 font-light max-w-xs leading-relaxed mb-5">
        Our artisan collections are currently undergoing runway prep. Check back soon for new arrivals.
      </p>
    </div>
  );
}

function LatestSection({
  category,
  categoryProducts,
  isLoading,
  visible,
}: {
  category: typeof ALL_CATEGORIES[0];
  categoryProducts: any[];
  isLoading: boolean;
  visible: boolean;
  isEven?: boolean;
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
  }, [categoryProducts]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -420 : 420, behavior: 'smooth' });
    }
  };

  if (!isLoading && categoryProducts.length === 0) return null;

  return (
    <article
      aria-label={`${category.name} new arrivals`}
      className="relative w-full py-5 border-b border-gray-100/80 last:border-b-0 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 mb-3 sm:mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h3 className="text-lg sm:text-xl font-light text-black tracking-wide">
              {category.name}
            </h3>
          </div>
          <Link
            href={`/shop/collection?category=${encodeURIComponent(category.name)}`}
            className="group inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] py-1.5 text-gray-400 hover:text-black transition-colors duration-300"
          >
            Explore
            <ChevronRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

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
          className="flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-hide py-3 px-4 sm:px-8 md:px-12 lg:px-16 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            categoryProducts.map((item, index) => (
              <div
                key={item._id ?? index}
                className="snap-start flex-shrink-0 w-[165px] sm:w-[190px] md:w-[220px] lg:w-[270px]"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${80 + index * 40}ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${80 + index * 40}ms`,
                }}
              >
                <ProductItem
                  id={item._id}
                  image={item.images}
                  name={item.name}
                  price={item.price}
                  company={item.company}
                  discount={item.discount || 0}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {!isLoading && categoryProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-20 mt-4 relative z-10 flex justify-end">
          <div className="w-20 h-[1.5px] bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-black/70 transition-transform duration-100"
              style={{ width: '35%', transform: `translateX(${scrollProgress * 185}%)` }}
            />
          </div>
        </div>
      )}
    </article>
  );
}

export default function LatestCollection({ initialProducts }: { initialProducts?: Product[] }) {
  const { products: contextProducts, isLoading } = useProducts();
  // Server-fetched data (see app/page.tsx) wins on first paint so this
  // section renders with real products before client JS/context even
  // mounts; once ProductContext finishes its own fetch, it takes over
  // as the source of truth (same data, just live-updating).
  const products = useMemo(
    () => (contextProducts?.length ? contextProducts : initialProducts ?? []),
    [contextProducts, initialProducts]
  );
  const [productMap, setProductMap] = useState<Record<string, any[]>>({});
  const [visible, setVisible] = useState(false);
  const [mountReady, setMountReady] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMountReady(true);
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px', threshold: 0 }
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!products?.length) {
      setProductMap({});
      return;
    }
    const map: Record<string, any[]> = {};
    ALL_CATEGORIES.forEach((c) => {
      const matching = products.filter((p) => matchesCategory(p, c.subcategories));
      map[c.id] = getBalancedProducts(matching, c.subcategories, STRIP_TOTAL, PER_SUBCAT_CAP);
    });
    setProductMap(map);
  }, [products]);

  const hasAnyProducts = Object.values(productMap).some((arr) => arr.length > 0);

  return (
    <section ref={sectionRef} className="bg-white py-8 sm:py-10 overflow-hidden w-full relative">
      <div className="px-4 sm:px-6 md:px-10 lg:px-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-20 text-center mb-6 sm:mb-8">
          <Title text1="NEW" text2="ARRIVALS" />
          <p className="text-[10px] sm:text-[11px] text-gray-400 tracking-[0.25em] uppercase mt-2.5 font-light">
            Curated from artisan workshops across India
          </p>
        </div>

        <div className="space-y-2">
          {isLoading || !mountReady ? (
            <LatestSection
              category={ALL_CATEGORIES[0]}
              categoryProducts={[]}
              isEven={true}
              isLoading={true}
              visible={visible}
            />
          ) : !hasAnyProducts ? (
            <EmptyState />
          ) : (
            ALL_CATEGORIES.map((category, index) => (
              <LatestSection
                key={category.id}
                category={category}
                categoryProducts={productMap[category.id] ?? []}
                isEven={index % 2 === 0}
                isLoading={false}
                visible={visible}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
