import * as React from 'react';
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import { apiClient as authFetch } from '../middleware/auth';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      setNewUsername(user.username ?? '');
    }
  }, [user, navigate]);

  if (!user) return null;

  const validateUsername = (username: string): string | null => {
    if (!username || username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    
    // Check if username contains only lowercase letters, numbers, underscores, and hyphens
    const regex = /^[a-z0-9_-]+$/;
    if (!regex.test(username)) {
      return 'Username can only contain lowercase letters, numbers, underscores, and hyphens';
    }
    
    return null;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase(); // Convert to lowercase automatically
    setNewUsername(value);
    
    // Real-time validation
    const validationMsg = validateUsername(value);
    setValidationError(validationMsg || '');
    
    // Clear previous messages when user starts typing
    if (message) setMessage('');
    if (error) setError('');
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    // Final validation before submission
    const validationMsg = validateUsername(newUsername);
    if (validationMsg) {
      setValidationError(validationMsg);
      return;
    }
    
    try {
      const response = await authFetch.put('/api/users/profile', { 
        username: newUsername
      });
      const data = response.data;
      if (response.status === 200) {
        setMessage(data.message);
        setUser({ ...user, username: newUsername });
        setValidationError('');
      } else {
        setError(data.error || 'Failed to update username.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred while updating username.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col justify-center items-center">
      <div className="w-full bg-white shadow rounded p-6">
        <div className="flex items-center justify-center mb-6">
          <UserIcon className="h-10 w-10 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold">Update Username</h1>
        </div>
        
        {message && <p className="text-green-600 mb-4 text-center">{message}</p>}
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Current Username: <span className="font-normal">{user.username}</span></label>
            <label className="block mb-1 font-medium">New Username</label>
            <input 
              type="text" 
              value={newUsername} 
              onChange={handleUsernameChange}
              className={`border rounded w-full p-2 ${validationError ? 'border-red-500' : 'border-gray-300'}`}
              required 
              minLength={3}
              placeholder="Enter lowercase username"
            />
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Username will be automatically converted to lowercase. Only letters, numbers, underscores, and hyphens are allowed.
            </p>
          </div>
          <button 
            type="submit" 
            disabled={!!validationError || !newUsername.trim()}
            className={`w-full font-bold py-2 px-4 rounded transition-colors ${
              validationError || !newUsername.trim()
                ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
