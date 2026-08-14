import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Aharyas — Your Data, Protected',
  description: 'Learn how Aharyas (TATHASTA WEAVES LLP) collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
