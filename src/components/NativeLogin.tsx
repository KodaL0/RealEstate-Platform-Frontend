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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Min 8 characters';
    }

    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = 'Username required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Min 3 characters';
      }

      if (!formData.password2) {
        newErrors.password2 = 'Confirm password';
      } else if (formData.password !== formData.password2) {
        newErrors.password2 = 'Passwords don\'t match';
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
          
          if (response.user) {
            setUser(response.user);
          }
          
          if (onSuccess) {
            onSuccess();
          } else {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
          }
        } else if (response.status === 403 && response.error?.includes('Email not verified')) {
          toast.error('Please verify your email');
          setErrors({ 
            general: 'Check your email for verification link' 
          });
        } else {
          toast.error(response.error || 'Login failed');
          setErrors({ general: response.error || 'Login failed' });
        }
      } else {
        response = await register(formData.username, formData.email, formData.password);
        
        if (response.status === 201) {
          toast.success('Account created! Check your email');
          setErrors({ 
            general: `Verification email sent to ${response.email || formData.email}` 
          });
          setFormData({
            email: '',
            password: '',
            username: '',
            password2: ''
          });
        } else {
          if (response.details) {
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
      
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
        toast.error(error.response.data.error);
      } else {
        setErrors({ general: 'An error occurred' });
        toast.error('An error occurred');
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
    <div className="bg-white rounded-lg shadow-lg p-4 w-full">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isLogin ? 'Welcome back!' : 'Join PropertPro'}
        </p>
      </div>

      {/* Native Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Username"
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
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Email"
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
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Password"
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.password2 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm password"
              disabled={isLoading}
            />
            {errors.password2 && (
              <p className="text-red-500 text-xs mt-1">{errors.password2}</p>
            )}
          </div>
        )}

        {errors.general && (
          <div className={`text-sm p-2 rounded-lg ${
            errors.general.includes('Verification email sent') 
              ? 'text-green-700 bg-green-50 border border-green-200' 
              : 'text-red-500 bg-red-50 border border-red-200'
          }`}>
            {errors.general}
          </div>
        )}

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Signing in...' : 'Creating...'}
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Toggle between login/register */}
      <div className="mt-4 text-center">
        <p className="text-base text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={handleToggleMode}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-500 font-semibold disabled:opacity-50 text-base"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}; 