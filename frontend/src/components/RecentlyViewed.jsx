import { useEffect, useState } from 'react';
import { useProducts } from '../context/ProductContext';
import Title from './Title';
import ProductItem from './ProductItem';

const RecentlyViewed = () => {
  const { getRecentlyViewed } = useProducts();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const viewed = getRecentlyViewed?.() || [];
    setItems(viewed);
  }, [getRecentlyViewed]);

  if (items.length === 0) return null;

  return (
    <section className="mt-10 p-6">
        <div className="text-center text-3xl py-2">
          <Title text1="RECENTLY" text2="VIEWED" />
        </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pt-5 gap-4 gap-y-6">
        {items.map(item => (
          <ProductItem
            key={item._id}
            id={item._id}
            slug={item.slug}
            name={item.name}
            price={item.price}
            image={item.images}
            company={item.company}
            discount={item.discount || 0}
          />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
