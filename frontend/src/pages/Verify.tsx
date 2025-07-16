import React, { useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useCookies } from 'react-cookie';

const Verify: React.FC = () => {
  const navigate = useNavigate();
  const { backendUrl, token, csrfToken, fetchCsrfToken } = useContext(shopContext)!;
  const [searchParams] = useSearchParams();
  const [cookies] = useCookies(['accessToken', 'refreshToken', 'userId']);
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('sessionId'); // Retrieve sessionId from query parameters

  const verifyStripe = async () => {
    try {
      if (!token) {
        toast.error('Please login to verify payment');
        navigate('/login');
        return;
      }
      const userId = cookies.userId;
      if (!userId || !sessionId || !orderId) {
        toast.error('Missing required data for payment verification');
        navigate('/cart');
        return;
      }

      // Re-fetch CSRF token if missing or potentially invalid
      let currentCsrfToken = csrfToken;
      if (!currentCsrfToken) {
        const fetchedToken = await fetchCsrfToken();
        currentCsrfToken = fetchedToken ?? null;
        if (!currentCsrfToken) {
          toast.error('Failed to fetch CSRF token');
          navigate('/cart');
          return;
        }
      }

      const response = await axios.post(
        `${backendUrl}/api/order/verifyStripe`,
        { orderId, sessionId, userId },
        {
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': currentCsrfToken },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/orders');
      } else {
        toast.error(response.data.message || 'Error verifying Stripe payment');
        navigate('/cart');
      }
    } catch (error: any) {
      console.error('Verify error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message || 'Error verifying Stripe payment');
      navigate('/cart');
    }
  };

  useEffect(() => {
    if (orderId && sessionId) {
      verifyStripe();
    } else {
      toast.error('Invalid order ID or session ID');
      navigate('/cart');
    }
  }, [orderId, sessionId]);

  return <div className="text-center text-gray-500">Processing...</div>;
};

export default Verify;