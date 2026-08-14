import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { api } from "./api";

export const ProductContext = createContext();

const RECENTLY_VIEWED_KEY = "recentlyViewed";
const SUBCATEGORY_KEY = "selectedSubCategory";
const MAX_RECENTLY_VIEWED = 5;
const PRODUCTS_CACHE = {
    data: null,
    fetchedAt: 0,
    staleTime: 10 * 60 * 1000,
    isStale() { return Date.now() - this.fetchedAt > this.staleTime; },
    set(products) { this.data = products; this.fetchedAt = Date.now(); },
    invalidate() { this.fetchedAt = 0; },
};

const safeRead = (key, fallback = null) => {
    try {
        const v = localStorage.getItem(key);
        if (!v) return fallback;
        try {
            return JSON.parse(v);
        } catch {
            return v;
        }
    } catch (err) {
        console.error("safeRead error", err);
        return fallback;
    }
};
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error("safeWrite error", err); } };
const safeRemove = (key) => { try { localStorage.removeItem(key); } catch (err) { console.error("safeRemove error", err); } };

// Tiny search helpers
const stemWord = (w) =>
    w.replace(/ies$/, "y").replace(/ves$/, "f")
        .replace(/ses$|shes$|ches$|xes$|zes$/, "s")
        .replace(/s$/, "").replace(/ing$/, "").replace(/ed$/, "")
        .replace(/er$/, "").replace(/ness$/, "").replace(/tion$/, "");

const tokenize = (text) =>
    text ? text.toLowerCase().split(/[\s,\-_/|&]+/).filter((w) => w.length > 1) : [];

const wordBound = (text, word) => {
    try {
        return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
    } catch { return text.toLowerCase().includes(word.toLowerCase()); }
};

const CATEGORY_TERMS = new Set(['men', 'women', 'jewelry', 'footwear']);

const fuzzyMatch = (source, query) => {
    if (!source || !query) return false;
    const s = source.toLowerCase();
    const q = query.toLowerCase();

    // Category terms: strict word-boundary only
    if (CATEGORY_TERMS.has(q)) {
        return wordBound(s, q);
    }

    // Word-boundary match
    if (wordBound(s, q)) return true;

    const ns = s.replace(/[-_\s]/g, "");
    const nq = q.replace(/[-_\s]/g, "");
    if (nq.length > 2 && ns.includes(nq)) return true;

    // Stemmed word-boundary match
    const qs = stemWord(q);
    if (qs.length > 2) {
        const sourceWords = tokenize(s).map(w => stemWord(w));
        if (sourceWords.includes(qs)) return true;
    }

    return false;
};

const productMatchesWords = (product, words) => {
    const fields = [product.name, product.category, product.subCategory, product.description, product.tags?.join(" ")];
    return words.every((word) => fields.some((f) => fuzzyMatch(f, word)));
};

const getProductSearchScore = (p, word) => {
    return fuzzyMatch(p.name, word) ? 2 : (fuzzyMatch(p.subCategory, word) || fuzzyMatch(p.category, word) ? 1 : 0);
};

export const createSlug = (name) => {
    if (!name) return "";
    return name
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/\s+/g, "-");
};

export const getProductUrl = (product) => {
    if (!product) return "/shop/collection";
    const slugifiedName = createSlug(product.slug || product.name);
    return `/product/${slugifiedName}-${product._id}`;
};

const ProductContextProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [selectedSubCategory, setSelectedSubCategoryState] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

    // Persist subcategory
    const setSelectedSubCategory = useCallback((cat) => {
        setSelectedSubCategoryState(cat);
        safeWrite(SUBCATEGORY_KEY, cat);
    }, []);

    useEffect(() => {
        const stored = safeRead(SUBCATEGORY_KEY, "");
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

    useEffect(() => { getProductsData(); }, [getProductsData]);

    const getProductById = useCallback((id) => products.find((p) => p._id === id), [products]);

    const searchProducts = useCallback(
        (query) => {
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
        (filters = {}) => {
            let r = [...products];
            if (filters.category?.length) r = r.filter((p) => filters.category.includes(p.category));
            if (filters.subCategory?.length) r = r.filter((p) => filters.subCategory.includes(p.subCategory));
            if (filters.priceRange) r = r.filter((p) => p.price >= filters.priceRange.min && p.price <= filters.priceRange.max);
            if (filters.inStock) r = r.filter((p) => p.inStock);
            return r;
        },
        [products]
    );

    // Recently Viewed
    const addProductToRecentlyViewed = useCallback((product) => {
        let viewed = safeRead(RECENTLY_VIEWED_KEY, []);
        viewed = viewed.filter((p) => p._id !== product._id);
        viewed.unshift({
            _id: product._id, name: product.name, price: product.price,
            images: product.images, category: product.category,
            subCategory: product.subCategory, viewedAt: new Date().toISOString(),
        });
        safeWrite(RECENTLY_VIEWED_KEY, viewed.slice(0, MAX_RECENTLY_VIEWED));
    }, []);

    const getRecentlyViewed = useCallback(
        (allProducts = []) => {
            let viewed = safeRead(RECENTLY_VIEWED_KEY, []);
            if (allProducts.length) {
                viewed = viewed
                    .map((vp) => { const live = allProducts.find((p) => p._id === vp._id); return live ? { ...live, viewedAt: vp.viewedAt } : vp; })
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

    const value = useMemo(() => ({
        products, isLoading,
        search, setSearch, showSearch, setShowSearch,
        selectedSubCategory, setSelectedSubCategory,
        getProductById, searchProducts, filterProducts,
        refreshProducts,
        addProductToRecentlyViewed, getRecentlyViewed, clearRecentlyViewed,
        currency: "₹",
        backendUrl: import.meta.env.VITE_BACKEND_URL,
        getProductUrl,
        createSlug,
    }), [
        products, isLoading, search, showSearch, selectedSubCategory,
        setSelectedSubCategory, getProductById, searchProducts, filterProducts,
        refreshProducts,
        addProductToRecentlyViewed, getRecentlyViewed, clearRecentlyViewed,
    ]);

    return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export default ProductContextProvider;

export const useProducts = () => useContext(ProductContext);