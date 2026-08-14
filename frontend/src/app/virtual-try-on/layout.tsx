import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Virtual Try-On | Aharyas',
  description: 'Try on Aharyas products virtually before you buy. See how handcrafted pieces look on you using our AR experience.',
};

export default function VirtualTryOnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
