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

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      setNewUsername(user.username ?? '');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await authFetch.put('/api/users/profile', { 
        username: newUsername
      });
      const data = response.data;
      if (response.status === 200) {
        setMessage(data.message);
        setUser({ ...user, username: newUsername });
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
              onChange={(e) => setNewUsername(e.target.value)} 
              className="border rounded w-full p-2" 
              required 
              minLength={3}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
