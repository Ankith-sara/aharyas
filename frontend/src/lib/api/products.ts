import type { Product } from '@aharyas/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface ProductsApiResponse {
  success: boolean;
  products: Product[];
}

/**
 * Server-side data access for the public product catalog.
 *
 * This backs the homepage sections (LatestCollection, BestSeller) via
 * Next.js's Data Cache: the request is cached for `revalidate` seconds
 * and tagged 'products' so an admin mutation can invalidate it early
 * with `revalidateTag('products')` (see /api/revalidate).
 *
 * This is the SAME public, unauthenticated endpoint
 * (GET /api/v1/product/all) the client-side ProductContext already
 * polls for cart/search/wishlist — nothing about that flow changes.
 * This function only gives Server Components a cached, no-JS-required
 * copy of the same data for the initial paint.
 *
 * On failure this returns an empty array rather than throwing, so a
 * backend hiccup degrades to "homepage renders without the SSR
 * head-start" instead of a broken page — the client ProductContext
 * still fetches independently and fills the sections in as normal.
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/product/all`, {
      next: {
        revalidate: 300, // 5 minutes — matches the backend's own s-maxage=300 on this route
        tags: ['products'],
      },
    });

    if (!res.ok) {
      console.error(`getAllProducts: backend responded ${res.status}`);
      return [];
    }

    const data: ProductsApiResponse = await res.json();
    return data.success ? data.products : [];
  } catch (error) {
    console.error('getAllProducts: fetch failed', error);
    return [];
  }
}
