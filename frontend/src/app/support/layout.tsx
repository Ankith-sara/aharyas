import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support | Aharyas — Help Centre',
  description: 'Get help with your Aharyas orders, products, returns, or account. Our support team is here for you.',
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
