import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Aharyas — Sign In to Your Account',
  description: 'Sign in to your Aharyas account to track orders, manage your wishlist, and shop handcrafted Indian fashion.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
