import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Verification | Aharyas',
  description: 'Verifying your payment. Please wait while we confirm your Aharyas order.',
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
