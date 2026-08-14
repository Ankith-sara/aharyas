import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Handcrafted Products | Aharyas',
  description: 'Browse our curated collection of handcrafted sarees, dresses, co-ords, linen shirts, and artisan creations. Filter by category, price, and brand.',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
