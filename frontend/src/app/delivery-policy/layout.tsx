import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Aharyas',
  description: 'Aharyas shipping timelines, delivery partners, free shipping threshold, and international delivery details.',
};

export default function DeliveryPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
