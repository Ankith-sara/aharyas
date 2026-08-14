import type { Metadata } from 'next';
import CollectionClient from '../../../components/CollectionClient';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const readable = category.replace(/-/g, ' ');
  const title = readable.charAt(0).toUpperCase() + readable.slice(1);
  return {
    title: `${title} Collection — Aharyas`,
    description: `Discover handcrafted ${readable} on Aharyas, sustainably crafted by Indian artisans.`,
  };
}

export default async function CategoryCollectionPage({ params }: Props) {
  const { category } = await params;
  return <CollectionClient categorySlug={category} />;
}
