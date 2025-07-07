import React, { useState, useEffect } from 'react';
import { Search, User, MessageCircle, UserPlus, CheckCircle, Clock, UserMinus, Eye } from 'lucide-react';
import api from '../config/api';
import { useNavigate } from 'react-router-dom';

interface SearchUser {
  id: number;
  username: string;
  name?: string;
  connection_status: 'connected' | 'pending_sent' | 'pending_received' | 'rejected' | 'none' | 'self';
}

const UserSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [connectingUsers, setConnectingUsers] = useState<Set<number>>(new Set());
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

  const handleConnect = async (user: SearchUser) => {
    if (connectingUsers.has(user.id)) return; // Prevent double-clicks
    
    setConnectingUsers(prev => new Set(prev).add(user.id));
    
    try {
      if (user.connection_status === 'none' || user.connection_status === 'rejected') {
        // Send connection request
        await api.connections.sendRequest(user.id);
        
        // Update local state optimistically
        setResults(prev => prev.map(u => 
          u.id === user.id ? { ...u, connection_status: 'pending_sent' } : u
        ));
        
      } else if (user.connection_status === 'pending_received') {
        // Accept the pending request
        // First get the connection ID from pending requests
        const pendingRequests = await api.connections.getPendingRequests();
        const connectionRequest = pendingRequests.data.find((req: any) => 
          req.from_user_username === user.username
        );
        
        if (connectionRequest) {
          await api.connections.acceptRequest(connectionRequest.id);
          
          // Update local state optimistically
          setResults(prev => prev.map(u => 
            u.id === user.id ? { ...u, connection_status: 'connected' } : u
          ));
        }
      }
    } catch (err) {
      console.error('Error handling connection:', err);
      // Optionally show error message to user
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const handleUsernameClick = (username: string) => {
    navigate(`/${username}`);
    setIsOpen(false); // Close search dropdown
  };

  const handleProfileView = (username: string) => {
    navigate(`/${username}`);
    setIsOpen(false); // Close search dropdown
  };

  const getConnectionButtonConfig = (user: SearchUser) => {
    const isConnecting = connectingUsers.has(user.id);
    
    switch (user.connection_status) {
      case 'self':
        return {
          text: 'You',
          icon: User,
          disabled: true,
          variant: 'secondary' as const,
          onClick: null
        };
      case 'connected':
        return {
          text: 'Connected',
          icon: CheckCircle,
          disabled: true,
          variant: 'success' as const,
          onClick: null
        };
      case 'pending_sent':
        return {
          text: 'Pending',
          icon: Clock,
          disabled: true,
          variant: 'secondary' as const,
          onClick: null
        };
      case 'pending_received':
        return {
          text: isConnecting ? 'Accepting...' : 'Accept',
          icon: UserPlus,
          disabled: isConnecting,
          variant: 'primary' as const,
          onClick: () => handleConnect(user)
        };
      case 'rejected':
      case 'none':
      default:
        return {
          text: isConnecting ? 'Connecting...' : 'Connect',
          icon: UserPlus,
          disabled: isConnecting,
          variant: 'primary' as const,
          onClick: () => handleConnect(user)
        };
    }
  };

  const getButtonClasses = (variant: 'primary' | 'secondary' | 'success', disabled: boolean) => {
    const baseClasses = "text-xs font-semibold px-3 py-1 rounded-md transition-colors flex items-center space-x-1";
    
    if (disabled) {
      switch (variant) {
        case 'success':
          return `${baseClasses} bg-green-100 text-green-700 cursor-not-allowed`;
        case 'secondary':
          return `${baseClasses} bg-gray-100 text-gray-600 cursor-not-allowed`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-600 cursor-not-allowed`;
      }
    }
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white cursor-pointer`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white cursor-not-allowed`;
      case 'secondary':
        return `${baseClasses} bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer`;
      default:
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white cursor-pointer`;
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
              {results.map((user) => {
                const buttonConfig = getConnectionButtonConfig(user);
                const IconComponent = buttonConfig.icon;
                
                return (
                  <div key={user.id} className="flex items-center p-3 hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => handleUsernameClick(user.username)}
                        className="font-medium text-gray-900 text-sm truncate hover:text-blue-600 transition-colors text-left w-full"
                      >
                        {user.name || user.username}
                      </button>
                      <p className="text-gray-500 text-xs truncate">@{user.username}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {buttonConfig.onClick && (
                        <button
                          className={getButtonClasses(buttonConfig.variant, buttonConfig.disabled)}
                          onClick={buttonConfig.onClick}
                          disabled={buttonConfig.disabled}
                        >
                          <IconComponent className="h-3 w-3" />
                          <span>{buttonConfig.text}</span>
                        </button>
                      )}
                      
                      {!buttonConfig.onClick && (
                        <div className={getButtonClasses(buttonConfig.variant, buttonConfig.disabled)}>
                          <IconComponent className="h-3 w-3" />
                          <span>{buttonConfig.text}</span>
                        </div>
                      )}
                      
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => handleProfileView(user.username)}
                        title="View Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch; 