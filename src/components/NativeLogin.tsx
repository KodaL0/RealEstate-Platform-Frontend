import React, { useState } from 'react';
import { login, register } from '../middleware/auth';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

interface NativeLoginProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialMode?: 'login' | 'register';
}

export const NativeLogin: React.FC<NativeLoginProps> = ({
  onSuccess,
  onCancel,
  initialMode = 'login'
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    password2: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (!formData.password2) {
        newErrors.password2 = 'Please confirm your password';
      } else if (formData.password !== formData.password2) {
        newErrors.password2 = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      let response;
      
      if (isLogin) {
        response = await login(formData.email, formData.password);
        
        if (response.status === 200) {
          toast.success('Login successful!');
          
          // Update user context
          if (response.user) {
            setUser(response.user);
          }
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess();
          } else {
            // Default behavior: redirect to intended page or home
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
          }
        } else if (response.status === 403 && response.error?.includes('Email not verified')) {
          // Handle email verification required
          toast.error('Please verify your email before logging in');
          setErrors({ 
            general: 'Email verification required. Check your inbox for the verification email and click the link to activate your account.' 
          });
        } else {
          toast.error(response.error || 'Login failed');
          setErrors({ general: response.error || 'Login failed' });
        }
      } else {
        // Registration - use single password field as backend expects
        response = await register(formData.username, formData.email, formData.password);
        
        if (response.status === 201) {
          toast.success('Registration successful! Please check your email to verify your account.');
          setErrors({ 
            general: `Registration successful! A verification email has been sent to ${response.email || formData.email}. Please check your inbox and click the verification link to activate your account before logging in.` 
          });
          // Don't auto-login - user needs to verify email first
          // Clear form after successful registration
          setFormData({
            email: '',
            password: '',
            username: '',
            password2: ''
          });
        } else {
          // Handle specific registration errors
          if (response.details) {
            // Backend validation errors
            const backendErrors: Record<string, string> = {};
            if (response.details.email) {
              backendErrors.email = Array.isArray(response.details.email) 
                ? response.details.email[0] 
                : response.details.email;
            }
            if (response.details.username) {
              backendErrors.username = Array.isArray(response.details.username) 
                ? response.details.username[0] 
                : response.details.username;
            }
            if (response.details.password) {
              backendErrors.password = Array.isArray(response.details.password) 
                ? response.details.password[0] 
                : response.details.password;
            }
            setErrors(backendErrors);
          } else {
            setErrors({ general: response.error || 'Registration failed' });
          }
          toast.error(response.error || 'Registration failed');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
        toast.error(error.response.data.error);
      } else {
        setErrors({ general: 'An unexpected error occurred' });
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', username: '', password2: '' });
    setErrors({});
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isLogin ? 'Welcome back! Please sign in to your account.' : 'Join PropertPro today!'}
        </p>
      </div>

      {/* Native Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your username"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={formData.password2}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password2 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {errors.password2 && (
              <p className="text-red-500 text-xs mt-1">{errors.password2}</p>
            )}
          </div>
        )}

        {errors.general && (
          <div className={`text-sm p-3 rounded ${
            errors.general.includes('Registration successful') 
              ? 'text-green-700 bg-green-50 border border-green-200' 
              : 'text-red-500 bg-red-50 border border-red-200'
          }`}>
            {errors.general}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Toggle between login/register */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={handleToggleMode}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}; 