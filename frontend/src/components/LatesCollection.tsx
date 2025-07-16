import React, { useContext,  } from 'react';
import { shopContext } from '../context/shopContext';
import Title from './Title';
import ProductItem from './ProductItem';

const LatestCollection: React.FC = () => {
  const { products,  } = useContext(shopContext)!;
  const latestProducts = [...products]
    .sort((a, b) => b.date - a.date)
    .slice(0, 10);

  return (
    <div className="my-10 px-4">
      <div className="text-center py-8 text-3xl">
        <Title text1={'LATEST'} text2={'COLLECTIONS'} />
        <p className="w-3/4 mx-auto text-xs sm:text-sm md:text-base text-gray-600">
          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 justify-items-center">
        {latestProducts.map((item) => (
          <div key={item._id} className="w-full max-w-xs bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
            <div className="relative overflow-hidden">
              <ProductItem
                id={item._id}
                images={item.images}
                name={item.name}
                price={item.price}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestCollection;