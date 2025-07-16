import React, { useContext } from 'react';
import { shopContext } from '../context/shopContext';
import { Link } from 'react-router-dom';

interface ProductItemProps {
  id: string;
  images: string[] | undefined;
  name: string;
  price: number;
}

const ProductItem: React.FC<ProductItemProps> = ({ id, images, name, price }) => {
  const { currency} = useContext(shopContext)!;

  return (
    <div className="group relative block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <Link to={`/product/${id}`} className="block">
        <div className="relative overflow-hidden bg-gray-100 aspect-square">
          {images && Array.isArray(images) && images.length > 0 ? (
            <img
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              src={images[0]}
              alt={name || 'product'}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
              No image
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 truncate" title={name}>
            {name}
          </h3>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {price}{currency}
          </p>
        </div>
      </Link>
      
   
    </div>
  );
};

export default ProductItem;