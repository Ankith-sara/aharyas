'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useProducts } from '../context/ProductContext';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, ArrowRight, Tag } from 'lucide-react';
import { fuzzyMatch } from '@aharyas/utils';

const RECENT_KEY = 'aharyas_v2_recent_searches';
const MAX_RECENTS = 6;
const MAX_RESULTS = 8;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/\s+/g, '-');

const CATEGORY_TERMS = new Set(['men', 'women', 'jewelry', 'footwear']);

const scoreProduct = (product: any, q: string) => {
  if (!q) return 0;
  const lq = q.toLowerCase();
  const normalize = (str: string) => (str || '').toLowerCase().replace(/[-_\s]/g, '');

  const fields = [
    { text: product.name, weight: 4, isCat: false },
    { text: product.subCategory, weight: 3, isCat: true },
    { text: product.category, weight: 2, isCat: true },
    { text: product.description, weight: 1, isCat: false },
    { text: (product.tags || []).join(' '), weight: 2, isCat: false },
  ];

  let total = 0;
  for (const { text, weight, isCat } of fields) {
    if (!text) continue;
    const lt = text.toLowerCase();
    const normLt = normalize(text);
    const normLq = normalize(lq);

    const isCatQuery = CATEGORY_TERMS.has(lq);
    if (isCatQuery && !isCat) continue;

    if (lt === lq || normLt === normLq) {
      total += weight * 10;
    } else if (fuzzyMatch(lt, lq)) {
      total += lt.startsWith(lq) ? weight * 5 : weight * 2;
    } else if (normLq.length > 2 && normLt.includes(normLq)) {
      total += weight * 2;
    } else {
      for (const w of lq.split(/\s+/).filter(Boolean)) {
        if (CATEGORY_TERMS.has(w) && !isCat) continue;
        if (fuzzyMatch(lt, w)) {
          total += weight;
        } else {
          const nw = normalize(w);
          if (nw.length > 2 && normLt.includes(nw)) total += weight;
        }
      }
    }
  }
  return total;
};

const readRecents = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeRecents = (arr: string[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('writeRecents error', err);
  }
};

const clearRecents = () => {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch (err) {
    console.error('clearRecents error', err);
  }
};

const DEFAULT_CATEGORIES = ['Sarees', 'Tops', 'Kurtas', 'Bags & Purses', 'Kondapalli Bommalu', 'Paintings', 'Journals'];

export default function SearchBar() {
  const { search, setSearch, showSearch, setShowSearch, products, getProductUrl } = useProducts();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setRecents(readRecents());
  }, []);

  useEffect(() => {
    if (showSearch) {
      setQuery(search || '');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [showSearch, search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showSearch ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSearch]);

  useEffect(() => {
    if (!query.trim() || !products?.length) {
      setResults([]);
      return;
    }
    const scored = products
      .map((p) => ({ p, s: scoreProduct(p, query.trim()) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_RESULTS)
      .map(({ p }) => p);
    setResults(scored);
  }, [query, products]);

  const handleClose = useCallback(() => {
    setShowSearch?.(false);
    setQuery('');
    setResults([]);
  }, [setShowSearch]);

  const saveRecent = useCallback(
    (term: string) => {
      const updated = [term, ...recents.filter((r) => r !== term)].slice(0, MAX_RECENTS);
      setRecents(updated);
      writeRecents(updated);
    },
    [recents]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    const q = query.trim();
    if (!q) return;
    saveRecent(q);
    setSearch?.(q);
    router.push('/shop/collection');
    handleClose();
  };

  const handleProductClick = (product: any) => {
    saveRecent(product.name);
    handleClose();
    router.push(getProductUrl(product));
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleCategoryClick = (cat: string) => {
    handleClose();
    router.push(`/shop/${slugify(cat)}`);
  };

  if (!showSearch) return null;

  const showRecents = !query && recents.length > 0;
  const showResults = !!query && results.length > 0;
  const showEmpty = !!query && results.length === 0;
  const resultCats = [...new Set(results.map((p) => p.subCategory).filter(Boolean))].slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="absolute top-0 left-0 right-0 bg-white shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 sm:px-8 py-4 border-b border-gray-100">
          <Search size={20} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories, artisans…"
            className="flex-1 text-base text-black placeholder-gray-400 bg-transparent focus:outline-none"
            aria-label="Search Aharyas"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-black transition-colors no-min-h"
              aria-label="Clear"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400 transition-colors no-min-h"
            aria-label="Close search"
          >
            Close
          </button>
        </form>

        {/* Results panel */}
        <div className="max-h-[70vh] overflow-y-auto px-4 sm:px-8 pb-6">
          {/* Recent searches */}
          {showRecents && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Clock size={11} aria-hidden="true" /> Recent
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRecents([]);
                    clearRecents();
                  }}
                  className="text-[10px] text-gray-400 hover:text-black transition-colors no-min-h"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recents.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleRecentClick(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-sm text-gray-600 hover:border-black hover:text-black transition-colors no-min-h"
                  >
                    <Clock size={11} className="text-gray-300" aria-hidden="true" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Default category browse */}
          {!query && !showRecents && (
            <div className="pt-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Browse categories</p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-sm text-gray-600 hover:border-black hover:text-black transition-colors no-min-h"
                  >
                    <Tag size={11} aria-hidden="true" />
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {showResults && (
            <div className="pt-4">
              {resultCats.length > 0 && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400">In</span>
                  {resultCats.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-black hover:text-white text-gray-700 transition-colors no-min-h"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
              <div className="divide-y divide-gray-50">
                {results.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className="w-full flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="w-12 h-12 bg-gray-100 flex-shrink-0 overflow-hidden">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate group-hover:underline underline-offset-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{product.subCategory}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-medium text-black price">
                        ₹{product.price?.toLocaleString('en-IN')}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-gray-300 group-hover:text-black transition-colors"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ))}
              </div>
              {results.length >= MAX_RESULTS && (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-full mt-3 py-3 border border-gray-200 text-sm text-gray-600 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
                >
                  See all results for &quot;{query}&quot; <ArrowRight size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="pt-10 pb-6 text-center">
              <p className="text-gray-400 text-sm">
                No products found for <span className="text-black font-medium">&quot;{query}&quot;</span>
              </p>
              <p className="text-gray-300 text-xs mt-1">Try different keywords or browse a category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
