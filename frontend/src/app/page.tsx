import type { Metadata } from 'next';
import Hero from '../components/Hero';
import LatestCollection from '../components/LatestCollection';
import BestSeller from '../components/BestSeller';
import WhatWeDo from '../components/WhatWeDo';
import ExploreCollections from '../components/ExploreCollections';
import CompanyProducts from '../components/CompanyProducts';
import NewsletterBox from '../components/NewsletterBox';

export const metadata: Metadata = {
  title: 'Aharyas — Handcrafted Indian Fashion & Artisan Wearables',
  description:
    'Discover handcrafted sarees, dresses, co-ords, linen shirts & artisan creations by Aharyas. Made in India with passion.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <ExploreCollections />
      <LatestCollection />
      <BestSeller />
      <CompanyProducts />
      {/* <WhatWeDo /> */}
      <NewsletterBox />
    </div>
  );
}
