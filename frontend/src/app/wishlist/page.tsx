'use client';

import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import Title from '../../components/Title';
import ProductItem from '../../components/ProductItem';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { products } = useProducts();
  const { wishlistItems } = useCart();

  const wishlistedProducts = products.filter((p) => wishlistItems.includes(p._id));

  return (
    <div className="min-h-screen bg-white text-black mt-16 sm:mt-20">
      <div className="py-6 sm:py-10 px-4 sm:px-8 lg:px-20 max-w-7xl mx-auto">
        <div className="text-2xl sm:text-3xl mb-8">
          <Title text1="YOUR" text2="WISHLIST" />
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="py-16 sm:py-24 text-center border-t border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Heart size={24} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-light tracking-wide text-black mb-2">Your wishlist is empty</h2>
            <p className="text-xs text-gray-500 font-light max-w-sm mx-auto mb-8 leading-relaxed">
              Explore our handcrafted collections and save your favorite pieces to find them easily later.
            </p>
            <Link
              href="/shop/collection"
              className="inline-block px-8 py-3.5 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 gap-y-8 border-t border-gray-200 pt-8">
            {wishlistedProducts.map((item) => (
              <ProductItem
                key={item._id}
                id={item._id}
                image={item.images}
                name={item.name}
                price={item.price}
                discount={item.discount}
                company={item.company}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
