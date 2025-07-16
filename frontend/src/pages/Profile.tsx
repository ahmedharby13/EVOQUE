import React, { useContext, useState, useEffect } from 'react';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';

interface PasswordData {
  oldPassword?: string;
  password: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { backendUrl, csrfToken } = useContext(shopContext)!;
  const [cookies] = useCookies(['accessToken']);
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [passwordData, setPasswordData] = useState<PasswordData>({ password: '', confirmPassword: '' });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<'profile' | 'update-password' | 'forgot-password'>('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          `${backendUrl}/api/user/profile`,
          {},
          {
            headers: {
              Authorization: `Bearer ${cookies.accessToken}`,
              'X-CSRF-Token': csrfToken,
            },
            withCredentials: true,
          }
        );
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          toast.error(response.data.message || 'Failed to fetch profile data');
        }
      } catch (error: any) {
        const message = error.response?.data?.message || 'Server error';
        if (error.response?.status === 401) {
          toast.error('Unauthorized. Please log in again.');
          navigate('/login');
        } else {
          toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (cookies.accessToken) {
      fetchProfile();
    } else {
      navigate('/login');
    }
  }, [backendUrl, cookies.accessToken, csrfToken, navigate]);

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.password || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!validatePassword(passwordData.password)) {
      toast.error('Password must contain uppercase, lowercase, numbers, special characters, and be at least 8 characters long');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/update-password`,
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${cookies.accessToken}`,
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success('Password updated successfully');
        setPasswordData({ password: '', confirmPassword: '' });
        setSection('profile');
      } else {
        toast.error(response.data.message || 'Failed to update password');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Server error';
      if (error.response?.status === 400) {
        toast.error('Invalid old password');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast.error('Email is required');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/forgot-password`,
        { email: forgotPasswordEmail },
        {
          headers: {
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success('Password reset link sent to your email');
        setForgotPasswordEmail('');
        setSection('profile');
      } else {
        toast.error(response.data.message || 'Failed to send password reset link');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Server error';
      if (error.response?.status === 404) {
        toast.error('User not found');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            {section === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Profile</h2>
                {user ? (
                  <div className="mb-6">
                    <p className="text-gray-700 mb-2"><strong>Name:</strong> {user.name}</p>
                    <p className="text-gray-700 mb-4"><strong>Email:</strong> {user.email}</p>
                    <button
                      onClick={() => setSection('update-password')}
                      className="w-full bg-black text-white p-2 rounded hover:bg-orange-500 transition-colors"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => setSection('forgot-password')}
                      className="w-full mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Forgot Password
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">User data not found</p>
                )}
              </div>
            )}
            {section === 'update-password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <h2 className="text-2xl font-bold mb-6 text-center">Update Password</h2>
                <div>
                  <label className="block text-gray-700 mb-2">Old Password</label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword || ''}
                    onChange={handlePasswordChange}
                    placeholder="Enter old password"
                    className="w-full p-2 border rounded focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    name="password"
                    value={passwordData.password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="w-full p-2 border rounded focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="w-full p-2 border rounded focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-black text-white p-2 rounded ${
                      loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500'
                    } transition-colors`}
                  >
                    {loading ? 'Loading...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('profile')}
                    className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {section === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full p-2 border rounded focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-black text-white p-2 rounded ${
                      loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500'
                    } transition-colors`}
                  >
                    {loading ? 'Loading...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('profile')}
                    className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;