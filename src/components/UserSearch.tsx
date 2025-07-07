import React, { useState, useEffect } from 'react';
import { Search, User, MessageCircle } from 'lucide-react';
import api from '../config/api';
import { useNavigate } from 'react-router-dom';

interface SearchUser {
  id: number;
  username: string;
  name?: string;
}

const UserSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.auth.searchUsers(query.trim());
        setResults(res.data);
      } catch (err) {
        console.error('User search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  const handleConnect = async (userId: number) => {
    try {
      await api.connections.sendRequest(userId);
      alert('Connection request sent!');
    } catch (err) {
      console.error('Error sending connection request:', err);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-md">
      <div className="flex items-center border rounded-lg px-3 py-2 mb-4">
        <Search className="h-5 w-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search verified users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full focus:outline-none"
        />
      </div>
      {loading && <p className="text-center text-gray-500">Searching...</p>}
      {!loading && results.length === 0 && query && (
        <p className="text-center text-gray-500">No users found.</p>
      )}
      <ul className="divide-y">
        {results.map((user) => (
          <li key={user.id} className="flex items-center py-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {user.name || user.username}
              </p>
              <p className="text-gray-500 text-sm">@{user.username}</p>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg mr-2"
              onClick={() => handleConnect(user.id)}
            >
              Connect
            </button>
            <button
              className="text-blue-600 hover:text-blue-800"
              onClick={() => navigate(`/profile/${user.username}`)}
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserSearch; 