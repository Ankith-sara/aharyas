import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Aharyas | Get in Touch With Us',
  description: "Reach out to Aharyas for support, partnerships, or artisan onboarding. We're here to help with orders, returns, and everything in between.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
