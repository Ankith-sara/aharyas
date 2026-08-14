import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile | Aharyas',
  description: 'Manage your Aharyas account, update your details, and view your order history.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
