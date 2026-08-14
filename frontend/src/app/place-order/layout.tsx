import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Place Order | Aharyas — Secure Checkout',
  description: 'Complete your purchase securely. Enjoy free shipping on orders above ₹999 with multiple payment options.',
};

export default function PlaceOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
