import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Details | Aharyas — Handcrafted Indian Fashion',
  description: 'View product details, images, sizing, and reviews. Handcrafted with care by Indian artisans.',
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
