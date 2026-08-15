import type { Metadata } from 'next';
import '../index.css';
import { Providers } from './providers';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import Footer from '../components/Footer';
import CookieConsent from '../components/CookieConsent';
import ChatDrawer from '../components/ChatDrawer';

export const metadata: Metadata = {
  title: {
    default: 'Aharyas — Handcrafted Indian Fashion & Artisan Wearables',
    template: '%s | Aharyas',
  },
  description:
    'Discover handcrafted sarees, dresses, co-ords, linen shirts & artisan creations by Aharyas. Made in India with passion.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Noto+Serif+Thai:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="bg-white text-black min-h-screen flex flex-col font-sans selection:bg-black selection:text-white">
        <Providers>
          <Navbar />
          <SearchBar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <CookieConsent />
          <ChatDrawer />
        </Providers>
      </body>
    </html>
  );
}
