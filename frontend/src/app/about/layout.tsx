import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Aharyas | Conscious Luxury, Indian Heritage',
  description: 'Aharyas connects 300+ rural Indian artisans to global markets. Founded by Avani Reddy — From Rural to Global.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
