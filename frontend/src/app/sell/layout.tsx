import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell With Aharyas | Partner With Us',
  description: 'Join Aharyas as a seller or artisan partner. Showcase your handcrafted creations to a global audience. Rural to Global.',
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
