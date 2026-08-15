import type { Metadata } from 'next';
import '../index.css';
import { Providers } from './providers';
import AdminShell from './AdminShell';

export const metadata: Metadata = {
  title: 'Aharyas Admin Portal',
  description: 'Management Portal for Aharyas Products, Orders, and Sellers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <AdminShell>{children}</AdminShell>
        </Providers>
      </body>
    </html>
  );
}
