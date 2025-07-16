import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createStore, Store } from 'tinybase';
import { useCookies } from 'react-cookie';

type ShopContextType = {
  getProductsData: () => Promise<void>;
  products: Product[];
  currency: string;
  delivery_fee: number;
  cartItem: CartData;
  setCartItem: (cartData: CartData) => void;
  addCartItem: (productId: string, size: string, quantity?: number) => Promise<void>;
  getCartData: () => Promise<void>;
  updateCartItem: (productId: string, size: string, quantity: number) => Promise<void>;
  removeCartItem: (productId: string, size: string) => Promise<void>;
  getCartAmount: () => number;
  backendUrl: string;
  token: string | null;
  setToken: (token: string | null) => void;
  csrfToken: string | null;
  setCsrfToken: (token: string | null) => void;
  search: string;
  setSearch: (search: string) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  mergeCart: () => Promise<void>;
  fetchCsrfToken: () => Promise<void>;
};

export interface Product {
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

interface CartItem {
  [size: string]: number;
}

interface CartData {
  [productId: string]: CartItem;
}

export const shopContext = createContext<ShopContextType | null>(null);

const ShopContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL ;
  const currency = 'Egb';
  const delivery_fee = 50;
  const [cookies, , removeCookie] = useCookies(['accessToken', 'refreshToken', 'userId']);
  const [store] = useState<Store>(() => createStore());
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItem, setCartItem] = useState<CartData>({});
  const [token, setToken] = useState<string | null>(cookies.accessToken || localStorage.getItem('accessToken'));
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const isAuthenticated = !!token;

  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/csrf-token`, { withCredentials: true });
      setCsrfToken(response.data.csrfToken);
      return response.data.csrfToken;
    } catch (error: any) {
      console.error('Error fetching CSRF token:', error.message);
      setCsrfToken(null);
      toast.error('Failed to fetch CSRF token');
      return null;
    }
  };

  const saveCartToStore = (cartData: CartData) => {
    store.setTable('cart', cartData);
    setCartItem(cartData);
  };

  const getCartFromStore = (): CartData => {
    const cartTable = store.getTable('cart');
    const cart: CartData = {};
    Object.entries(cartTable).forEach(([productId, sizes]) => {
      cart[productId] = sizes as CartItem;
    });
    return cart;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error('Failed to fetch products');
      }
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
      toast.error(error.message);
    }
  };

  const getCartData = async () => {
    if (!token || !csrfToken) return;
    try {
      const response = await axios.get(`${backendUrl}/api/cart`, {
        headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
        withCredentials: true,
      });
      if (response.data.success) {
        let cartData: CartData = {};
        if (response.data.cartItems && Array.isArray(response.data.cartItems)) {
          response.data.cartItems.forEach((item: { productId: string; size: string; quantity: number }) => {
            if (!cartData[item.productId]) {
              cartData[item.productId] = {};
            }
            if (item.quantity > 0) {
              cartData[item.productId][item.size] = item.quantity;
            }
          });
        }
        saveCartToStore(cartData);
      } else {
        console.error('getCartData failed:', response.data.message);
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message || 'Error fetching cart');
    }
  };

  const addCartItem = async (productId: string, size: string, quantity: number = 1): Promise<void> => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    if (!product.sizes.includes(size)) {
      toast.error('Invalid size');
      return;
    }
    if (product.stock < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    if (isAuthenticated && token && csrfToken) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/add`,
          { id: productId, size, quantity },
          {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          }
        );
        if (response.data.success) {
          const cartData: CartData = {};
          for (const [productId, sizes] of Object.entries(response.data.cartData)) {
            cartData[productId] = {};
            for (const [size, quantity] of Object.entries(sizes as Record<string, number>)) {
              cartData[productId][size] = quantity;
            }
          }
          saveCartToStore(cartData);
          toast.success('Added to cart');
        } else {
          toast.error(response.data.message || 'Failed to add to cart');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || 'Error adding to cart');
      }
    } else {
      const currentCart = getCartFromStore();
      const newCart = { ...currentCart };
      if (!newCart[productId]) {
        newCart[productId] = {};
      }
      newCart[productId][size] = (newCart[productId][size] || 0) + quantity;
      saveCartToStore(newCart);
      toast.success('Added to cart');
    }
  };

  const updateCartItem = async (productId: string, size: string, quantity: number): Promise<void> => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    if (!product.sizes.includes(size)) {
      toast.error('Invalid size');
      return;
    }
    if (quantity > 0 && product.stock < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    if (isAuthenticated && token && csrfToken) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/update`,
          { id: productId, size, quantity },
          {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          }
        );
        if (response.data.success) {
          const cartData: CartData = {};
          if (response.data.cartData && typeof response.data.cartData === 'object' && !Array.isArray(response.data.cartData)) {
            for (const [productId, sizes] of Object.entries(response.data.cartData)) {
              cartData[productId] = {};
              for (const [size, quantity] of Object.entries(sizes as Record<string, number>)) {
                cartData[productId][size] = quantity;
              }
            }
          } else if (Array.isArray(response.data.cartData)) {
            response.data.cartData.forEach((item: { productId: string; size: string; quantity: number }) => {
              if (!cartData[item.productId]) {
                cartData[item.productId] = {};
              }
              cartData[item.productId][item.size] = item.quantity;
            });
          }
          saveCartToStore(cartData);
          toast.success(response.data.message || 'Cart updated');
        } else {
          toast.error(response.data.message || 'Failed to update cart');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || 'Error updating cart');
      }
    } else {
      const currentCart = getCartFromStore();
      const newCart = { ...currentCart };
      if (quantity <= 0) {
        if (newCart[productId]) {
          delete newCart[productId][size];
          if (Object.keys(newCart[productId]).length === 0) {
            delete newCart[productId];
          }
        }
      } else {
        if (!newCart[productId]) {
          newCart[productId] = {};
        }
        newCart[productId][size] = quantity;
      }
      saveCartToStore(newCart);
      toast.success('Cart updated');
    }
  };

  const removeCartItem = async (productId: string, size: string): Promise<void> => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    if (!product.sizes.includes(size)) {
      toast.error('Invalid size');
      return;
    }

    if (isAuthenticated && token && csrfToken) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/remove`,
          { id: productId, size },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-CSRF-Token': csrfToken,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );
        if (response.data.success) {
          // Initialize cartData with current cart to preserve existing items
          const cartData: CartData = { ...getCartFromStore() };
          // Remove the specific item
          if (cartData[productId]) {
            delete cartData[productId][size];
            if (Object.keys(cartData[productId]).length === 0) {
              delete cartData[productId];
            }
          }
          // Update with server response if available
          if (response.data.cartData && Array.isArray(response.data.cartData)) {
            // Clear cartData and rebuild from server response
            const newCartData: CartData = {};
            response.data.cartData.forEach((item: { productId: string; size: string; quantity: number }) => {
              if (!newCartData[item.productId]) {
                newCartData[item.productId] = {};
              }
              if (item.quantity > 0) {
                newCartData[item.productId][item.size] = item.quantity;
              }
            });
            saveCartToStore(newCartData);
          } else {
            // If server doesn't return cartData, use the locally modified cart
            saveCartToStore(cartData);
          }
          toast.success(response.data.message || 'Removed from cart');
        } else {
          toast.error(response.data.message || 'Failed to remove from cart');
        }
      } catch (error: any) {
        console.error('Error removing cart item:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || error.message || 'Error removing from cart');
      }
    } else {
      const currentCart = getCartFromStore();
      const newCart = { ...currentCart };
      if (newCart[productId]) {
        delete newCart[productId][size];
        if (Object.keys(newCart[productId]).length === 0) {
          delete newCart[productId];
        }
        saveCartToStore(newCart);
        toast.success('Removed from cart');
      } else {
        toast.error('Item not found in cart');
      }
    }
  };

  const getCartAmount = (): number => {
    let totalAmount = 0;
    for (const productId in cartItem) {
      const product = products.find((p) => p._id === productId);
      if (product) {
        for (const size in cartItem[productId]) {
          const quantity = cartItem[productId][size];
          totalAmount += product.price * quantity;
        }
      }
    }
    return totalAmount;
  };

  const logout = async (): Promise<void> => {
    try {
      setToken(null);
      store.delTable('cart');
      setCartItem({});
      removeCookie('accessToken', { path: '/' });
      removeCookie('refreshToken', { path: '/' });
      removeCookie('userId', { path: '/' });
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Error logging out:', error.response?.data || error.message);
      toast.error('Error logging out: ' + error.message);
    }
  };

  const mergeCart = async () => {
    if (!token || !csrfToken) return;
    try {
      const localCartData = getCartFromStore();
      if (Object.keys(localCartData).length === 0) {
        return;
      }
      const response = await axios.post(
        `${backendUrl}/api/cart/merge`,
        { cartData: localCartData },
        {
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        store.delTable('cart');
        setCartItem({});
        toast.success(response.data.message || 'Cart merged successfully');
        await getCartData();
      } else {
        console.error('mergeCart failed:', response.data.message);
        toast.error(response.data.message || 'Failed to merge cart');
      }
    } catch (error: any) {
      console.error('Error merging cart:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message || 'Error merging cart');
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await fetchCsrfToken();
      await getProductsData();
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (token && csrfToken) {
      getCartData();
    }
  }, [token, csrfToken]);

  const contextValue: ShopContextType = {
    getProductsData,
    products,
    currency,
    delivery_fee,
    cartItem,
    setCartItem,
    addCartItem,
    getCartData,
    updateCartItem,
    removeCartItem,
    getCartAmount,
    backendUrl,
    token,
    setToken,
    csrfToken,
    setCsrfToken,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    logout,
    isAuthenticated,
    mergeCart,
    fetchCsrfToken,
  };

  return <shopContext.Provider value={contextValue}>{children}</shopContext.Provider>;
};

export default ShopContextProvider;