import React, { useContext, useEffect, useState } from 'react';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const { backendUrl, csrfToken } = useContext(shopContext)!;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying email...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setMessage('Invalid or missing verification token');
        setIsError(true);
        toast.error('Invalid or missing verification token');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      try {
        const response = await axios.get(`${backendUrl}/api/auth/verify-email`, {
          params: { token },
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          withCredentials: true,
        });
        if (response.data.success) {
          setMessage('Email verified successfully');
          toast.success('Email verified successfully');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setMessage(response.data.message || 'Failed to verify email');
          setIsError(true);
          toast.error(response.data.message || 'Failed to verify email');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error: any) {
        const message = error.response?.data?.message || 'Server error';
        if (error.response?.status === 400) {
          setMessage('Invalid or expired token');
          setIsError(true);
          toast.error('Invalid or expired token');
        } else {
          setMessage(message);
          setIsError(true);
          toast.error(message);
        }
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    verifyEmail();
  }, [backendUrl, csrfToken, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md p-8 bg-white border rounded-lg shadow-md text-center" dir="rtl">
        <p className={`text-lg ${isError ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
      </div>
    </div>
  );
};

export default VerifyEmail;