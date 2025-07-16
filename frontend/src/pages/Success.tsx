import React, { useContext, useEffect } from 'react';
import { shopContext } from '../context/shopContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { toast } from 'react-toastify';

const Success: React.FC = () => {
  const [, setCookie] = useCookies(['accessToken', 'refreshToken', 'userId']);
  const { setToken, mergeCart } = useContext(shopContext)!;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      setToken(accessToken);
      setCookie('accessToken', accessToken, { path: '/' });
      setCookie('refreshToken', refreshToken, { path: '/' });

      mergeCart();
      toast.success('Google login successful');
      navigate('/');
    } else {
      toast.error('Google login failed: Missing tokens');
      navigate('/login');
    }
  }, [setToken, setCookie, mergeCart, navigate, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p>Processing Google login...</p>
    </div>
  );
};

export default Success;