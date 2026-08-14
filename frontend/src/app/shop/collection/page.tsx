import type { Metadata } from 'next';
import CollectionClient from '../../../components/CollectionClient';

export const metadata: Metadata = {
  title: 'Shop Collection — Aharyas',
  description: 'Browse our full catalog of handcrafted clothing, sarees, dresses, and artisan home decor.',
};

export default function GeneralCollectionPage() {
  return <CollectionClient />;
}
