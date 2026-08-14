import type { Metadata } from 'next';
import ProductClient from '../../../components/ProductClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const readable = slug.split('-').slice(0, -1).join(' ') || slug;
  const title = readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : 'Product';
  return {
    title: `${title} — Aharyas`,
    description: `Shop ${title} on Aharyas, handcrafted with excellence by Indian artisans.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return <ProductClient slug={slug} />;
}
