import type { Metadata } from 'next';
import '../index.css';
import { Providers } from './providers';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import ChatIcon from '../components/ChatIcon';
import CookieConsent from '../components/CookieConsent';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: {
    default: 'Aharyas — Handcrafted Indian Fashion & Wearables',
    template: '%s | Aharyas',
  },
  description:
    'Discover handcrafted sarees, dresses, co-ords, linen shirts & artisan creations by Aharyas. Made in India with passion.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aharyas.com'),
  openGraph: {
    title: 'Aharyas — Handcrafted Indian Fashion',
    description: 'Discover handcrafted sarees, dresses, co-ords & artisan creations across India.',
    url: 'https://www.aharyas.com',
    siteName: 'Aharyas',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Aharyas Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aharyas — Handcrafted Indian Fashion',
    description: 'Discover handcrafted sarees, dresses, co-ords & artisan creations across India.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Dancing+Script:wght@400..700&family=Hind+Mysuru:wght@300;400;500;600;700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Noto+Serif+Thai:wght@100..900&family=Oswald:wght@200..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-black min-h-screen flex flex-col font-montserrat">
        <Providers>
          <Navbar />
          <SearchBar />
          <main className="flex-1 page-enter">{children}</main>
          <ChatIcon />
          <CookieConsent />
          <Footer />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
