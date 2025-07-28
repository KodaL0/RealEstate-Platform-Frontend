import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Clock, Search, 
  CheckCircle, XCircle, MessageCircle, Trash2,
  Bell, User
} from 'lucide-react';
import { UserConnection, Connection } from '../types';
import api from '../config/api';
import { useChat } from '../context/ChatContext';

const Connections: React.FC = () => {
  const navigate = useNavigate();
  const { getOrCreateDmThread } = useChat();
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [connectionsRes, requestsRes] = await Promise.all([
        api.connections.getMyConnections(),
        api.connections.getPendingRequests()
      ]);
      
      setConnections(connectionsRes.data);
      setPendingRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Failed to load connections.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      await api.connections.acceptRequest(connectionId);
      const acceptedRequest = pendingRequests.find(req => req.id === connectionId);
      if (acceptedRequest) {
        const newConnection: UserConnection = {
          connection_id: connectionId,
          user: {
            id: parseInt(acceptedRequest.from_user.toString()),
            username: acceptedRequest.from_user_username,
            date_joined: acceptedRequest.created_at
          },
          connected_since: new Date().toISOString()
        };
        setConnections(prev => [...prev, newConnection]);
        setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      setError('Failed to accept request.');
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      await api.connections.rejectRequest(connectionId);
      setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject request.');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Remove this connection?')) return;
    
    try {
      await api.connections.disconnect(connectionId);
      setConnections(prev => prev.filter(conn => conn.connection_id !== connectionId));
    } catch (error) {
      console.error('Error disconnecting:', error);
      setError('Failed to remove connection.');
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = pendingRequests.filter(req =>
    req.from_user_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-md mx-auto h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900 text-center">Connections</h1>
          <p className="text-sm text-gray-600 mt-1 text-center">
            {connections.length} connected • {pendingRequests.length} pending
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex-shrink-0">
            {error}
            <button onClick={() => setError(null)} className="float-right">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'connections'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Connections</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 relative ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <Bell className="h-4 w-4" />
                <span>Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'connections' ? 'connections' : 'requests'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'connections' ? (
            <div className="h-full flex flex-col">
              {filteredConnections.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {searchTerm ? 'No connections found' : 'No connections yet'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {searchTerm ? 'Try adjusting your search' : 'Start connecting with others'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Results count */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      {filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-2 space-y-2">
                      {filteredConnections.map((connection) => (
                        <div
                          key={connection.connection_id}
                          className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {connection.user.username}
                                </h4>
                                <p className="text-xs text-gray-600 truncate">
                                  Connected {new Date(connection.connected_since).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <button
                                onClick={async () => {
                                  try {
                                    const threadId = await getOrCreateDmThread(connection.user.id);
                                    navigate(`/chat/${threadId}`);
                                  } catch (error) {
                                    console.error('Error creating DM thread:', error);
                                  }
                                }}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                title="Message"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDisconnect(connection.connection_id)}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {filteredRequests.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {searchTerm ? 'No requests found' : 'No pending requests'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {searchTerm ? 'Try adjusting your search' : 'All caught up!'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Results count */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      {filteredRequests.length} pending request{filteredRequests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-2 space-y-2">
                      {filteredRequests.map((request) => (
                        <div
                          key={request.id}
                          className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {request.from_user_username}
                              </h4>
                              <p className="text-xs text-gray-600 truncate">
                                Requested {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="flex-1 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-1 shadow-sm hover:from-green-600 hover:to-green-700 transition-all"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="flex-1 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-1 shadow-sm hover:from-red-600 hover:to-red-700 transition-all"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections; 