import * as React from 'react';
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, ChevronRight } from 'lucide-react';
import { fetchUser } from '../middleware/auth';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [selectedSetting, setSelectedSetting] = useState<'account' | 'username' | 'password'>('account');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [feedback, setFeedback] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '/api';

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
      const response = await authFetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setUser({ ...user, username: newUsername });
      } else {
        setError(data.error || 'Failed to update username.');
      }
    } catch (err) {
      setError('An error occurred while updating username.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const response = await authFetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      setError('An error occurred while updating password.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen flex flex-col justify-center items-center gap-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      {message && <p className="text-green-600 mb-2">{message}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 mb-4 md:mb-0">
          <div className="bg-white shadow rounded divide-y divide-gray-200">
            <div onClick={() => setSelectedSetting('account')} className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${selectedSetting === 'account' ? 'bg-gray-100' : ''}`}>
              <UserIcon className="h-6 w-6 text-blue-600" />
              <div className="ml-4 flex-1">
                <p className="font-medium text-gray-900">Account</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <div onClick={() => setSelectedSetting('username')} className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${selectedSetting === 'username' ? 'bg-gray-100' : ''}`}>
              <UserIcon className="h-6 w-6 text-blue-600" />
              <div className="ml-4 flex-1">
                <p className="font-medium text-gray-900">Update Username</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <div onClick={() => setSelectedSetting('password')} className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${selectedSetting === 'password' ? 'bg-gray-100' : ''}`}>
              <Lock className="h-6 w-6 text-blue-600" />
              <div className="ml-4 flex-1">
                <p className="font-medium text-gray-900">Change Password</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="md:w-2/3 md:pl-6">
          {selectedSetting === 'account' && (
            <div>
              <h2 className="text-xl font-bold mb-2">Account Information</h2>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          )}
          {selectedSetting === 'username' && (
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Update Username</h2>
              <div>
                <label className="block mb-1">New Username</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="border rounded w-full p-2" required />
              </div>
              <button type="submit" className="btn btn-primary">Save</button>
            </form>
          )}
          {selectedSetting === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Change Password</h2>
              <div>
                <label className="block mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border rounded w-full p-2" required />
              </div>
              <div>
                <label className="block mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border rounded w-full p-2" required />
              </div>
              <button type="submit" className="btn btn-primary">Save</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
