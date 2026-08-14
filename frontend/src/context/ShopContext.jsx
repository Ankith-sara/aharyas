/**
 * ShopContext — re-export barrel
 *
 * This file is intentionally thin. All state lives in the three
 * focused contexts below. Import from here for a single entry-point,
 * or import directly from the source context for tree-shaking.
 *
 * Usage:
 *   import { useCart, useAuth, useProducts } from '@/context/ShopContext';
 */

export { useAuth }     from './AuthContext';
export { useProducts } from './ProductContext';
export { useCart }     from './CartContext';
