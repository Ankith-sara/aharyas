import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQs | Aharyas — Frequently Asked Questions',
  description: 'Find answers to common questions about Aharyas products, shipping, returns, sizing, and artisan partnerships.',
};

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
