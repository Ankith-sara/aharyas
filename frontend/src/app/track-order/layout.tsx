import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order | Aharyas',
  description: 'Track your Aharyas shipment in real-time. Enter your order ID to see live delivery status and tracking updates.',
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
