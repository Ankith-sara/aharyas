import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Aharyas',
  description: 'Read the terms and conditions governing your use of the Aharyas website and purchase of our handcrafted products.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
