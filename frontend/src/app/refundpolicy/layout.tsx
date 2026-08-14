import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Return Policy | Aharyas',
  description: 'Understand Aharyas replacement and exchange policy. We support our artisan partners with a no-refund, exchange-only approach.',
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
