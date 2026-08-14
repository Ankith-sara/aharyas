import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { categoryData } from '../assets/categoryData';
import { getOriginalNameFromSlug, getCompanyFromSlug } from '../utils/seo';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import RecentlyViewed from '../components/RecentlyViewed';
import usePageMeta from '../components/usePageMeta';
import {
  ShoppingBag, X, ChevronDown, GridIcon, ListIcon, Check, SlidersHorizontal,
  Star, ChevronUp, Tag, Building2, Sparkles, RotateCcw, ArrowUpDown, ChevronRight, Palette
} from 'lucide-react';

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

const stemWord = w => w.replace(/ies$/, 'y').replace(/ves$/, 'f').replace(/ses$|shes$|ches$|xes$|zes$/, 's').replace(/s$/, '').replace(/ing$/, '').replace(/ed$/, '');
const wordBoundary = (text, word) => {
  try {
    return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
  } catch { return text.toLowerCase().includes(word.toLowerCase()); }
};

const CATEGORY_WORDS = new Set(['men', 'women', 'jewelry', 'footwear']);

function itemMatchesSearch(item, words) {
  const catFields = [item.category, item.subCategory].filter(Boolean);
  const allFields = [
    item.name, item.category, item.subCategory, item.description,
    ...(item.tags || [])
  ].filter(Boolean);

  return words.every(word => {
    const lw = word.toLowerCase();

    // Category words
    if (CATEGORY_WORDS.has(lw)) {
      return catFields.some(f => wordBoundary(f, lw));
    }

    return allFields.some(f => {
      if (wordBoundary(f, lw)) return true;

      const nf = f.replace(/[-_\s]/g, '').toLowerCase();
      const nw = lw.replace(/[-_\s]/g, '');
      if (nw.length > 2 && nf.includes(nw)) return true;

      const ws = stemWord(lw);
      if (ws.length > 2 && wordBoundary(f, ws)) return true;

      return false;
    });
  });
}

const Collection = () => {
  const { categoryOrSubcategory, company } = useParams();
  const { products = [], currency, getProductUrl, search, setSearch, showSearch } = useProducts();
  const { navigate } = useAuth();
  const location = useLocation();

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortOption, setSortOption] = useState('relevant');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [priceRangeReady, setPriceRangeReady] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);
  const [showNewArrivals, setShowNewArrivals] = useState(false);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [expandedFilters, setExpandedFilters] = useState({ price: true, categories: true, subcategories: true, features: false });
  const [isLoading, setIsLoading] = useState(false);

  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(PRODUCTS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // 1. Identify Page Context
  const resolvedMeta = useMemo(() => {
    return getOriginalNameFromSlug(categoryOrSubcategory);
  }, [categoryOrSubcategory]);

  const resolvedName = resolvedMeta?.name || null;
  const isCompanyPage = !!company;
  const isCategoryPage = !isCompanyPage && resolvedMeta?.type === 'category';
  const isSubCategoryPage = !isCompanyPage && resolvedMeta?.type === 'subcategory';

  const isCategoryLocked = isCategoryPage || isSubCategoryPage;
  const isSubCategoryLocked = isSubCategoryPage;

  const companyObj = useMemo(() => {
    return getCompanyFromSlug(company);
  }, [company]);

  const companyDisplayName = companyObj ? companyObj.displayName : company;

  // 2. Filter products based on page context 
  const contextProducts = useMemo(() => {
    let prods = [...products];
    if (isCompanyPage && company) {
      const companyName = companyObj ? companyObj.name : company;
      prods = prods.filter(p => (p.company || '').toLowerCase() === companyName.toLowerCase());
    } else if (isCategoryPage && resolvedName) {
      prods = prods.filter(p => p.category === resolvedName);
    } else if (isSubCategoryPage && resolvedName) {
      prods = prods.filter(p => p.subCategory === resolvedName);
    }
    return prods;
  }, [products, resolvedName, company, companyObj, isCompanyPage, isCategoryPage, isSubCategoryPage]);

  // Extract unique categories and subcategories in the current context
  const categoryOptions = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))];
  }, [products]);

  const subCategoryOptions = useMemo(() => {
    if (isCategoryPage) {
      return [...new Set(contextProducts.map(p => p.subCategory).filter(Boolean))];
    }
    if (!isCategoryLocked) {
      // General catalog page subcategories based on currently checked categories
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

  // Set pricing range once stats are calculated
  useEffect(() => {
    if (contextProducts.length > 0 && !priceRangeReady) {
      setPriceRange({ min: priceStats.min, max: priceStats.max });
      setPriceRangeReady(true);
    }
  }, [contextProducts.length, priceStats, priceRangeReady]);

  // If page context parameter changes, reset states and recompute prices
  useEffect(() => {
    setPriceRangeReady(false);
    setSelectedSubCategories([]);
    setSelectedCategories([]);
    setShowOnSale(false);
    setShowNewArrivals(false);
    setSortOption('relevant');
  }, [categoryOrSubcategory, company]);

  // Read URL query parameters for general page 
  useEffect(() => {
    if (!isCategoryLocked && !isCompanyPage) {
      const params = new URLSearchParams(location.search);
      const catParam = params.get('category');
      const subParam = params.get('subcategory');

      if (catParam) {
        setSelectedCategories(catParam.split(','));
      } else {
        setSelectedCategories([]);
      }

      if (subParam) {
        setSelectedSubCategories(subParam.split(','));
      } else {
        setSelectedSubCategories([]);
      }
    }
  }, [location.search, isCategoryLocked, isCompanyPage]);

  const isSorted = sortOption !== 'relevant';
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label ?? 'Relevance';

  // Find Parent Category for Subcategory Page Breadcrumbs
  const mainCategoryForSubcategory = useMemo(() => {
    if (!isSubCategoryPage || !resolvedName) return null;
    for (const [cat, val] of Object.entries(categoryData)) {
      if (val.subCategories.includes(resolvedName)) {
        return cat;
      }
    }
    return null;
  }, [resolvedName, isSubCategoryPage]);

  const getCollectionTitle = () => {
    if (isCompanyPage && companyDisplayName) return companyDisplayName;
    if (resolvedName) return resolvedName;

    // Check if query category is loaded
    if (selectedCategories.length === 1) return selectedCategories[0];
    return 'Aharyas';
  };

  // Active filters count
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

  // Document title and meta description
  const pageTitle = isCompanyPage
    ? `${companyDisplayName} Collection`
    : `${getCollectionTitle()} Collection`;

  const pageDesc = isCompanyPage
    ? `Shop ${companyDisplayName} on Aharyas, authentic handcrafted products by Indian artisans.`
    : `Browse ${getCollectionTitle()} on Aharyas, handcrafted by skilled Indian artisans.`;

  usePageMeta({
    title: pageTitle, description: pageDesc
  });

  // Lock body scroll when mobile filter drawer is open 
  useEffect(() => {
    if (showFilters) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showFilters]);

  // Close sort dropdown on outside click 
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const productTimestamp = (p) => {
    if (p.createdAt) return new Date(p.createdAt).getTime();
    if (p.date) return typeof p.date === 'number' ? p.date : new Date(p.date).getTime();
    return 0;
  };

  const productUpdateTime = (p) => {
    if (p.updatedAt) return new Date(p.updatedAt).getTime();
    if (p.createdAt) return new Date(p.createdAt).getTime();
    if (p.date) return typeof p.date === 'number' ? p.date : new Date(p.date).getTime();
    return 0;
  };

  const sortByUpdateTime = (arr) => {
    return [...arr].sort((a, b) => productUpdateTime(b) - productUpdateTime(a));
  };

  // Filter & sort products
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

    // Sort Products
    updated.sort((a, b) => {
      switch (sortOption) {
        case 'low-high': return a.price - b.price;
        case 'high-low': return b.price - a.price;
        case 'newest': return productTimestamp(b) - productTimestamp(a);
        case 'popular': return (b.popularity || 0) - (a.popularity || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'name-az': return a.name.localeCompare(b.name);
        case 'name-za': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });

    if (sortOption === 'relevant') {
      updated = sortByUpdateTime(updated);
    }

    setFilteredProducts(updated);
    setDisplayedCount(PRODUCTS_PER_BATCH);
    setTimeout(() => setIsLoading(false), 150);
  }, [contextProducts, search, priceRange, selectedSubCategories, selectedCategories, showOnSale, showNewArrivals, sortOption, isCategoryLocked]);

  // Infinite scroll
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

  const toggleFilterSection = (section) =>
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));

  const toggleSubCategoryFilter = (sub) => {
    setSelectedSubCategories(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const toggleCategoryFilter = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const CheckBox = ({ checked, onChange, id }) => (
    <>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} className="sr-only" />
      <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 pointer-events-none ${checked ? 'bg-black border-black' : 'border-gray-300'}`}>
        {checked && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
    </>
  );

  const FilterSection = ({ title, isExpanded, onToggle, children, icon: Icon }) => (
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

  const getSubCategoryDisplayLabel = (name) => {
    if (!name) return '';
    return name
      .replace(/^Women\s+/, '')
      .replace(/^Men\s+/, '');
  };

  const renderFilterOptions = () => (
    <div className="space-y-1">
      {/* Price Range */}
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
                  className={`px-3 py-2 rounded-sm border text-[11px] font-medium tracking-wide active:scale-95 transition-all duration-300
                    ${isSelected
                      ? 'bg-black text-white border-black shadow-sm font-semibold'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-black hover:text-black shadow-[0_1px_2px_rgba(0,0,0,0.01)]'}`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>
      </FilterSection>

      {/* Categories Filter */}
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

      {/* Subcategories (Type) */}
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
                  {getSubCategoryDisplayLabel(sub)}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Special Features */}
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
      {/* Header & Title */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <nav aria-label="Breadcrumb" className="mb-4 flex justify-center">
            <ol className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-light tracking-[0.2em] uppercase text-gray-400">
              <li>
                <Link to="/" className="hover:text-black transition-colors">Home</Link>
              </li>
              <span className="opacity-40">/</span>
              <li>
                <Link to="/shop/collection" className="hover:text-black transition-colors">Shop</Link>
              </li>
              {isSubCategoryPage && mainCategoryForSubcategory && (
                <>
                  <span className="opacity-40">/</span>
                  <li>
                    <Link to={`/shop/${encodeURIComponent(mainCategoryForSubcategory)}`} className="hover:text-black transition-colors">
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
            <p className="text-sm text-gray-500 font-light mt-1">for "{search}"</p>
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
              className={`relative flex items-center gap-2 px-4 py-2.5 border transition-all duration-200 text-xs font-semibold uppercase tracking-wider
                ${(showDesktopFilters)
                  ? 'border-black bg-black text-white hover:bg-zinc-900'
                  : 'border-zinc-300 hover:border-black bg-white text-zinc-800'
                }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden lg:inline">
                {showDesktopFilters ? 'Hide Filters' : 'Show Filters'}
              </span>
              <span className="lg:hidden">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-black text-white rounded-full text-[9px] flex items-center justify-center font-bold tracking-tight shadow-md border border-white animate-scaleIn">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-zinc-500 hover:text-black transition-colors active:scale-95">
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}

            <div className="hidden sm:flex items-center border border-zinc-200 bg-zinc-50/50 p-0.5 rounded ml-2">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded transition-all duration-300 active:scale-95 ${viewMode === 'grid' ? 'bg-white text-black shadow-sm font-medium border border-zinc-100' : 'text-gray-400 hover:text-zinc-600'}`} aria-label="Grid view">
                <GridIcon size={14} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded transition-all duration-300 active:scale-95 ${viewMode === 'list' ? 'bg-white text-black shadow-sm font-medium border border-zinc-100' : 'text-gray-400 hover:text-zinc-600'}`} aria-label="List view">
                <ListIcon size={14} />
              </button>
            </div>

            <span className="hidden md:block text-xs text-gray-400 font-light ml-2">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Right: Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 border transition-all duration-300 text-xs font-semibold uppercase tracking-widest shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98]
                ${sortOpen || isSorted
                  ? 'border-black bg-black text-white hover:bg-zinc-900'
                  : 'border-zinc-200 bg-white text-black hover:border-black hover:bg-zinc-50'}`}
            >
              <ArrowUpDown size={13} />
              <span>{isSorted ? currentSortLabel : 'Sort'}</span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${sortOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-56 bg-white border border-zinc-100 shadow-2xl z-50 py-1 rounded-sm transition-all duration-300 animate-fadeIn">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortOption(opt.value); setSortOpen(false); }}
                    className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-xs transition-colors ${sortOption === opt.value
                      ? 'bg-zinc-50 text-black font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'
                      }`}
                  >
                    {opt.label}
                    {sortOption === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0 animate-scaleIn" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Drawer (Mobile) */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-full sm:w-96 flex flex-col bg-white shadow-2xl animate-productDrawerIn overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <SlidersHorizontal size={16} className="text-zinc-500" />
                <h2 className="text-xs font-semibold uppercase tracking-widest">Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-scaleIn">{activeFiltersCount}</span>
                )}
              </div>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-zinc-50 transition-colors rounded-full" aria-label="Close filters">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-2 bg-white">
              {renderFilterOptions()}
            </div>

            <div className="px-6 py-5 border-t border-zinc-100 flex-shrink-0 flex gap-3 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)] pb-8 sm:pb-5">
              <button onClick={clearFilters} className="flex-1 py-3 border border-zinc-200 rounded-sm text-xs font-medium uppercase tracking-widest hover:border-black hover:bg-zinc-50 active:scale-[0.98] transition-all duration-300">
                Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="flex-1 py-3 bg-black hover:bg-zinc-900 text-white rounded-sm text-xs font-medium uppercase tracking-widest active:scale-[0.98] transition-all duration-300 shadow-md">
                Show {filteredProducts.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <section className="px-4 sm:px-6 lg:px-20 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto flex gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          {showDesktopFilters && (
            <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-[136px] max-h-[calc(100vh-160px)] overflow-y-auto pr-4 scrollbar-thin">
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

          {/* Product Listing Grid/List */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 animate-pulse">
                    <div className="shimmer-gradient aspect-[3/4] w-full mb-3 rounded-none border border-zinc-100" />
                    <div className="shimmer-gradient h-2 w-1/3 mb-2 rounded-none" />
                    <div className="shimmer-gradient h-3.5 w-5/6 mb-1.5 rounded-none" />
                    <div className="shimmer-gradient h-3 w-1/4 rounded-none" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {visibleProducts.map((product) => (
                      <div key={product._id}>
                        <ProductItem
                          name={product.name} id={product._id}
                          price={product.price} image={product.images}
                          currency={currency} company={product.company}
                          discount={product.discount || 0}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {visibleProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-white border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all duration-300"
                      >
                        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden bg-gray-50">
                          <img src={product.images[0]} alt={product.name}
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="text-sm sm:text-base font-medium tracking-wide line-clamp-2 flex-1">{product.name}</h3>
                              {product.rating && (
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                  <Star size={11} className="text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-500">{product.rating}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-light mb-2">{product.category} · {product.subCategory}</p>
                            {product.description && (
                              <p className="hidden sm:block text-xs text-gray-500 font-light leading-relaxed line-clamp-2">{product.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            {product.discount > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg font-semibold text-red-600">{currency}{Math.round(product.price * (1 - product.discount / 100))}</span>
                                <span className="text-sm text-gray-400 line-through">{currency}{product.price}</span>
                                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 uppercase">{product.discount}% OFF</span>
                              </div>
                            ) : (
                              <span className="text-base sm:text-lg font-medium">{currency}{product.price}</span>
                            )}
                            <button
                              onClick={() => navigate(getProductUrl(product))}
                              className="text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white border border-zinc-100/50 my-4">
                <div className="relative mb-6 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-zinc-200 flex items-center justify-center relative">
                    <ShoppingBag size={20} className="text-zinc-400 stroke-[1.25]" />
                    <div className="absolute inset-0 rounded-full border border-transparent border-t-zinc-400 animate-spin [animation-duration:8s]" />
                  </div>
                </div>

                <h3 className="text-sm font-semibold tracking-[0.3em] uppercase text-zinc-950 mb-3">
                  No Products Found
                </h3>
                <p className="text-xs text-zinc-400 font-light max-w-sm leading-relaxed mb-8">
                  {isCompanyPage
                    ? `We couldn't find any artisanal pieces currently active under ${companyDisplayName}. Check back soon for brand-new arrivals.`
                    : `No items available in this section matching your selected filters. Please adjust your criteria to explore more collections.`}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs">
                  <button
                    onClick={clearFilters}
                    className="flex-1 py-3 bg-black text-white text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-zinc-900 active:scale-95 transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 py-3 border border-zinc-300 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all duration-300"
                  >
                    Browse All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-16 flex items-center justify-center mt-4">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-xs text-gray-400 tracking-wider uppercase">
              <div className="w-4 h-4 border border-gray-300 border-t-black rounded-full animate-spin" />
              Loading more
            </div>
          )}
          {!isLoadingMore && displayedCount >= filteredProducts.length && filteredProducts.length > PRODUCTS_PER_BATCH && (
            <p className="text-xs text-gray-300 tracking-widest uppercase">
              All {filteredProducts.length} products shown
            </p>
          )}
        </div>
      </section>

      {filteredProducts.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-20 mb-16">
          <div className="max-w-7xl mx-auto">
            <RecentlyViewed />
          </div>
        </section>
      )}

      <style>{`
        @keyframes productDrawerIn {
          from { transform: translateX(-100%); opacity: 0.5; }
          to   { transform: translateX(0);     opacity: 1;   }
        }
        .animate-productDrawerIn { animation: productDrawerIn 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
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

export default Collection;