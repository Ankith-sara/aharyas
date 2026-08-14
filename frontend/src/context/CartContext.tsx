'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { api } from "./api";
import { useAuth } from "./AuthContext";
import { useProducts } from "./ProductContext";
import { CartItemsState, Product, Coupon } from "@aharyas/types";
import { calculateDeliveryFee } from "@aharyas/utils";

const GUEST_CART_KEY = "guestCart";
const GUEST_WISHLIST_KEY = "guestWishlist";

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === "undefined") return fallback;
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
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

interface CartContextType {
  cartItems: CartItemsState;
  setCartItems: React.Dispatch<React.SetStateAction<CartItemsState>>;
  wishlistItems: string[];
  appliedCoupon: Coupon | null;
  applyCoupon: (c: Coupon) => void;
  clearCoupon: () => void;
  getAppliedCoupon: () => Coupon | null;
  delivery_fee: number;
  getDeliveryFee: (country?: string, state?: string) => number;
  addToCart: (itemId: string, size?: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, size: string, quantity: number) => void;
  removeFromCart: (itemId: string, size: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartAmount: () => number;
  getCartItems: () => Array<Product & { size: string; quantity: number }>;
  addToWishlist: (itemId: string) => Promise<boolean>;
  removeFromWishlist: (itemId: string) => Promise<boolean>;
  toggleWishlist: (itemId: string) => Promise<boolean>;
  isInWishlist: (id: string) => boolean;
  getWishlistCount: () => number;
  getWishlistProducts: () => Product[];
}

export const CartContext = createContext<CartContextType>({
  cartItems: {},
  setCartItems: () => {},
  wishlistItems: [],
  appliedCoupon: null,
  applyCoupon: () => {},
  clearCoupon: () => {},
  getAppliedCoupon: () => null,
  delivery_fee: 50,
  getDeliveryFee: calculateDeliveryFee,
  addToCart: async () => false,
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  getCartCount: () => 0,
  getCartAmount: () => 0,
  getCartItems: () => [],
  addToWishlist: async () => false,
  removeFromWishlist: async () => false,
  toggleWishlist: async () => false,
  isInWishlist: () => false,
  getWishlistCount: () => 0,
  getWishlistProducts: () => [],
});

export const CartContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { products } = useProducts();
  const [cartItems, setCartItems] = useState<CartItemsState>({});
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getDeliveryFee = useCallback((country = "", state = "") => {
    return calculateDeliveryFee(country, state);
  }, []);

  const syncCartToServer = useCallback(async (operation: string, payload: any) => {
    if (typeof window === "undefined") return;
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      await api.post(`/api/v1/cart/${operation}`, { userId, ...payload });
    } catch (err) {
      console.error("syncCartToServer error", err);
    }
  }, []);

  const addToCart = useCallback(
    async (itemId: string, size?: string, quantity = 1) => {
      const productId = String(itemId);
      const productSize = size ? String(size) : "N/A";
      setCartItems((prev) => {
        const next = structuredClone(prev);
        if (!next[productId]) next[productId] = {};
        next[productId][productSize] = (next[productId][productSize] || 0) + quantity;
        if (!token) safeWrite(GUEST_CART_KEY, next);
        return next;
      });
      toast.success("Added to cart");
      if (token) syncCartToServer("add", { itemId: productId, size: productSize, quantity });
      return true;
    },
    [token, syncCartToServer]
  );

  const updateQuantity = useCallback(
    (itemId: string, size: string, quantity: number) => {
      if (quantity < 0) return;
      const productId = String(itemId);
      const productSize = String(size);
      setCartItems((prev) => {
        const next = structuredClone(prev);
        if (quantity === 0) {
          delete next[productId]?.[productSize];
          if (next[productId] && !Object.keys(next[productId]).length) delete next[productId];
        } else {
          if (!next[productId]) next[productId] = {};
          next[productId][productSize] = quantity;
        }
        if (!token) safeWrite(GUEST_CART_KEY, next);
        return next;
      });
      if (token) syncCartToServer("update", { itemId: productId, size: productSize, quantity });
    },
    [token, syncCartToServer]
  );

  const removeFromCart = useCallback(
    (itemId: string, size: string) => {
      const productId = String(itemId);
      const productSize = String(size);
      setCartItems((prev) => {
        const next = structuredClone(prev);
        delete next[productId]?.[productSize];
        if (next[productId] && !Object.keys(next[productId]).length) delete next[productId];
        if (!token) safeWrite(GUEST_CART_KEY, next);
        return next;
      });
      toast.success("Item removed from cart");
      if (token) syncCartToServer("remove", { itemId: productId, size: productSize });
    },
    [token, syncCartToServer]
  );

  const clearCart = useCallback(() => {
    setCartItems({});
    setAppliedCoupon(null);
    if (!token) safeRemove(GUEST_CART_KEY);
    if (token) syncCartToServer("clear", {});
  }, [token, syncCartToServer]);

  const getCartCount = useCallback(
    () =>
      Object.values(cartItems).reduce(
        (total, sizes) => total + Object.values(sizes).reduce((s, qty) => s + (qty > 0 ? qty : 0), 0),
        0
      ),
    [cartItems]
  );

  const getCartAmount = useCallback(() => {
    if (!products.length) return 0;
    return Object.entries(cartItems).reduce((total, [itemId, sizes]) => {
      const product = products.find((p) => p._id === itemId);
      if (!product) return total;
      const effectivePrice =
        product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price;
      return total + Object.entries(sizes).reduce((s, [, qty]) => s + (qty > 0 ? effectivePrice * qty : 0), 0);
    }, 0);
  }, [cartItems, products]);

  const getCartItems = useCallback(
    () =>
      Object.entries(cartItems).flatMap(([itemId, sizes]) => {
        const product = products.find((p) => p._id === itemId);
        if (!product) return [];
        return Object.entries(sizes)
          .filter(([, qty]) => qty > 0)
          .map(([size, quantity]) => ({ ...product, size, quantity }));
      }),
    [cartItems, products]
  );

  const getUserCart = useCallback(async (userToken: string) => {
    if (typeof window === "undefined") return;
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const { data } = await api.post(
        "/api/v1/cart/get",
        { userId },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      if (!data.success || !isMounted.current) return;
      const serverCart = data.cartData || {};
      const guestCart = safeRead<CartItemsState>(GUEST_CART_KEY, {});
      const hasGuest = Object.keys(guestCart).length > 0;
      if (hasGuest) {
        const merged = structuredClone(serverCart);
        const syncOps: Promise<any>[] = [];
        for (const [itemId, sizes] of Object.entries(guestCart)) {
          if (!merged[itemId]) merged[itemId] = {};
          for (const [size, qty] of Object.entries(sizes)) {
            merged[itemId][size] = (merged[itemId][size] || 0) + qty;
            syncOps.push(
              api.post(
                "/api/v1/cart/add",
                { userId, itemId, size, quantity: qty },
                { headers: { Authorization: `Bearer ${userToken}` } }
              )
            );
          }
        }
        await Promise.allSettled(syncOps);
        safeRemove(GUEST_CART_KEY);
        if (isMounted.current) setCartItems(merged);
      } else {
        if (isMounted.current) setCartItems(serverCart);
      }
    } catch (err) {
      console.error("getUserCart error", err);
    }
  }, []);

  const addToWishlist = useCallback(
    async (itemId: string) => {
      if (!token) {
        const current = safeRead<string[]>(GUEST_WISHLIST_KEY, []);
        if (current.includes(itemId)) return false;
        const updated = [...current, itemId];
        safeWrite(GUEST_WISHLIST_KEY, updated);
        setWishlistItems(updated);
        return true;
      }
      try {
        const { data } = await api.post("/api/v1/wishlist/add", { itemId });
        if (data.success) {
          setWishlistItems(data.wishlist);
          return true;
        }
      } catch (error) {
        console.error("addToWishlist error", error);
      }
      return false;
    },
    [token]
  );

  const removeFromWishlist = useCallback(
    async (itemId: string) => {
      if (!token) {
        const updated = safeRead<string[]>(GUEST_WISHLIST_KEY, []).filter((id) => id !== itemId);
        safeWrite(GUEST_WISHLIST_KEY, updated);
        setWishlistItems(updated);
        return true;
      }
      try {
        const { data } = await api.post("/api/v1/wishlist/remove", { itemId });
        if (data.success) {
          setWishlistItems(data.wishlist);
          return true;
        }
      } catch (err) {
        console.error("removeFromWishlist error", err);
      }
      return false;
    },
    [token]
  );

  const toggleWishlist = useCallback(
    async (itemId: string) => {
      if (!token) {
        const current = safeRead<string[]>(GUEST_WISHLIST_KEY, []);
        const isAdded = current.includes(itemId);
        const updated = isAdded ? current.filter((id) => id !== itemId) : [...current, itemId];
        safeWrite(GUEST_WISHLIST_KEY, updated);
        setWishlistItems(updated);
        return !isAdded;
      }
      try {
        const { data } = await api.post("/api/v1/wishlist/toggle", { itemId });
        if (data.success) {
          setWishlistItems(data.wishlist);
          return data.isAdded;
        }
      } catch (err) {
        console.error("toggleWishlist error", err);
      }
      return false;
    },
    [token]
  );

  const isInWishlist = useCallback((id: string) => wishlistItems.includes(id), [wishlistItems]);
  const getWishlistCount = useCallback(() => wishlistItems.length, [wishlistItems]);
  const getWishlistProducts = useCallback(
    () => products.filter((p) => wishlistItems.includes(p._id)),
    [products, wishlistItems]
  );

  const getUserWishlist = useCallback(async (userToken: string) => {
    try {
      const { data } = await api.post(
        "/api/v1/wishlist/get",
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      if (data.success && isMounted.current) {
        const serverWishlist: string[] = data.wishlist || [];
        const guestWishlist = safeRead<string[]>(GUEST_WISHLIST_KEY, []);
        const toAdd = guestWishlist.filter((id) => !serverWishlist.includes(id));
        if (toAdd.length) {
          await Promise.allSettled(
            toAdd.map((itemId) =>
              api.post("/api/v1/wishlist/add", { itemId }, { headers: { Authorization: `Bearer ${userToken}` } })
            )
          );
          safeRemove(GUEST_WISHLIST_KEY);
          setWishlistItems([...serverWishlist, ...toAdd]);
        } else {
          safeRemove(GUEST_WISHLIST_KEY);
          setWishlistItems(serverWishlist);
        }
      }
    } catch (err) {
      console.error("getUserWishlist error", err);
    }
  }, []);

  const applyCoupon = useCallback((coupon: Coupon) => setAppliedCoupon(coupon), []);
  const clearCoupon = useCallback(() => setAppliedCoupon(null), []);
  const getAppliedCoupon = useCallback(() => appliedCoupon, [appliedCoupon]);

  useEffect(() => {
    if (!token) {
      setCartItems(safeRead<CartItemsState>(GUEST_CART_KEY, {}));
      setWishlistItems(safeRead<string[]>(GUEST_WISHLIST_KEY, []));
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken && !token) {
        getUserCart(storedToken);
        getUserWishlist(storedToken);
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      getUserCart(token);
      getUserWishlist(token);
    } else {
      setWishlistItems(safeRead<string[]>(GUEST_WISHLIST_KEY, []));
    }
  }, [token, getUserCart, getUserWishlist]);

  const value = useMemo(
    () => ({
      cartItems,
      setCartItems,
      wishlistItems,
      appliedCoupon,
      applyCoupon,
      clearCoupon,
      getAppliedCoupon,
      delivery_fee: 50,
      getDeliveryFee,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartCount,
      getCartAmount,
      getCartItems,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      getWishlistCount,
      getWishlistProducts,
    }),
    [
      cartItems,
      wishlistItems,
      appliedCoupon,
      getDeliveryFee,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartCount,
      getCartAmount,
      getCartItems,
      applyCoupon,
      clearCoupon,
      getAppliedCoupon,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      getWishlistCount,
      getWishlistProducts,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
