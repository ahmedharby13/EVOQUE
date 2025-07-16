// Enhanced Collection.tsx (cleaned and styled filter sidebar with slider UI improvements)
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { shopContext } from '../context/shopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subCategory: string;
  sizes: string[];
  stock: number;
  date: number;
  bestseller: boolean;
  ratings: number;
  averageRating: number;
}

const Collection: React.FC = () => {
  const { products, search, setSearch, showSearch, setShowSearch } = useContext(shopContext)!;
  const [showFilters, setShowFilters] = useState(false);
  const [filterProducts, setFilterProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: Infinity });
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortType, setSortType] = useState<string>('relevant');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
      const uniqueSubCategories = Array.from(new Set(products.map((p) => p.subCategory)));
      setCategories(uniqueCategories);
      setSubCategories(uniqueSubCategories);
    }
    setLoading(false);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products.slice();
    if (showSearch && search.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          item.description.toLowerCase().includes(search.trim().toLowerCase())
      );
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) => selectedCategories.includes(item.category));
    }
    if (selectedSubCategories.length > 0) {
      filtered = filtered.filter((item) => selectedSubCategories.includes(item.subCategory));
    }
    filtered = filtered.filter((item) => item.price >= priceRange.min && item.price <= priceRange.max);
    filtered = filtered.filter((item) => (item.averageRating || 0) >= minRating);
    if (inStockOnly) {
      filtered = filtered.filter((item) => item.stock > 0);
    }
    switch (sortType) {
      case 'low-high':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'high-low':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => b.date - a.date);
        break;
      default:
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    return filtered;
  }, [products, search, showSearch, selectedCategories, selectedSubCategories, priceRange, minRating, inStockOnly, sortType]);

  useEffect(() => {
    setFilterProducts(filteredProducts);
  }, [filteredProducts]);

  const toggleCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleSubCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedSubCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setPriceRange({ min: 0, max: Infinity });
    setMinRating(0);
    setInStockOnly(false);
    setSearch('');
    setShowSearch(false);
    setSortType('relevant');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t">
      {/* FILTER SIDEBAR */}
      <div className="min-w-64">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <p className="text-base font-semibold">FILTERS</p>
          <img src={assets.dropdown_icon} className={`h-2 sm:hidden ${showFilters ? 'rotate-90' : ''}`} />
        </div>

        <div className={`${showFilters ? '' : 'hidden'} sm:block mt-3 space-y-4 text-sm`}>
          {/* Categories */}
          <div>
            <p className="font-medium mb-1">CATEGORIES</p>
            {categories.map((category) => (
              <label key={category} className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  value={category}
                  checked={selectedCategories.includes(category)}
                  onChange={toggleCategory}
                />
                {category}
              </label>
            ))}
          </div>

          {/* Subcategories */}
          <div>
            <p className="font-medium mb-1">SUBCATEGORIES</p>
            {subCategories.map((sub) => (
              <label key={sub} className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  value={sub}
                  checked={selectedSubCategories.includes(sub)}
                  onChange={toggleSubCategory}
                />
                {sub}
              </label>
            ))}
          </div>
<div>
  <p className="font-medium text-sm mb-1">PRICE</p>
  <div className="flex gap-2">
    <input
      type="number"
      placeholder="Min"
      value={priceRange.min === 0 ? '' : priceRange.min}
      onChange={(e) => setPriceRange({ ...priceRange, min: parseFloat(e.target.value) || 0 })}
      className="w-24 px-2 py-1 border border-gray-300 rounded  focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
    <input
      type="number"
      placeholder="Max"
      value={priceRange.max === Infinity ? '' : priceRange.max}
      onChange={(e) => setPriceRange({ ...priceRange, max: parseFloat(e.target.value) || Infinity })}
      className="w-24 px-2 py-1 border border-gray-300 rounded  focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  </div>
</div>
          {/* Rating */}
          <div>
            <p className="font-medium mb-1">MINIMUM RATING</p>
            {[1, 2, 3, 4, 5].map((rating) => (
              <label key={rating} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={minRating === rating}
                  onChange={() => setMinRating(rating)}
                />
                {rating} Stars & Up
              </label>
            ))}
          </div>

          {/* In Stock */}
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In Stock Only
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="text-orange-500 text-xs underline mt-3 hover:text-orange-600"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* MAIN PRODUCT GRID */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
          <Title text1="ALL" text2="COLLECTIONS" />
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
            >
              <option value="relevant">Sort by: Relevant</option>
              <option value="low-high">Sort by: Low to High</option>
              <option value="high-low">Sort by: High to Low</option>
              <option value="newest">Sort by: Newest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : filterProducts.length === 0 ? (
          <p className="text-center text-gray-500">No products found</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filterProducts.map((item) => (
              <ProductItem id={''} key={item._id} {...item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
