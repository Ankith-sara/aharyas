'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { api } from "./api";
import { Product } from "@aharyas/types";
import { createSlug, getProductUrl, fuzzyMatch, tokenize, stemWord } from "@aharyas/utils";

const RECENTLY_VIEWED_KEY = "recentlyViewed";
const SUBCATEGORY_KEY = "selectedSubCategory";
const MAX_RECENTLY_VIEWED = 5;

const PRODUCTS_CACHE = {
  data: null as Product[] | null,
  fetchedAt: 0,
  staleTime: 10 * 60 * 1000,
  isStale() {
    return Date.now() - this.fetchedAt > this.staleTime;
  },
  set(products: Product[]) {
    this.data = products;
    this.fetchedAt = Date.now();
  },
  invalidate() {
    this.fetchedAt = 0;
  },
};

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === "undefined") return fallback;
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    try {
      return JSON.parse(v) as T;
    } catch {
      return v as unknown as T;
    }
  } catch (err) {
    console.error("safeRead error", err);
    return fallback;
  }
};

const safeWrite = (key: string, value: any) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.error("safeWrite error", err);
  }
};

const safeRemove = (key: string) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error("safeRemove error", err);
  }
};

const productMatchesWords = (product: Product, words: string[]) => {
  const fields = [product.name, product.category, product.subCategory, product.description, product.tags?.join(" ")];
  return words.every((word) => fields.some((f) => fuzzyMatch(f || "", word)));
};

const getProductSearchScore = (p: Product, word: string) => {
  return fuzzyMatch(p.name, word) ? 2 : fuzzyMatch(p.subCategory, word) || fuzzyMatch(p.category, word) ? 1 : 0;
};

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
  showSearch: boolean;
  setShowSearch: (b: boolean) => void;
  selectedSubCategory: string;
  setSelectedSubCategory: (cat: string) => void;
  getProductById: (id: string) => Product | undefined;
  searchProducts: (query: string) => Product[];
  filterProducts: (filters?: { category?: string[]; subCategory?: string[]; priceRange?: { min: number; max: number }; inStock?: boolean }) => Product[];
  refreshProducts: () => void;
  addProductToRecentlyViewed: (product: Product) => void;
  getRecentlyViewed: (allProducts?: Product[]) => any[];
  clearRecentlyViewed: () => void;
  currency: string;
  backendUrl: string;
  getProductUrl: (p: any) => string;
  createSlug: (n: string) => string;
}

export const ProductContext = createContext<ProductContextType>({
  products: [],
  isLoading: false,
  search: "",
  setSearch: () => {},
  showSearch: false,
  setShowSearch: () => {},
  selectedSubCategory: "",
  setSelectedSubCategory: () => {},
  getProductById: () => undefined,
  searchProducts: () => [],
  filterProducts: () => [],
  refreshProducts: () => {},
  addProductToRecentlyViewed: () => {},
  getRecentlyViewed: () => [],
  clearRecentlyViewed: () => {},
  currency: "₹",
  backendUrl: "",
  getProductUrl: () => "/shop/collection",
  createSlug: () => "",
});

export const ProductContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedSubCategory, setSelectedSubCategoryState] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setSelectedSubCategory = useCallback((cat: string) => {
    setSelectedSubCategoryState(cat);
    safeWrite(SUBCATEGORY_KEY, cat);
  }, []);

  useEffect(() => {
    const stored = safeRead<string>(SUBCATEGORY_KEY, "");
    if (stored) setSelectedSubCategoryState(stored);
  }, []);

  const getProductsData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && PRODUCTS_CACHE.data && !PRODUCTS_CACHE.isStale()) {
      if (isMounted.current) setProducts(PRODUCTS_CACHE.data);
      return;
    }
    try {
      setIsLoading(true);
      const { data } = await api.get("/api/v1/product/all");
      if (data.success && isMounted.current) {
        PRODUCTS_CACHE.set(data.products);
        setProducts(data.products);
      } else if (!data.success) {
        if (PRODUCTS_CACHE.data) setProducts(PRODUCTS_CACHE.data);
        toast.error("Unable to load products. Please refresh.");
      }
    } catch (err) {
      console.error("getProductsData error", err);
      if (PRODUCTS_CACHE.data && isMounted.current) {
        setProducts(PRODUCTS_CACHE.data);
        toast.warn("Showing cached products — check your connection.");
      } else {
        toast.error("Unable to load products. Please check your connection.");
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getProductsData();
  }, [getProductsData]);

  const getProductById = useCallback((id: string) => products.find((p) => p._id === id), [products]);

  const searchProducts = useCallback(
    (query: string) => {
      if (!query?.trim()) return products;
      const words = tokenize(query);
      if (!words.length) return products;
      return products
        .filter((p) => productMatchesWords(p, words))
        .sort((a, b) => {
          const scoreA = words.reduce((s, w) => s + getProductSearchScore(a, w), 0);
          const scoreB = words.reduce((s, w) => s + getProductSearchScore(b, w), 0);
          return scoreB - scoreA;
        });
    },
    [products]
  );

  const filterProducts = useCallback(
    (filters: { category?: string[]; subCategory?: string[]; priceRange?: { min: number; max: number }; inStock?: boolean } = {}) => {
      let r = [...products];
      if (filters.category?.length) r = r.filter((p) => filters.category!.includes(p.category));
      if (filters.subCategory?.length) r = r.filter((p) => filters.subCategory!.includes(p.subCategory));
      if (filters.priceRange) r = r.filter((p) => p.price >= filters.priceRange!.min && p.price <= filters.priceRange!.max);
      if (filters.inStock) r = r.filter((p) => p.inStock);
      return r;
    },
    [products]
  );

  const addProductToRecentlyViewed = useCallback((product: Product) => {
    let viewed = safeRead<any[]>(RECENTLY_VIEWED_KEY, []);
    viewed = viewed.filter((p) => p._id !== product._id);
    viewed.unshift({
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      category: product.category,
      subCategory: product.subCategory,
      viewedAt: new Date().toISOString(),
    });
    safeWrite(RECENTLY_VIEWED_KEY, viewed.slice(0, MAX_RECENTLY_VIEWED));
  }, []);

  const getRecentlyViewed = useCallback(
    (allProducts: Product[] = []) => {
      let viewed = safeRead<any[]>(RECENTLY_VIEWED_KEY, []);
      if (allProducts.length) {
        viewed = viewed
          .map((vp) => {
            const live = allProducts.find((p) => p._id === vp._id);
            return live ? { ...live, viewedAt: vp.viewedAt } : vp;
          })
          .filter((vp) => allProducts.some((p) => p._id === vp._id));
        safeWrite(RECENTLY_VIEWED_KEY, viewed);
      }
      return viewed;
    },
    []
  );

  const clearRecentlyViewed = useCallback(() => safeRemove(RECENTLY_VIEWED_KEY), []);

  const refreshProducts = useCallback(() => {
    PRODUCTS_CACHE.invalidate();
    getProductsData(true);
  }, [getProductsData]);

  const value = useMemo(
    () => ({
      products,
      isLoading,
      search,
      setSearch,
      showSearch,
      setShowSearch,
      selectedSubCategory,
      setSelectedSubCategory,
      getProductById,
      searchProducts,
      filterProducts,
      refreshProducts,
      addProductToRecentlyViewed,
      getRecentlyViewed,
      clearRecentlyViewed,
      currency: "₹",
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
      getProductUrl,
      createSlug,
    }),
    [
      products,
      isLoading,
      search,
      showSearch,
      selectedSubCategory,
      setSelectedSubCategory,
      getProductById,
      searchProducts,
      filterProducts,
      refreshProducts,
      addProductToRecentlyViewed,
      getRecentlyViewed,
      clearRecentlyViewed,
    ]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = () => useContext(ProductContext);
