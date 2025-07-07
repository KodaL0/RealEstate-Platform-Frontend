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
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.auth.searchUsers(query.trim());
        setResults(res.data);
        setIsOpen(true);
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

  const handleInputFocus = () => {
    if (query && results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicks on results
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white w-64 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
        <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search verified users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full focus:outline-none text-sm"
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && (query || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {loading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Searching...
            </div>
          )}
          
          {!loading && results.length === 0 && query && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No users found.
            </div>
          )}
          
          {!loading && results.length > 0 && (
            <div className="divide-y divide-gray-100">
              {results.map((user) => (
                <div key={user.id} className="flex items-center p-3 hover:bg-gray-50">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-gray-500 text-xs truncate">@{user.username}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-md transition-colors"
                      onClick={() => handleConnect(user.id)}
                    >
                      Connect
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-800 p-1"
                      onClick={() => navigate(`/profile/${user.username}`)}
                      title="View Profile"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch; 