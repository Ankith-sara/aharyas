'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useProducts } from '../context/ProductContext';
import { categoryData } from '../assets/categoryData';
import Title from './Title';
import ProductItem from './ProductItem';
import {
  ShoppingBag, X, ChevronDown, GridIcon, ListIcon, Check, SlidersHorizontal,
  ChevronUp, Tag, Building2, Sparkles, RotateCcw, ArrowUpDown, Palette
} from 'lucide-react';
import { fuzzyMatch } from '@aharyas/utils';

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Relevance' },
  { value: 'low-high', label: 'Price: Low to High' },
  { value: 'high-low', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Rating' },
  { value: 'name-az', label: 'Name: A to Z' },
  { value: 'name-za', label: 'Name: Z to A' },
];

const PRODUCTS_PER_BATCH = 20;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/\s+/g, '-');

const unslugify = (slug?: string) => {
  if (!slug) return '';
  // Check known categoryData
  for (const [catName, catObj] of Object.entries(categoryData)) {
    if (slugify(catName) === slug) return catName;
    for (const subName of catObj.subCategories) {
      if (slugify(subName) === slug) return subName;
    }
  }
  return slug.replace(/-/g, ' ');
};

const CATEGORY_WORDS = new Set(['men', 'women', 'jewelry', 'footwear']);

function itemMatchesSearch(item: any, words: string[]) {
  const catFields = [item.category, item.subCategory].filter(Boolean);
  const allFields = [
    item.name, item.category, item.subCategory, item.description,
    ...(item.tags || [])
  ].filter(Boolean);

  return words.every(word => {
    const lw = word.toLowerCase();
    if (CATEGORY_WORDS.has(lw)) {
      return catFields.some(f => fuzzyMatch(f, lw));
    }
    return allFields.some(f => fuzzyMatch(f, lw));
  });
}

interface CollectionClientProps {
  categorySlug?: string;
  companyParam?: string;
}

export default function CollectionClient({ categorySlug, companyParam }: CollectionClientProps) {
  const { products = [], currency, getProductUrl, search, setSearch } = useProducts();

  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState('relevant');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [priceRangeReady, setPriceRangeReady] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);
  const [showNewArrivals, setShowNewArrivals] = useState(false);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedFilters, setExpandedFilters] = useState({ price: true, categories: true, subcategories: true, features: false });
  const [isLoading, setIsLoading] = useState(false);

  const [displayedCount, setDisplayedCount] = useState(PRODUCTS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const resolvedName = useMemo(() => unslugify(categorySlug), [categorySlug]);
  const isCompanyPage = !!companyParam;
  
  const isCategoryPage = useMemo(() => {
    if (!resolvedName) return false;
    return Object.keys(categoryData).some(c => c.toLowerCase() === resolvedName.toLowerCase());
  }, [resolvedName]);

  const isSubCategoryPage = useMemo(() => {
    if (!resolvedName) return false;
    return !isCategoryPage;
  }, [resolvedName, isCategoryPage]);

  const isCategoryLocked = isCategoryPage || isSubCategoryPage;
  const isSubCategoryLocked = isSubCategoryPage;

  const contextProducts = useMemo(() => {
    let prods = [...products];
    if (isCompanyPage && companyParam) {
      prods = prods.filter(p => (p.company || '').toLowerCase() === companyParam.toLowerCase());
    } else if (isCategoryPage && resolvedName) {
      prods = prods.filter(p => (p.category || '').toLowerCase() === resolvedName.toLowerCase());
    } else if (isSubCategoryPage && resolvedName) {
      prods = prods.filter(p => (p.subCategory || '').toLowerCase() === resolvedName.toLowerCase());
    }
    return prods;
  }, [products, resolvedName, companyParam, isCompanyPage, isCategoryPage, isSubCategoryPage]);

  const categoryOptions = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))];
  }, [products]);

  const subCategoryOptions = useMemo(() => {
    if (isCategoryPage) {
      return [...new Set(contextProducts.map(p => p.subCategory).filter(Boolean))];
    }
    if (!isCategoryLocked) {
      const baseProds = selectedCategories.length === 0
        ? products
        : products.filter(p => selectedCategories.includes(p.category));
      return [...new Set(baseProds.map(p => p.subCategory).filter(Boolean))];
    }
    return [];
  }, [products, contextProducts, selectedCategories, isCategoryPage, isCategoryLocked]);

  const priceStats = useMemo(() => {
    if (contextProducts.length === 0) return { min: 0, max: 10000 };
    return {
      min: Math.min(...contextProducts.map(p => p.price)),
      max: Math.max(...contextProducts.map(p => p.price)),
    };
  }, [contextProducts]);

  useEffect(() => {
    if (contextProducts.length > 0 && !priceRangeReady) {
      setPriceRange({ min: priceStats.min, max: priceStats.max });
      setPriceRangeReady(true);
    }
  }, [contextProducts.length, priceStats, priceRangeReady]);

  useEffect(() => {
    setPriceRangeReady(false);
    setSelectedSubCategories([]);
    setSelectedCategories([]);
    setShowOnSale(false);
    setShowNewArrivals(false);
    setSortOption('relevant');
  }, [categorySlug, companyParam]);

  const isSorted = sortOption !== 'relevant';
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label ?? 'Relevance';

  const mainCategoryForSubcategory = useMemo(() => {
    if (!isSubCategoryPage || !resolvedName) return null;
    for (const [cat, val] of Object.entries(categoryData)) {
      if (val.subCategories.some(sub => sub.toLowerCase() === resolvedName.toLowerCase())) {
        return cat;
      }
    }
    return null;
  }, [resolvedName, isSubCategoryPage]);

  const getCollectionTitle = () => {
    if (isCompanyPage && companyParam) return companyParam;
    if (resolvedName) return resolvedName;
    if (selectedCategories.length === 1) return selectedCategories[0];
    return 'Aharyas';
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priceRange.min > priceStats.min || priceRange.max < priceStats.max) count++;
    if (showOnSale) count++;
    if (showNewArrivals) count++;
    if (selectedSubCategories.length > 0) count += selectedSubCategories.length;
    if (!isCategoryLocked && selectedCategories.length > 0) count += selectedCategories.length;
    if (sortOption !== 'relevant') count++;
    if (search) count++;
    return count;
  }, [priceRange, sortOption, showOnSale, showNewArrivals, selectedSubCategories, selectedCategories, priceStats, isCategoryLocked, search]);

  useEffect(() => {
    if (showFilters) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showFilters]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    let updated = [...contextProducts];

    if (search) {
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        updated = updated.filter(item => itemMatchesSearch(item, words));
      }
    }

    updated = updated.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

    if (selectedSubCategories.length > 0) {
      updated = updated.filter(p => selectedSubCategories.includes(p.subCategory));
    }

    if (!isCategoryLocked && selectedCategories.length > 0) {
      updated = updated.filter(p => selectedCategories.includes(p.category));
    }

    if (showOnSale) {
      updated = updated.filter(p => p.onSale || p.discount > 0);
    }

    if (showNewArrivals) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      updated = updated.filter(p => new Date(p.createdAt || p.date) > thirtyDaysAgo);
    }

    updated.sort((a, b) => {
      switch (sortOption) {
        case 'low-high': return a.price - b.price;
        case 'high-low': return b.price - a.price;
        case 'newest': return new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
        case 'popular': return (b.popularity || 0) - (a.popularity || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'name-az': return a.name.localeCompare(b.name);
        case 'name-za': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });

    setFilteredProducts(updated);
    setDisplayedCount(PRODUCTS_PER_BATCH);
    setTimeout(() => setIsLoading(false), 150);
  }, [contextProducts, search, priceRange, selectedSubCategories, selectedCategories, showOnSale, showNewArrivals, sortOption, isCategoryLocked]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || displayedCount >= filteredProducts.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount(c => Math.min(c + PRODUCTS_PER_BATCH, filteredProducts.length));
      setIsLoadingMore(false);
    }, 250);
  }, [isLoadingMore, displayedCount, filteredProducts.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const visibleProducts = filteredProducts.slice(0, displayedCount);

  const clearFilters = () => {
    setPriceRange({ min: priceStats.min, max: priceStats.max });
    setSelectedSubCategories([]);
    setSearch?.('');
    setShowOnSale(false);
    setShowNewArrivals(false);
    setSortOption('relevant');
    if (!isCategoryLocked) {
      setSelectedCategories([]);
    }
  };

  const toggleFilterSection = (section: keyof typeof expandedFilters) =>
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));

  const toggleSubCategoryFilter = (sub: string) => {
    setSelectedSubCategories(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const toggleCategoryFilter = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const CheckBox = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) => (
    <>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} className="sr-only" />
      <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 pointer-events-none ${checked ? 'bg-black border-black' : 'border-gray-300'}`}>
        {checked && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
    </>
  );

  const FilterSection = ({ title, isExpanded, onToggle, children, icon: Icon }: any) => (
    <div className="border-b border-zinc-100 last:border-b-0">
      <button onClick={onToggle} className="w-full py-4 flex justify-between items-center text-left hover:text-black transition-colors group">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={14} className="text-gray-400 group-hover:text-zinc-600 transition-colors flex-shrink-0" />}
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-700 group-hover:text-black transition-colors">{title}</span>
        </div>
        <div className="p-1 rounded-full group-hover:bg-zinc-50 transition-colors">
          {isExpanded
            ? <ChevronUp size={14} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
            : <ChevronDown size={14} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />}
        </div>
      </button>
      {isExpanded && <div className="pb-5 animate-fadeIn">{children}</div>}
    </div>
  );

  const renderFilterOptions = () => (
    <div className="space-y-1">
      <FilterSection title="Price Range" isExpanded={expandedFilters.price} onToggle={() => toggleFilterSection('price')} icon={Tag}>
        <div className="space-y-4 pt-1.5">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1 block font-medium">Min</label>
              <input
                type="number" min={priceStats.min} max={priceStats.max} value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                className="w-full border-b border-zinc-200 px-1 py-1.5 text-sm focus:border-black focus:outline-none transition-colors bg-transparent"
              />
            </div>
            <span className="text-gray-300 mt-5">—</span>
            <div className="flex-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1 block font-medium">Max</label>
              <input
                type="number" min={priceStats.min} max={priceStats.max} value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                className="w-full border-b border-zinc-200 px-1 py-1.5 text-sm focus:border-black focus:outline-none transition-colors bg-transparent"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {[
              { label: 'Under ₹1K', min: 0, max: 1000 },
              { label: '₹1K–₹3K', min: 1000, max: 3000 },
              { label: '₹3K–₹5K', min: 3000, max: 5000 },
              { label: 'Above ₹5K', min: 5000, max: priceStats.max },
            ].map((range) => {
              const isSelected = priceRange.min === range.min && priceRange.max === range.max;
              return (
                <button
                  key={range.label}
                  onClick={() => setPriceRange({ min: range.min, max: range.max })}
                  className={`px-3 py-2 rounded-sm border text-[11px] font-medium tracking-wide active:scale-95 transition-all duration-300 ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-sm font-semibold'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-black hover:text-black'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>
      </FilterSection>

      {!isCategoryLocked && categoryOptions.length > 0 && (
        <FilterSection title="Categories" isExpanded={expandedFilters.categories} onToggle={() => toggleFilterSection('categories')} icon={Palette}>
          <div className="space-y-1 pt-1.5">
            {categoryOptions.map((cat) => (
              <label key={cat} htmlFor={`cat-${cat}`} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                <CheckBox
                  id={`cat-${cat}`}
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategoryFilter(cat)}
                />
                <span className={`text-sm font-light transition-colors ${selectedCategories.includes(cat) ? 'text-black font-semibold' : 'text-gray-600 group-hover:text-black'}`}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {(!isSubCategoryLocked && subCategoryOptions.length > 0) && (
        <FilterSection title="Type" isExpanded={expandedFilters.subcategories} onToggle={() => toggleFilterSection('subcategories')} icon={Building2}>
          <div className="space-y-1 pt-1.5">
            {subCategoryOptions.map((sub) => (
              <label key={sub} htmlFor={`sub-${sub}`} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                <CheckBox
                  id={`sub-${sub}`}
                  checked={selectedSubCategories.includes(sub)}
                  onChange={() => toggleSubCategoryFilter(sub)}
                />
                <span className={`text-sm font-light transition-colors ${selectedSubCategories.includes(sub) ? 'text-black font-semibold' : 'text-gray-600 group-hover:text-black'}`}>
                  {sub}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Special Features" isExpanded={expandedFilters.features} onToggle={() => toggleFilterSection('features')} icon={Sparkles}>
        <div className="space-y-1 pt-1.5">
          <label htmlFor="feat-onsale" className="flex items-center gap-3 py-1.5 cursor-pointer group">
            <CheckBox id="feat-onsale" checked={showOnSale} onChange={() => setShowOnSale(v => !v)} />
            <span className={`text-sm font-light transition-colors ${showOnSale ? 'text-black font-semibold' : 'text-zinc-600 group-hover:text-black'}`}>On Sale</span>
          </label>
          <label htmlFor="feat-new" className="flex items-center gap-3 py-1.5 cursor-pointer group">
            <CheckBox id="feat-new" checked={showNewArrivals} onChange={() => setShowNewArrivals(v => !v)} />
            <span className={`text-sm font-light transition-colors ${showNewArrivals ? 'text-black font-semibold' : 'text-zinc-600 group-hover:text-black'}`}>New Arrivals</span>
          </label>
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black mt-16">
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <nav aria-label="Breadcrumb" className="mb-4 flex justify-center">
            <ol className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-light tracking-[0.2em] uppercase text-gray-400">
              <li>
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
              </li>
              <span className="opacity-40">/</span>
              <li>
                <Link href="/shop/collection" className="hover:text-black transition-colors">Shop</Link>
              </li>
              {isSubCategoryPage && mainCategoryForSubcategory && (
                <>
                  <span className="opacity-40">/</span>
                  <li>
                    <Link href={`/shop/${slugify(mainCategoryForSubcategory)}`} className="hover:text-black transition-colors">
                      {mainCategoryForSubcategory}
                    </Link>
                  </li>
                </>
              )}
              <span className="opacity-40">/</span>
              <li>
                <span className="text-gray-900 font-normal select-none">{getCollectionTitle()}</span>
              </li>
            </ol>
          </nav>
          <div className="text-2xl sm:text-3xl mb-2">
            <Title text1={getCollectionTitle().toUpperCase()} text2={isCompanyPage ? "COLLECTION" : "CATEGORY"} />
          </div>
          {search && (
            <p className="text-sm text-gray-500 font-light mt-1">for &quot;{search}&quot;</p>
          )}
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-[72px] z-30 bg-white/90 backdrop-blur-md border-b border-zinc-100 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setShowDesktopFilters(prev => !prev);
                } else {
                  setShowFilters(true);
                }
              }}
              className={`relative flex items-center gap-2 px-4 py-2.5 border transition-all duration-200 text-xs font-semibold uppercase tracking-wider ${
                showDesktopFilters ? 'border-black bg-black text-white hover:bg-zinc-900' : 'border-zinc-300 hover:border-black bg-white text-zinc-800'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden lg:inline">
                {showDesktopFilters ? 'Hide Filters' : 'Show Filters'}
              </span>
              <span className="lg:hidden">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-black text-white rounded-full text-[9px] flex items-center justify-center font-bold border border-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-zinc-500 hover:text-black transition-colors">
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}

            <div className="hidden sm:flex items-center border border-zinc-200 bg-zinc-50/50 p-0.5 rounded ml-2">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-sm font-medium' : 'text-gray-400'}`} aria-label="Grid view">
                <GridIcon size={14} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm font-medium' : 'text-gray-400'}`} aria-label="List view">
                <ListIcon size={14} />
              </button>
            </div>

            <span className="hidden md:block text-xs text-gray-400 font-light ml-2">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 border transition-all text-xs font-semibold uppercase tracking-widest ${
                sortOpen || isSorted ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white text-black'
              }`}
            >
              <ArrowUpDown size={13} />
              <span>{isSorted ? currentSortLabel : 'Sort'}</span>
              <ChevronDown size={12} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-56 bg-white border border-zinc-100 shadow-2xl z-50 py-1 rounded-sm">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortOption(opt.value); setSortOpen(false); }}
                    className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-xs transition-colors ${
                      sortOption === opt.value ? 'bg-zinc-50 text-black font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {opt.label}
                    {sortOption === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-full sm:w-96 flex flex-col bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <SlidersHorizontal size={16} className="text-zinc-500" />
                <h2 className="text-xs font-semibold uppercase tracking-widest">Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">{activeFiltersCount}</span>
                )}
              </div>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-zinc-50 rounded-full" aria-label="Close filters">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2 bg-white">
              {renderFilterOptions()}
            </div>

            <div className="px-6 py-5 border-t border-zinc-100 flex gap-3 bg-white pb-8 sm:pb-5">
              <button onClick={clearFilters} className="flex-1 py-3 border border-zinc-200 rounded-sm text-xs font-medium uppercase tracking-widest hover:border-black">
                Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="flex-1 py-3 bg-black text-white rounded-sm text-xs font-medium uppercase tracking-widest">
                Show {filteredProducts.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <section className="px-4 sm:px-6 lg:px-20 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto flex gap-8 items-start">
          {showDesktopFilters && (
            <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-[136px] max-h-[calc(100vh-160px)] overflow-y-auto pr-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-700">Filters</span>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-black font-semibold hover:underline">
                      Clear All
                    </button>
                  )}
                </div>
                {renderFilterOptions()}
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] w-full mb-3" />
                    <div className="bg-gray-200 h-3 w-3/4 mb-1" />
                    <div className="bg-gray-200 h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 gap-y-6">
                    {visibleProducts.map((product) => (
                      <ProductItem
                        key={product._id}
                        id={product._id}
                        image={product.images}
                        name={product.name}
                        price={product.price}
                        discount={product.discount || 0}
                        company={product.company}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex gap-4 sm:gap-6 p-4 bg-white border border-gray-200 hover:border-black transition-all"
                      >
                        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden bg-gray-50">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm sm:text-base font-medium tracking-wide">{product.name}</h3>
                            <p className="text-xs text-gray-400 font-light mb-2">{product.category} · {product.subCategory}</p>
                            {product.description && (
                              <p className="hidden sm:block text-xs text-gray-500 font-light line-clamp-2">{product.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-base sm:text-lg font-semibold">{currency}{product.price}</span>
                            <Link href={getProductUrl(product)} className="text-xs font-medium uppercase tracking-wider text-black border-b border-black">
                              View Product
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={sentinelRef} className="h-10 my-6 flex items-center justify-center">
                  {isLoadingMore && <p className="text-xs text-gray-400 uppercase tracking-widest animate-pulse">Loading more...</p>}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-zinc-100">
                <ShoppingBag size={24} className="text-zinc-400 mb-3" />
                <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-950 mb-2">No Products Found</h3>
                <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-6">No items available in this section matching your selected filters.</p>
                <button onClick={clearFilters} className="px-6 py-2.5 bg-black text-white text-[10px] font-semibold uppercase tracking-widest">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
