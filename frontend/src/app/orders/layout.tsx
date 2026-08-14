import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Orders | Aharyas',
  description: 'View your order history, track shipments, and manage returns for your Aharyas purchases.',
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
