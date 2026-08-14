import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | Aharyas',
  description: "View and manage your saved handcrafted favourites. Add them to cart when you're ready.",
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
