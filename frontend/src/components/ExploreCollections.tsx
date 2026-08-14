'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useProducts } from '../context/ProductContext';
import { ArrowUpRight } from 'lucide-react';
import Title from './Title';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/\s+/g, '-');

const CATEGORIES = [
  { name: 'Dresses', imageUrl: 'https://anemonevinkel.com/cdn/shop/files/K279881.jpg?v=1731666814&width=600', pos: 'center top', w: 600, h: 800, path: undefined },
  { name: 'Sarees', imageUrl: 'https://anemonevinkel.com/cdn/shop/files/K270743.jpg?v=1749735862&width=600', pos: 'center top', w: 600, h: 800, path: undefined },
  { name: 'Men Shirts', imageUrl: 'https://vasudhaavastrram.in/cdn/shop/files/Block_Print_Grey_Shirt_1024x1024.jpg?v=1750169679', pos: 'center top', w: 600, h: 800, path: undefined },
  { name: 'Men Co-ord Sets', imageUrl: 'https://vasudhaavastrram.in/cdn/shop/files/Indigo_Black_Co-ord_Set_1024x1024.jpg?v=1750166752', pos: 'center top', w: 600, h: 800, path: undefined },
  { name: 'Kondapalli Bommalu', imageUrl: 'https://ik.imagekit.io/g3ikw48o1/products/bharatanatyam-dancing-doll_1_wNPh4bVNQ.png?tr=w-900', pos: 'center center', w: 600, h: 800, path: undefined },
  { name: 'Earrings', imageUrl: 'https://ik.imagekit.io/g3ikw48o1/products/Earring.png', pos: 'center center', w: 600, h: 800, path: undefined },
  { name: 'Handbags', imageUrl: 'https://ik.imagekit.io/g3ikw48o1/products/bag.jpg?tr=w-600,q-80,f-auto', pos: 'center center', w: 600, h: 800, path: undefined },
  { name: 'Scented Candles', imageUrl: 'https://ik.imagekit.io/g3ikw48o1/products/somascents-jar-of-hearts-scented-soyjel-wax-cande-220g_1_6kPy5EKas.jpeg?tr=w-900', pos: 'center center', w: 600, h: 800, path: undefined },
  { name: 'Journals', imageUrl: 'https://ik.imagekit.io/g3ikw48o1/products/book.jpg?tr=w-600,q-80,f-auto', pos: 'center center', w: 600, h: 800, path: undefined },
  { name: 'Women Chappals', imageUrl: 'https://www.korakari.com/cdn/shop/files/LAHYMP-W011.jpg?format=webp&quality=75&v=1768302945&width=600', pos: 'center top', w: 600, h: 800, path: undefined },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 aspect-[3/4] w-full mb-3 rounded-sm" />
      <div className="bg-gray-200 h-3 w-2/3 rounded" />
    </div>
  );
}

function CategoryCard({ category, index, onClick }: { category: typeof CATEGORIES[0]; index: number; onClick?: (s: string) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    if (cardRef.current) io.observe(cardRef.current);
    return () => io.disconnect();
  }, []);

  const href = category.path ?? `/shop/${slugify(category.name)}`;

  return (
    <div
      ref={cardRef}
      style={{ transitionDelay: `${index * 60}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <Link
        href={href}
        onClick={() => !category.path && onClick?.(category.name)}
        className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
        aria-label={`Browse ${category.name}`}
      >
        <div className="relative overflow-hidden aspect-[3/4] bg-gray-100 mb-3">
          <img
            src={category.imageUrl}
            alt={category.name}
            width={category.w}
            height={category.h}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: category.pos }}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/400x533/f5f5f5/999999?text=${encodeURIComponent(category.name)}`;
            }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-3 right-3 w-9 h-9 bg-white flex items-center justify-center shadow-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
            aria-hidden="true"
          >
            <ArrowUpRight size={16} className="text-black" />
          </div>
        </div>
        <h3 className="text-sm sm:text-base font-medium tracking-wide text-gray-700 group-hover:text-black transition-colors duration-200">
          {category.name}
        </h3>
      </Link>
    </div>
  );
}

export default function ExploreCollections() {
  const { setSelectedSubCategory, isLoading } = useProducts();

  return (
    <section className="bg-white py-14 sm:py-16 px-4 sm:px-6 md:px-10 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Title text1="EXPLORE THE" text2="COLLECTIONS" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CATEGORIES.map((category, index) => (
              <CategoryCard
                key={category.name}
                category={category}
                index={index}
                onClick={setSelectedSubCategory}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
